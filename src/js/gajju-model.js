/**
 * GAJJU: the real CAD assembly, loaded from public/models/gajju2_robot.glb.
 *
 * The GLB (exported from GAJJU.step with trimesh) is the single source of truth for geometry.
 * Nothing here moves, scales or replaces individual parts in the assembled state; we only:
 *   - rotate the whole assembly from CAD Z-up millimetres into the scene's Y-up units,
 *   - generate vertex normals (the export has none, which is why it rendered black before),
 *   - assign materials by component (the export has no materials, only placeholder grey vertex colours),
 *   - attach CAD names and assembly groups so the explorer, explode and assembly guide can use them.
 *
 * Mesh order in the GLB is part_001 … part_104. The CAD names below follow that order; part_074 is a
 * small cylinder beside the OV2640 camera that carries no name in the export.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

// Resolved from the app's base URL (not the page URL), so it works on every route.
export const GAJJU_URL = new URL(
  `${import.meta.env.BASE_URL}models/gajju2_robot.glb`,
  location.origin,
).href;

/** Target length (nose to tail) of the robot in scene units. The CAD model is 327 mm long. */
const SCENE_LENGTH = 2.9;

export const GROUPS = {
  torso: { label: "Torso", step: 2 },
  electronics: { label: "Electronics & internal hardware", step: 3 },
  "leg-FL": { label: "Front-left leg", step: 4 },
  "leg-FR": { label: "Front-right leg", step: 4 },
  "leg-BL": { label: "Rear-left leg", step: 4 },
  "leg-BR": { label: "Rear-right leg", step: 4 },
  head: { label: "Head & neck", step: 5 },
  trunk: { label: "Trunk & gripper", step: 6 },
};

const SIDE = {
  FL: "front-left",
  FR: "front-right",
  BL: "rear-left",
  BR: "rear-right",
};

// [CAD name, readable name, kit component kind, assembly group, material]
const legParts = (s) => [
  [`LEG-${s}-thigh-v4`, `Thigh, ${SIDE[s]}`, "legs", `leg-${s}`, "aluminium"],
  [
    `LEG-${s}-kneecap-v4`,
    `Kneecap, ${SIDE[s]}`,
    "legs",
    `leg-${s}`,
    "graphite",
  ],
  [`LEG-${s}-shin-v4`, `Shin, ${SIDE[s]}`, "legs", `leg-${s}`, "aluminium"],
  [`LEG-${s}-boot-v4`, `Boot, ${SIDE[s]}`, "legs", `leg-${s}`, "graphite"],
  [`LEG-${s}-foot-v4`, `Foot pad, ${SIDE[s]}`, "legs", `leg-${s}`, "rubber"],
];

