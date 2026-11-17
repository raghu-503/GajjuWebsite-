// Generates crease-aware vertex normals for the GAJJU CAD meshes off the main thread.
// The GLB export has positions only; geometry is unchanged, normals are added.
import { BufferGeometry, BufferAttribute } from "three";
import {
  mergeVertices,
  toCreasedNormals,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";

export function computeNormals(meshes, crease) {
  return meshes.map(({ position, index }) => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(position, 3));
    if (index) g.setIndex(new BufferAttribute(index, 1));
    const r = mergeVertices(toCreasedNormals(g, crease));
    return {
      position: r.attributes.position.array,
      normal: r.attributes.normal.array,
      index: r.index.array,
    };
  });
}

if (
  typeof WorkerGlobalScope !== "undefined" &&
  self instanceof WorkerGlobalScope
) {
  self.onmessage = ({ data }) => {
    const out = computeNormals(data.meshes, data.crease);
    self.postMessage(
      out,
      out.flatMap((o) => [o.position.buffer, o.normal.buffer, o.index.buffer]),
    );
  };
}
