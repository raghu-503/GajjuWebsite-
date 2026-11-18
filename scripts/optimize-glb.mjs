// Lossless size reduction for the Gajju Mini GLB (public/models/gajju2_robot.glb).
//
//   node scripts/optimize-glb.mjs <input.glb> <output.glb>
//
// What it changes (the geometry the site builds stays identical):
//   1. Triangle indices: 32-bit → 16-bit where every value fits (each mesh has < 65,536 vertices).
//      Same index values, half the bytes.
//   2. Vertex colours (COLOR_0) are removed. They are the CAD export's placeholder grey and the
//      site deletes them on load anyway (gajju-model.js: g.deleteAttribute("color")).
// Nothing else is touched: positions (exact bytes), meshes, nodes, names and transforms are
// copied as they are. The script re-reads its output and checks positions and index values
// against the input, and exits with an error if anything differs.
import { readFileSync, writeFileSync } from 'node:fs';

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error('Usage: node scripts/optimize-glb.mjs <input.glb> <output.glb>');
  process.exit(1);
}

function parseGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('Not a GLB file');
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
  const binLen = buf.readUInt32LE(20 + jsonLen);
  const bin = buf.slice(28 + jsonLen, 28 + jsonLen + binLen);
  return { json, bin };
}

const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const TYPED = { 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };

/** A copy of an accessor's data as a typed array (handles offsets; no interleaving in this file). */
function readAccessor(json, bin, index) {
  const a = json.accessors[index];
  const bv = json.bufferViews[a.bufferView];
  if (bv.byteStride && bv.byteStride !== COMPONENTS[a.type] * TYPED[a.componentType].BYTES_PER_ELEMENT) {
    throw new Error(`Accessor ${index} is interleaved; not supported`);
  }
  const T = TYPED[a.componentType];
  const start = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const length = a.count * COMPONENTS[a.type];
  return new T(bin.buffer.slice(bin.byteOffset + start, bin.byteOffset + start + length * T.BYTES_PER_ELEMENT));
}

const src = parseGlb(readFileSync(input));
const out = JSON.parse(JSON.stringify(src.json));
out.accessors = [];
out.bufferViews = [];
const chunks = [];
let offset = 0;

function addView(typed, target) {
  const bytes = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
  const pad = (4 - (offset % 4)) % 4; // keep every view 4-byte aligned
  if (pad) {
    chunks.push(Buffer.alloc(pad));
    offset += pad;
  }
  out.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, ...(target && { target }) });
  chunks.push(bytes);
  offset += bytes.length;
  return out.bufferViews.length - 1;
}
function addAccessor(from, typed, componentType, target) {
  const a = { ...from, bufferView: addView(typed, target), byteOffset: 0, componentType };
  delete a.byteOffset;
  out.accessors.push(a);
  return out.accessors.length - 1;
}

let converted = 0;
let droppedColours = 0;
for (const mesh of out.meshes) {
  for (const prim of mesh.primitives) {
    // Positions: copied byte for byte.
    const posIndex = prim.attributes.POSITION;
    const positions = readAccessor(src.json, src.bin, posIndex);
    const newAttributes = { POSITION: addAccessor(src.json.accessors[posIndex], positions, 5126, 34962) };
    // Any other attribute except COLOR_0 would be copied too (this file has none).
    for (const [name, index] of Object.entries(prim.attributes)) {
      if (name === 'POSITION') continue;
      if (name === 'COLOR_0') {
        droppedColours++;
        continue;
      }
      const data = readAccessor(src.json, src.bin, index);
      newAttributes[name] = addAccessor(src.json.accessors[index], data, src.json.accessors[index].componentType, 34962);
    }
    prim.attributes = newAttributes;
    // Indices: 16-bit when every value fits.
    if (prim.indices != null) {
      const indices = readAccessor(src.json, src.bin, prim.indices);
      let max = 0;
      for (const v of indices) if (v > max) max = v;
      const narrow = max < 65536 && indices instanceof Uint32Array;
      const data = narrow ? Uint16Array.from(indices) : indices;
      if (narrow) converted++;
      prim.indices = addAccessor(src.json.accessors[prim.indices], data, narrow ? 5123 : src.json.accessors[prim.indices].componentType, 34963);
    }
  }
}

const bin = Buffer.concat(chunks);
const binPadded = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4)]);
out.buffers = [{ byteLength: binPadded.length }];
let jsonBuf = Buffer.from(JSON.stringify(out), 'utf8');
jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc((4 - (jsonBuf.length % 4)) % 4, 0x20)]);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + binPadded.length, 8);
const jsonHead = Buffer.alloc(8);
jsonHead.writeUInt32LE(jsonBuf.length, 0);
jsonHead.writeUInt32LE(0x4e4f534a, 4);
const binHead = Buffer.alloc(8);
binHead.writeUInt32LE(binPadded.length, 0);
binHead.writeUInt32LE(0x004e4942, 4);
const result = Buffer.concat([header, jsonHead, jsonBuf, binHead, binPadded]);

// ---- Verify: same meshes, same node names/transforms, identical positions and index values.
const check = parseGlb(result);
const fail = (m) => {
  console.error('VERIFY FAILED:', m);
  process.exit(1);
};
if (JSON.stringify(check.json.nodes) !== JSON.stringify(src.json.nodes)) fail('nodes differ');
if (check.json.meshes.length !== src.json.meshes.length) fail('mesh count differs');
src.json.meshes.forEach((mesh, mi) => {
  mesh.primitives.forEach((prim, pi) => {
    const q = check.json.meshes[mi].primitives[pi];
    const a = readAccessor(src.json, src.bin, prim.attributes.POSITION);
    const b = readAccessor(check.json, check.bin, q.attributes.POSITION);
    if (Buffer.compare(Buffer.from(a.buffer), Buffer.from(b.buffer)) !== 0) fail(`positions differ in mesh ${mi}`);
    const ia = readAccessor(src.json, src.bin, prim.indices);
    const ib = readAccessor(check.json, check.bin, q.indices);
    if (ia.length !== ib.length || ia.some((v, i) => v !== ib[i])) fail(`indices differ in mesh ${mi}`);
    if (q.attributes.COLOR_0 != null) fail('vertex colours still present');
  });
});

writeFileSync(output, result);
const before = readFileSync(input).length;
console.log(`${input} → ${output}`);
console.log(`  ${(before / 1048576).toFixed(2)} MB → ${(result.length / 1048576).toFixed(2)} MB (−${Math.round((1 - result.length / before) * 100)}%)`);
console.log(`  ${converted} index buffers → 16-bit, ${droppedColours} unused vertex-colour sets removed`);
console.log('  verified: nodes, positions and index values identical');