const PARTS = [
  ["TORSO-T1-body-v8", "Torso body", "shell", "torso", "aluminium"],
  ["TORSO-T7-battery-door-v8", "Battery door", "shell", "torso", "graphite"],
  ["TORSO-D1-deck-v5", "Electronics deck", "shell", "torso", "graphite"],
  ["TORSO-T2-hump-cap-v5", "Hump cap", "shell", "torso", "silver"],
  ["TORSO-T6F-front-clamp-v5", "Front clamp", "shell", "torso", "graphite"],
  ["TORSO-T6B-back-clamp-v5", "Back clamp", "shell", "torso", "graphite"],
  ...legParts("FL"),
  ...legParts("FR"),
  ...legParts("BL"),
  ...legParts("BR"),
  [
    "F14-GRIP-GC-gear-cover-v1",
    "Gripper gear cover",
    "trunk",
    "trunk",
    "graphite",
  ],
  [
    "F14-GRIP-GI-gear-idler-v1",
    "Gripper idler gear",
    "trunk",
    "trunk",
    "steel",
  ],
  [
    "F14-GRIP-GS-gear-servo-v1",
    "Gripper servo gear",
    "trunk",
    "trunk",
    "steel",
  ],
  [
    "F14-GRIP-JI-jaw-idler-side-v1",
    "Gripper jaw, idler side",
    "trunk",
    "trunk",
    "silver",
  ],
  [
    "F14-GRIP-JS-jaw-servo-side-v1",
    "Gripper jaw, servo side",
    "trunk",
    "trunk",
    "silver",
  ],
  [
    "F14-GRIP-TC-tip-servo-cover-v1",
    "Trunk tip servo cover",
    "trunk",
    "trunk",
    "graphite",
  ],
  ["F14-GRIP-TM-tip-main-v1", "Trunk tip", "trunk", "trunk", "aluminium"],
  ["F14-HEAD-EA-eye-adapter-v1", "Eye adapter", "head", "head", "eye"],
  ["F14-HEAD-H1L-head-L-v3", "Head shell, left", "head", "head", "aluminium"],
  ["F14-HEAD-H1R-head-R-v3", "Head shell, right", "head", "head", "aluminium"],
  ["F14-HEAD-H2-face-panel-v1", "Face panel", "head", "head", "graphite"],
  [
    "F14-HEAD-H3-depth-spacer-v1",
    "Depth sensor spacer",
    "head",
    "head",
    "black",
  ],
  ["F14-HEAD-H4-imu-shelf-v2", "IMU shelf", "head", "head", "graphite"],
  [
    "F14-HEAD-H5-jaali-cap-v1",
    "Jaali (lattice) cap",
    "head",
    "head",
    "graphite",
  ],
  ["F14-HEAD-H6L-ear-L-v1", "Ear, left", "head", "head", "silver"],
  ["F14-HEAD-H6R-ear-R-v1", "Ear, right", "head", "head", "silver"],
  ["F14-HEAD-N1a-neck-lower-v3", "Neck, lower", "head", "head", "graphite"],
  ["F14-HEAD-N1b-neck-upper-v3", "Neck, upper", "head", "head", "graphite"],
  ["F14-HEAD-N2-hub-v1", "Neck hub", "head", "head", "steel"],
  ["F14-HEAD-N3-turret-top-v4", "Neck turret top", "head", "head", "aluminium"],
  [
    "F14-HEAD-T1S-pivot-sleeve-v3",
    "Tilt pivot sleeve",
    "head",
    "head",
    "steel",
  ],
  ["F14-TAIL-TL2-tail-plug-v1", "Tail plug", "shell", "torso", "graphite"],
  [
    "F14-TORSO-SR-speaker-ring-v1",
    "Speaker ring",
    "shell",
    "torso",
    "accentRing",
  ],
  ["F14-TRUNK-K1-link1-v2", "Trunk link 1", "trunk", "trunk", "aluminium"],
  ["F14-TRUNK-K2-link2-v2", "Trunk link 2", "trunk", "trunk", "graphite"],
  ["F14-TRUNK-K3-link3-v2", "Trunk link 3", "trunk", "trunk", "aluminium"],
  [
    "F14-TRUNK-RA-sleeve-ring-A-v2",
    "Trunk sleeve ring A",
    "trunk",
    "trunk",
    "graphite",
  ],
  [
    "F14-TRUNK-RB-sleeve-ring-B-v1",
    "Trunk sleeve ring B",
    "trunk",
    "trunk",
    "graphite",
  ],
  ["F14-TRUNK-SP-root-spool-v1", "Trunk root spool", "trunk", "trunk", "steel"],
  [
    "REF-M10-nut-1-weight-pod",
    "M10 nut, weight pod 1",
    "hardware",
    "torso",
    "steel",
  ],
  [
    "REF-M10-nut-2-weight-pod",
    "M10 nut, weight pod 2",
    "hardware",
    "torso",
    "steel",
  ],
  [
    "REF-servo-MG946R-knee-FL",
    "MG946R knee servo, front-left",
    "servo-l",
    "leg-FL",
    "black",
  ],
  [
    "REF-servo-MG946R-knee-FR",
    "MG946R knee servo, front-right",
    "servo-l",
    "leg-FR",
    "black",
  ],
  [
    "REF-servo-MG946R-knee-BL",
    "MG946R knee servo, rear-left",
    "servo-l",
    "leg-BL",
    "black",
  ],
  [
    "REF-servo-MG946R-knee-BR",
    "MG946R knee servo, rear-right",
    "servo-l",
    "leg-BR",
    "black",
  ],
  [
    "REF-servo-MG946R-hip-FL",
    "MG946R hip servo, front-left",
    "servo-l",
    "leg-FL",
    "black",
  ],
  [
    "REF-servo-MG946R-hip-FR",
    "MG946R hip servo, front-right",
    "servo-l",
    "leg-FR",
    "black",
  ],
  [
    "REF-servo-MG946R-hip-BL",
    "MG946R hip servo, rear-left",
    "servo-l",
    "leg-BL",
    "black",
  ],
  [
    "REF-servo-MG946R-hip-BR",
    "MG946R hip servo, rear-right",
    "servo-l",
    "leg-BR",
    "black",
  ],
  [
    "REF-servo-MG946R-head-tilt",
    "MG946R head tilt servo",
    "servo-l",
    "head",
    "black",
  ],
  ["REF-servo-MG90S-trunk", "MG90S trunk servo", "servo-s", "trunk", "black"],
  ["REF-servo-MG90S-pan", "MG90S head pan servo", "servo-s", "head", "black"],
  [
    "REF-servo-MG90S-gripper",
    "MG90S gripper servo",
    "servo-s",
    "trunk",
    "black",
  ],
  ["REF-bearing-608-pan", "608 bearing, head pan", "hardware", "head", "steel"],
  ["REF-ESP32-CAM-board", "ESP32-CAM board", "camera", "head", "pcb"],
  [
    "REF-ESP32-CAM-pins-jumpers",
    "ESP32-CAM pins and jumpers",
    "camera",
    "head",
    "black",
  ],
  ["REF-OV2640-camera", "OV2640 camera", "camera", "head", "glass"],
  [null, "Camera lens (unnamed in the CAD export)", "camera", "head", "glass"],
  ["REF-MPU6050-GY521-head", "MPU6050 IMU, head", "sensors", "head", "pcb"],
  [
    "REF-VL53-depth-sensor",
    "VL53 time-of-flight depth sensor",
    "sensors",
    "head",
    "pcb",
  ],
  ["REF-INMP441-mic", "INMP441 microphone", "sensors", "head", "pcb"],
  [
    "REF-battery-2S1P-18650",
    "2S1P 18650 battery pack",
    "power",
    "electronics",
    "battery",
  ],
  [
    "REF-XL4016-servo-converter",
    "XL4016 servo power converter",
    "power",
    "electronics",
    "pcb",
  ],
  [
    "REF-PCA9685-servo-board",
    "PCA9685 16-channel servo driver",
    "driver",
    "electronics",
    "pcb",
  ],
  [
    "REF-Raspberry-Pi-Zero-2W",
    "Raspberry Pi Zero 2 W",
    "compute",
    "electronics",
    "pcb",
  ],
  ["REF-ESP32-DevKit", "ESP32 DevKit", "compute", "electronics", "pcb"],
  [
    "REF-MPU6050-GY521-torso",
    "MPU6050 IMU, torso",
    "sensors",
    "electronics",
    "pcb",
  ],
  ["REF-main-switch", "Main power switch", "power", "electronics", "black"],
  ["REF-fuse-holder-10A", "10 A fuse holder", "power", "electronics", "black"],
  ["REF-UBEC-5V-3A", "5 V 3 A UBEC regulator", "power", "electronics", "black"],
  [
    "REF-Wago-221-bus-and-capacitors",
    "Wago 221 power bus and capacitors",
    "power",
    "electronics",
    "graphite",
  ],
  [
    "REF-DC-charging-socket",
    "DC charging socket",
    "power",
    "electronics",
    "black",
  ],
  [
    "REF-amplifier-MAX98357A",
    "MAX98357A audio amplifier",
    "audio",
    "electronics",
    "pcb",
  ],
  [
    "REF-XL4016-terminals-L",
    "XL4016 terminals, left",
    "power",
    "electronics",
    "brass",
  ],
  [
    "REF-XL4016-terminals-R",
    "XL4016 terminals, right",
    "power",
    "electronics",
    "brass",
  ],
  ["REF-speaker-40mm", "40 mm speaker", "audio", "electronics", "black"],
  ...["LF27", "LF76", "LB27", "LB76", "RF27", "RF76", "RB27", "RB76"].map(
    (c) => {
      const leg = `${c[1] === "F" ? "F" : "B"}${c[0]}`; // LF27 → FL
      return [
        `REF-screw-M3x20-CSK-servo-ear-${c}`,
        `M3×20 servo-ear screw, ${SIDE[leg]}`,
        "hardware",
        `leg-${leg}`,
        "steel",
      ];
    },
  ),
  ...[1, 2, 3, 4].map((n) => [
    `REF-screw-M2.5x6-CSK-battery-door-${n}`,
    `M2.5×6 battery door screw ${n}`,
    "hardware",
    "torso",
    "steel",
  ]),
];

/* ------------------------------ Materials ------------------------------ */
function makeMaterial(kind) {
  switch (kind) {
    case "aluminium":
      return new THREE.MeshPhysicalMaterial({
        color: 0xa4abb4,
        metalness: 0.92,
        roughness: 0.36,
        clearcoat: 0.2,
        clearcoatRoughness: 0.5,
      });
    case "silver":
      return new THREE.MeshPhysicalMaterial({
        color: 0xc9ced5,
        metalness: 0.88,
        roughness: 0.28,
        clearcoat: 0.35,
        clearcoatRoughness: 0.35,
      });
    case "graphite":
      return new THREE.MeshStandardMaterial({
        color: 0x2c3139,
        metalness: 0.7,
        roughness: 0.42,
      });
    case "black":
      return new THREE.MeshStandardMaterial({
        color: 0x1b1e23,
        metalness: 0.15,
        roughness: 0.6,
      });
    case "rubber":
      return new THREE.MeshStandardMaterial({
        color: 0x141518,
        metalness: 0,
        roughness: 0.92,
      });
    case "steel":
      return new THREE.MeshStandardMaterial({
        color: 0xaab2bb,
        metalness: 1,
        roughness: 0.22,
      });
    case "brass":
      return new THREE.MeshStandardMaterial({
        color: 0xb48c4c,
        metalness: 1,
        roughness: 0.32,
      });
    case "pcb":
      return new THREE.MeshStandardMaterial({
        color: 0x173f63,
        metalness: 0.25,
        roughness: 0.5,
      });
    case "battery":
      return new THREE.MeshStandardMaterial({
        color: 0x2b3442,
        metalness: 0.45,
        roughness: 0.45,
      });
    case "glass":
      return new THREE.MeshPhysicalMaterial({
        color: 0x06090e,
        metalness: 0.3,
        roughness: 0.06,
        clearcoat: 1,
      });
    case "eye":
      return new THREE.MeshStandardMaterial({
        color: 0x0b1c22,
        metalness: 0.4,
        roughness: 0.3,
        emissive: 0x3de8ff,
        emissiveIntensity: 1.1,
      });
    case "accentRing":
      return new THREE.MeshStandardMaterial({
        color: 0x3a4049,
        metalness: 0.7,
        roughness: 0.4,
        emissive: 0x3de8ff,
        emissiveIntensity: 0.35,
      });
    default:
      return new THREE.MeshStandardMaterial({
        color: 0x9aa3ad,
        metalness: 0.6,
        roughness: 0.4,
      });
  }
}

/* ------------------------------ Loading ------------------------------ */
let assetPromise = null;
const progressListeners = new Set();

/** Subscribe to download progress (0–1). Returns an unsubscribe function. */
export function onGajjuProgress(cb) {
  progressListeners.add(cb);
  return () => progressListeners.delete(cb);
}

/**
 * Loads and prepares the GLB once per page. Resolves with shared geometries in CAD order.
 * Rejects with a readable error; callers must show it rather than substitute another robot.
 */
export function loadGajjuAsset() {
  if (assetPromise) return assetPromise;
  assetPromise = new Promise((resolve, reject) => {
    new GLTFLoader().load(
      GAJJU_URL,
      (gltf) => {
        prepare(gltf).then(resolve, (err) =>
          reject(
            new Error(
              `GAJJU model loaded but could not be prepared: ${err.message}`,
            ),
          ),
        );
      },
      (e) => {
        if (e.lengthComputable)
          progressListeners.forEach((cb) => cb(e.loaded / e.total));
      },
      (err) =>
        reject(
          new Error(
            `Could not load the GAJJU CAD model from ${GAJJU_URL}. ${err?.message || ""}`.trim(),
          ),
        ),
    );
  });
  return assetPromise;
}

/** Normals in a worker (≈1.5 s of work on a fast desktop) so the page never freezes; main thread as fallback. */
function generateNormals(input, crease) {
  const local = () =>
    import("./gajju-normals.worker.js").then((m) =>
      m.computeNormals(input, crease),
    );
  let worker;
  try {
    worker = new Worker(new URL("./gajju-normals.worker.js", import.meta.url), {
      type: "module",
    });
  } catch {
    return local();
  }
  return new Promise((resolve) => {
    worker.onmessage = ({ data }) => {
      worker.terminate();
      resolve(data);
    };
    worker.onerror = (e) => {
      e.preventDefault?.();
      worker.terminate();
      resolve(local());
    };
    worker.postMessage(
      { meshes: input, crease },
      input.flatMap((m) =>
        [m.position.buffer, m.index?.buffer].filter(Boolean),
      ),
    );
  });
}

async function prepare(gltf) {
  const meshes = [];
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => o.isMesh && meshes.push(o));
  meshes.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  if (meshes.length !== PARTS.length) {
    throw new Error(
      `expected ${PARTS.length} CAD parts, found ${meshes.length}`,
    );
  }
  // Copies, so transferring them to the worker doesn't detach the loader's buffers.
  const needs = meshes.map((m) => !m.geometry.attributes.normal);
  const input = meshes
    .filter((_, i) => needs[i])
    .map((m) => ({
      position: m.geometry.attributes.position.array.slice(),
      index: m.geometry.index?.array.slice() || null,
    }));
  const computed = input.length
    ? await generateNormals(input, THREE.MathUtils.degToRad(32))
    : [];
  let k = 0;
  return meshes.map((m, i) => {
    let g = m.geometry;
    if (needs[i]) {
      // Smooth curved surfaces, keep machined edges sharp. Placeholder vertex colours are dropped.
      const r = computed[k++];
      g.dispose();
      g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(r.position, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(r.normal, 3));
      g.setIndex(new THREE.BufferAttribute(r.index, 1));
    } else {
      g.deleteAttribute("color");
    }
    g.computeBoundingBox();
    g.computeBoundingSphere();
    g.userData.shared = true;
    return {
      nodeName: m.name,
      geometry: g,
      matrix: m.matrixWorld.clone(),
      meta: PARTS[i],
    };
  });
}

/* ------------------------------ Instances ------------------------------ */
/**
 * Builds one GAJJU instance from the loaded asset. Geometry is shared between instances;
 * materials are per mesh so a single part can be highlighted or faded.
 * Returns the same { group, parts, animate } contract as the procedural robots.
 */
export function createGajju(asset, { shadows = false, rig = false } = {}) {
  const group = new THREE.Group();
  group.name = "GAJJU";
  const orient = new THREE.Group(); // turn the robot so its face points at +Z (toward the default camera)
  orient.rotation.y = Math.PI;
  const cad = new THREE.Group(); // CAD space: Z-up, millimetres
  cad.rotation.x = -Math.PI / 2;
  group.add(orient);
  orient.add(cad);

  const meshes = asset.map(({ nodeName, geometry, matrix, meta }, i) => {
    const [cadName, label, kind, groupId, mat] = meta;
    const mesh = new THREE.Mesh(geometry, makeMaterial(mat));
    mesh.applyMatrix4(matrix);
    mesh.name = cadName || nodeName;
    mesh.castShadow = shadows;
    mesh.userData.partId = nodeName;
    if (mat === "eye") mesh.userData.glow = true;
    cad.add(mesh);
    return mesh;
  });
  // Optional procedural joints (hero walk). Parts keep their geometry; they are only re-parented
  // under pivot groups placed at the hip/knee/neck/trunk axes measured from the CAD parts.
  const gait = rig ? rigJoints(cad, meshes, asset) : null;

  // Scale from millimetres and sit the feet on y = 0, centred on the origin.
  const raw = new THREE.Box3().setFromObject(cad);
  const size = raw.getSize(new THREE.Vector3());
  const scale = SCENE_LENGTH / Math.max(size.x, size.y, size.z);
  cad.scale.setScalar(scale);
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(cad);
  const c = box.getCenter(new THREE.Vector3());
  orient.position.set(-c.x, -box.min.y, -c.z);
  group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(cad);
  const center = bounds.getCenter(new THREE.Vector3());

  // Per-part and per-group bounds in model space.
  const partBox = meshes.map((m) =>
    m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld),
  );
  const groupBox = {};
  meshes.forEach((m, i) => {
    const g = asset[i].meta[3];
    (groupBox[g] ||= new THREE.Box3()).union(partBox[i]);
  });

  // Exploded view: each assembly group moves along a designed direction, and its parts fan out a
  // little from the group's centre so relationships stay readable (no random radial scatter).
  const groupOffset = (g) => {
    const gc = groupBox[g].getCenter(new THREE.Vector3());
    if (g === "torso")
      return {
        base: new THREE.Vector3(0, 0, 0),
        spread: new THREE.Vector3(0.3, 0.55, 0.3),
      };
    if (g === "electronics")
      return {
        base: new THREE.Vector3(0, 1.05, 0),
        spread: new THREE.Vector3(1.0, 0.6, 0.9),
      };
    if (g === "head")
      return {
        base: new THREE.Vector3(0, 0.55, 0.3),
        spread: new THREE.Vector3(0.5, 0.4, 0.35),
      };
    if (g === "trunk")
      return {
        base: new THREE.Vector3(0, -0.1, 0.8),
        spread: new THREE.Vector3(0.45, 0.35, 0.45),
      };
    // Legs: outward on their own side, slightly down, and fore/aft.
    const sx = Math.sign(gc.x - center.x) || 1;
    const sz = Math.sign(gc.z - center.z) || 1;
    return {
      base: new THREE.Vector3(sx * 0.6, -0.12, sz * 0.32),
      spread: new THREE.Vector3(0.25, 0.45, 0.25),
    };
  };
  const offsets = Object.fromEntries(
    Object.keys(groupBox).map((g) => [g, groupOffset(g)]),
  );

  // Convert a model-space vector into the CAD group's local space (undo rotation + scale).
  const toLocal = new THREE.Matrix3().setFromMatrix4(
    new THREE.Matrix4().copy(cad.matrixWorld).invert(),
  );

  const parts = meshes.map((mesh, i) => {
    const [cadName, label, kind, groupId] = asset[i].meta;
    const { base, spread } = offsets[groupId];
    const pc = partBox[i].getCenter(new THREE.Vector3());
    const gc = groupBox[groupId].getCenter(new THREE.Vector3());
    const v = base.clone().add(pc.sub(gc).multiply(spread));
    return {
      id: asset[i].nodeName,
      index: i + 1,
      cadName: cadName || "(unnamed in CAD export)",
      name: label,
      kind,
      group: groupId,
      groupLabel: GROUPS[groupId].label,
      step: GROUPS[groupId].step,
      object: mesh,
      home: mesh.position.clone(),
      offset: v.applyMatrix3(toLocal),
    };
  });

  const eye = meshes.find((m) => m.userData.glow);
  return {
    group,
    parts,
    bounds,
    meshes,
    dimensionsMM: {
      length: Math.round(size.y),
      width: Math.round(size.x),
      height: Math.round(size.z),
    },
    animate(t, powered = true) {
      if (eye)
        eye.material.emissiveIntensity = powered
          ? 1 + Math.sin(t * 2) * 0.25
          : 0.05;
    },
    /**
     * Walking pose (only with { rig: true }). phase: gait cycles travelled; amount: 0 = standing,
     * 1 = full stride; t: time for the standing "breathing" idle. Deterministic for a given input.
     */
    pose(phase, amount, t = 0) {
      if (gait) gait.pose(phase, amount, t);
    },
    rigged: !!gait,
  };
}

/* ------------------------------ Procedural joints ------------------------------ */
// Joint locations come from the parts themselves (CAD mm, Z up, +Y = front):
//  - hip: the MG946R hip servo's output shaft, along X at the servo's outer face, 10.2 mm from
//    the servo body centre toward the servo's outer end (the shaft offset of an MG946R);
//  - knee: centre of the kneecap plate, which sits on the knee servo shaft;
//  - foot contact: bottom of the foot pad.
// Thigh, knee servo and kneecap turn about the hip; shin, boot and foot turn about the knee.
const LEGS = [
  { id: "FL", phase: 0 },
  { id: "BR", phase: 0 },
  { id: "FR", phase: 0.5 },
  { id: "BL", phase: 0.5 },
];
const STRIDE = 46; // mm a foot travels per step
const LIFT = 15; // mm swing-foot clearance
const SHAFT_OFFSET = 10.2; // mm, MG946R output shaft from body centre

function rigJoints(cad, meshes, asset) {
  const byName = (n) => meshes.find((m) => m.name === n);
  const boxOf = (m) => m.geometry.boundingBox.clone().applyMatrix4(m.matrix);
  const centre = (m) => boxOf(m).getCenter(new THREE.Vector3());
  const pivot = (parent, at, parentAt = null) => {
    const g = new THREE.Group();
    g.position.copy(at);
    if (parentAt) g.position.sub(parentAt);
    parent.add(g);
    cad.updateMatrixWorld(true);
    return g;
  };
  const attach = (g, names) =>
    names
      .map(byName)
      .filter(Boolean)
      .forEach((m) => g.attach(m));
  const angle = (v) => Math.atan2(v.z, v.y); // rotation about +X in the CAD Y–Z plane
  const yz = (a, b) => new THREE.Vector2(b.y - a.y, b.z - a.z);

  const legs = LEGS.map(({ id, phase }) => {
    const hipServo = byName(`REF-servo-MG946R-hip-${id}`);
    const kneecap = byName(`LEG-${id}-kneecap-v4`);
    const foot = byName(`LEG-${id}-foot-v4`);
    if (!hipServo || !kneecap || !foot) return null;
    const hc = centre(hipServo);
    const H = new THREE.Vector3(
      hc.x,
      hc.y + Math.sign(hc.y) * SHAFT_OFFSET,
      hc.z,
    );
    const K = centre(kneecap);
    const fb = boxOf(foot);
    const F = new THREE.Vector3(
      (fb.min.x + fb.max.x) / 2,
      (fb.min.y + fb.max.y) / 2,
      fb.min.z,
    );
    const hip = pivot(cad, H);
    attach(hip, [
      `LEG-${id}-thigh-v4`,
      `LEG-${id}-kneecap-v4`,
      `REF-servo-MG946R-knee-${id}`,
    ]);
    const knee = pivot(hip, K, H);
    attach(knee, [
      `LEG-${id}-shin-v4`,
      `LEG-${id}-boot-v4`,
      `LEG-${id}-foot-v4`,
    ]);
    const hk = yz(H, K);
    const kf = yz(K, F);
    const hf = yz(H, F);
    return {
      hip,
      knee,
      H,
      K,
      F,
      phase,
      L1: hk.length(),
      L2: kf.length(),
      thighRest: Math.atan2(hk.y, hk.x),
      shinRest: Math.atan2(kf.y, kf.x),
      side: Math.sign(hf.x * hk.y - hf.y * hk.x) || 1, // which way the knee bends
    };
  }).filter(Boolean);

  // Head pans/nods about the neck hub; the trunk swings about its root spool.
  const groupOf = (g) => meshes.filter((m, i) => asset[i].meta[3] === g);
  const hub = byName("F14-HEAD-N2-hub-v1");
  const spool = byName("F14-TRUNK-SP-root-spool-v1");
  let head = null,
    trunk = null;
  if (hub && spool) {
    const hp = centre(hub);
    const sp = centre(spool);
    head = pivot(cad, hp);
    groupOf("head").forEach((m) => head.attach(m));
    trunk = pivot(head, sp, hp);
    groupOf("trunk").forEach((m) => trunk.attach(m));
  }

  const T = new THREE.Vector2();
  function solve(leg, ty, tz) {
    // Two-link IK in the Y–Z plane: thigh from H, shin to the foot target.
    T.set(ty - leg.H.y, tz - leg.H.z);
    const d = THREE.MathUtils.clamp(
      T.length(),
      Math.abs(leg.L1 - leg.L2) + 0.5,
      leg.L1 + leg.L2 - 0.5,
    );
    const base = Math.atan2(T.y, T.x);
    const a1 = Math.acos(
      THREE.MathUtils.clamp(
        (leg.L1 * leg.L1 + d * d - leg.L2 * leg.L2) / (2 * leg.L1 * d),
        -1,
        1,
      ),
    );
    const thigh = base + leg.side * a1;
    const ky = leg.L1 * Math.cos(thigh);
    const kz = leg.L1 * Math.sin(thigh);
    const shin = Math.atan2(T.y - kz, T.x - ky);
    const dHip = thigh - leg.thighRest;
    leg.hip.rotation.x = dHip;
    leg.knee.rotation.x = shin - leg.shinRest - dHip;
  }

  return {
    pose(phase, amount, t) {
      const TAU = Math.PI * 2;
      // Body bob: two dips per cycle while walking, slow breathing while standing.
      const bob =
        amount * 2.2 * Math.cos(phase * TAU * 2) +
        (1 - amount) * 0.6 * Math.sin(t * 1.6);
      cad.position.y = bob * cad.scale.x;
      for (const leg of legs) {
        const u = (((phase + leg.phase) % 1) + 1) % 1;
        let dy, dz;
        if (u < 0.5) {
          // swing: lift and carry the foot forward
          const s = u / 0.5;
          dy = -STRIDE / 2 + STRIDE * (s * s * (3 - 2 * s));
          dz = LIFT * Math.sin(Math.PI * s);
        } else {
          // stance: foot on the ground, sliding back under the body as it moves forward
          const s = (u - 0.5) / 0.5;
          dy = STRIDE / 2 - STRIDE * s;
          dz = 0;
        }
        // Feet stay on the ground: subtract the body bob from the target height.
        solve(leg, leg.F.y + dy * amount, leg.F.z + dz * amount - bob);
      }
      if (head) {
        head.rotation.z =
          amount * 0.05 * Math.sin(phase * TAU) +
          (1 - amount) * 0.03 * Math.sin(t * 0.5);
        head.rotation.x = amount * 0.025 * Math.sin(phase * TAU * 2);
        trunk.rotation.x =
          amount * 0.1 * Math.sin(phase * TAU + 1) + 0.03 * Math.sin(t * 0.9);
      }
    },
  };
}

/* ------------------------------ Studio ------------------------------ */
function gradientTexture(top, bottom) {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, top);
  grd.addColorStop(1, bottom);
  g.fillStyle = grd;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(61,232,255,0.55)");
  grd.addColorStop(0.45, "rgba(47,107,255,0.18)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const STUDIO_NAVY = 0x08111d;

/**
 * Premium product studio: deep navy backdrop, soft key + fill, cyan/blue rim, glossy dark floor with
 * (desktop) real reflections and soft shadows, and a subtle illuminated ring platform.
 * `renderer` is optional (snapshots pass none and get no shadows/reflection).
 */
export function addGajjuStudio(
  scene,
  {
    renderer = null,
    mobile = false,
    radius = 1.9,
    shadows = !!renderer,
    light = false,
  } = {},
) {
  const rich = !!renderer && !mobile && !light;
  scene.userData.fixedTheme = true; // the studio keeps its own look in both site themes
  // light: clean white "product photo" backdrop for store listings; otherwise the navy studio.
  scene.background = light
    ? gradientTexture("#ffffff", "#e9edf2")
    : gradientTexture("#0d1b2f", "#050a12");
  scene.fog = new THREE.Fog(light ? 0xeef1f5 : STUDIO_NAVY, 9, 26);

  const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x2c3746, 0.9);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(4, 7, 5);
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xb9d2ff, 1.0);
  fill.position.set(-5, 3, 3);
  scene.add(fill);
  const rimCyan = new THREE.DirectionalLight(0x3de8ff, 2.2);
  rimCyan.position.set(-3.5, 3, -5);
  scene.add(rimCyan);
  const rimBlue = new THREE.DirectionalLight(0x2f6bff, 1.8);
  rimBlue.position.set(4, 2, -5);
  scene.add(rimBlue);
  const under = new THREE.DirectionalLight(0x9fb4cc, 0.6); // keeps the underside readable
  under.position.set(0, -3, 2);
  scene.add(under);

  if (renderer) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  if (shadows) {
    key.castShadow = true;
    key.shadow.mapSize.set(rich ? 2048 : 1024, rich ? 2048 : 1024);
    const s = key.shadow.camera;
    s.left = s.bottom = -3;
    s.right = s.top = 3;
    s.near = 1;
    s.far = 20;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 4;
  }

  const floorGroup = new THREE.Group();
  scene.add(floorGroup);
  let reflector = null;
  if (rich) {
    reflector = new Reflector(new THREE.CircleGeometry(6, 64), {
      textureWidth: 1024,
      textureHeight: 1024,
      color: 0x7d8da3,
      clipBias: 0.003,
    });
    reflector.rotation.x = -Math.PI / 2;
    floorGroup.add(reflector);
  }
  // Glossy navy floor over the mirror, so reflections read as a polished surface rather than a mirror.
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(30, 96),
    // Unlit so rim lights don't wash it out; the reflection and glow pool provide the sheen.
    new THREE.MeshBasicMaterial({
      color: light ? 0xeef1f5 : 0x08111d,
      transparent: rich,
      opacity: rich ? 0.84 : 1,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.001;
  floor.receiveShadow = true;
  floorGroup.add(floor);
  // Contact shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(6, 64),
    new THREE.ShadowMaterial({ opacity: 0.5 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  shadow.receiveShadow = true;
  floorGroup.add(shadow);
  // Illuminated platform: soft glow pool + thin ring
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2.6, radius * 2.6),
    new THREE.MeshBasicMaterial({
      map: glowTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.22,
    }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.003;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.992, radius, 160),
    new THREE.MeshBasicMaterial({
      color: 0x3de8ff,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.004;
  const inner = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.7, radius * 0.704, 128),
    new THREE.MeshBasicMaterial({
      color: 0x2f6bff,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    }),
  );
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.004;
  if (!light) floorGroup.add(pool, ring, inner);

  if (reflector) {
    // Don't draw the floor layers into the mirror image itself.
    const hide = [floor, shadow, pool, ring, inner];
    const render = reflector.onBeforeRender;
    reflector.onBeforeRender = function (...args) {
      hide.forEach((o) => (o.visible = false));
      render.apply(this, args);
      hide.forEach((o) => (o.visible = true));
    };
  }

  return {
    key,
    ring,
    update(t) {
      ring.material.opacity = 0.5 + Math.sin(t * 1.6) * 0.12;
    },
    dispose() {
      reflector?.dispose();
    },
  };
}

/**
 * Camera placement that frames the whole model at a cinematic three-quarter front angle.
 * Fits the projected bounding-box corners so the robot fills `fill` of the view (0.7 ≈ 70%).
 */
export function frameCamera(
  camera,
  bounds,
  { fill = 0.7, direction = [0.95, 0.5, 1.25] } = {},
) {
  const cam = camera.clone();
  const target = bounds.getCenter(new THREE.Vector3());
  const dir = new THREE.Vector3(...direction).normalize();
  const corners = [];
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z])
        corners.push(new THREE.Vector3(x, y, z));
  const extent = (d) => {
    cam.position.copy(dir).multiplyScalar(d).add(target);
    cam.lookAt(target);
    cam.updateMatrixWorld(true);
    let m = 0;
    const p = new THREE.Vector3();
    for (const c of corners) {
      p.copy(c).project(cam);
      m = Math.max(m, Math.abs(p.x), Math.abs(p.y));
    }
    return m;
  };
  let lo = 0.5,
    hi = 200;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (extent(mid) > fill) lo = mid;
    else hi = mid;
  }
  return { position: dir.multiplyScalar(hi).add(target), target, distance: hi };
}
