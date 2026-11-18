// "Every component has a purpose": 3D controller for inspecting the real GAJJU CAD assembly.
// The surrounding UI (group list, info panel, toolbar) is rendered by components/home/Explorer.jsx;
// this module owns the canvas, camera, picking and highlights, and reports back through callbacks.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createStage, prefersReducedMotion } from "./stage.js";
import { applyExplode, setHighlight } from "./robot-model.js";
import {
  loadGajjuAsset,
  createGajju,
  addGajjuStudio,
  frameCamera,
  GROUPS,
} from "./gajju-model.js";
import { gsap } from "./animations.js";

export const GROUP_DESC = {
  torso:
    "The aluminium-look torso shell: body, deck, hump cap, clamps, battery door, tail plug and speaker ring.",
  electronics:
    "Battery, power conversion, servo driver, Raspberry Pi Zero 2 W, ESP32, IMU and audio, all inside the torso.",
  "leg-FL":
    "Hip and knee servos drive the thigh, kneecap, shin, boot and foot pad.",
  "leg-FR":
    "Hip and knee servos drive the thigh, kneecap, shin, boot and foot pad.",
  "leg-BL":
    "Hip and knee servos drive the thigh, kneecap, shin, boot and foot pad.",
  "leg-BR":
    "Hip and knee servos drive the thigh, kneecap, shin, boot and foot pad.",
  head: "Head shells, ears and the pan-tilt neck, housing the ESP32-CAM, depth sensor, IMU and microphone.",
  trunk:
    "Three trunk links on a root spool, ending in a servo-driven two-jaw gripper.",
};
export { GROUPS };
const pad = (n, l = 3) => String(n).padStart(l, "0");

/**
 * @param {HTMLElement} host  element the canvas fills
 * @param {object} cb
 *   tip         element used as the hover tooltip
 *   onReady(groups)       [{ id, label, count }] once the model has loaded
 *   onError(message)      WebGL unavailable or the model failed to load
 *   onSelect(info|null)   { idx, name, desc, group } for the panel
 *   onHover(groupId|null) group highlighted from the 3D view or the list
 */
export function createExplorer(host, cb = {}) {
  const { tip, onReady = () => {}, onError = () => {}, onSelect = () => {}, onHover = () => {} } = cb;
  const reduced = prefersReducedMotion();
  const dur = (d) => (reduced ? 0.01 : d);

  const stage = createStage(host, {
    fov: 34,
    position: [6, 3, 7],
    target: [0, 0.9, 0],
    exposure: 1.05,
    envIntensity: 0.6,
  });
  if (!stage) {
    onError("This browser cannot display 3D (WebGL is unavailable), so the GAJJU model cannot be shown.");
    return null;
  }
  const { scene, camera, canvas, renderer, mobile } = stage;
  const studio = addGajjuStudio(scene, { renderer, mobile, radius: 2.2 });

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.enableZoom = false; // enabled once the visitor engages, so page scroll isn't hijacked
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.6;
  const onHostDown = () => {
    controls.enableZoom = true;
    host.setAttribute("data-lenis-prevent", "");
  };
  const onHostLeave = () => {
    controls.enableZoom = false;
    host.removeAttribute("data-lenis-prevent");
  };
  host.addEventListener("pointerdown", onHostDown);
  host.addEventListener("pointerleave", onHostLeave);
  let idle = 0;
  controls.addEventListener("start", () => {
    idle = 0;
    controls.autoRotate = false;
  });

  let robot = null;
  let home = null;
  let selected = null; // { type: 'part' | 'group', part?, group? }
  let hovered = null;
  let destroyed = false;
  const explode = { v: 0 };

  stage.onTick((dt, t) => {
    studio.update(t);
    robot?.animate(t);
    controls.update();
    idle += dt;
    if (idle > 6 && !selected && !reduced) controls.autoRotate = true;
  });
  stage.start();

  loadGajjuAsset().then(
    (asset) => {
      if (destroyed) return;
      robot = createGajju(asset, { shadows: true });
      scene.add(robot.group);
      home = frameCamera(camera, robot.bounds, { fill: 0.8 });
      controls.minDistance = home.distance * 0.25;
      controls.maxDistance = home.distance * 2.4;
      camera.position.copy(home.position);
      controls.target.copy(home.target);
      controls.update();
      const counts = {};
      robot.parts.forEach((p) => (counts[p.group] = (counts[p.group] || 0) + 1));
      onReady(Object.keys(GROUPS).map((g) => ({ id: g, label: GROUPS[g].label, count: counts[g] || 0 })));
    },
    (err) => {
      if (destroyed) return;
      console.error(err);
      onError(`${err.message} Check that public/models/gajju2_robot.glb is deployed with the site.`);
    },
  );

  const groupParts = (g) => robot.parts.filter((p) => p.group === g);
  function paint() {
    if (!robot) return;
    const selSet = new Set(
      selected?.type === "part" ? [selected.part] : selected?.type === "group" ? groupParts(selected.group) : [],
    );
    const hovSet = new Set(
      hovered?.type === "part" ? [hovered.part] : hovered?.type === "group" ? groupParts(hovered.group) : [],
    );
    robot.parts.forEach((p) => {
      if (selSet.has(p)) setHighlight(p.object, true, 0x3de8ff, 0.7);
      else if (hovSet.has(p)) setHighlight(p.object, true, 0x2f6bff, 0.35);
      else setHighlight(p.object, false);
    });
    onHover(hovered?.type === "group" ? hovered.group : null);
  }

  const box = new THREE.Box3();
  function focusOn(parts) {
    box.makeEmpty();
    parts.forEach((p) => box.expandByObject(p.object));
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    const dir = camera.position.clone().sub(controls.target).normalize();
    const dist = THREE.MathUtils.clamp(size * 2.2, home.distance * 0.35, home.distance);
    controls.autoRotate = false;
    gsap.to(controls.target, { x: center.x, y: center.y, z: center.z, duration: dur(0.9), ease: "power3.inOut" });
    const to = center.clone().add(dir.multiplyScalar(dist));
    gsap.to(camera.position, { x: to.x, y: to.y, z: to.z, duration: dur(0.9), ease: "power3.inOut" });
  }

  function select(sel, focus = true) {
    selected = sel;
    paint();
    if (!sel) return onSelect(null);
    if (sel.type === "part") {
      const p = sel.part;
      onSelect({
        idx: `${pad(p.index)} / ${pad(robot.parts.length)} · ${p.groupLabel}`,
        name: p.cadName,
        desc: p.name,
        group: p.group,
      });
    } else {
      onSelect({
        idx: `${groupParts(sel.group).length} parts`,
        name: GROUPS[sel.group].label,
        desc: GROUP_DESC[sel.group],
        group: sel.group,
      });
    }
    if (focus) focusOn(sel.type === "part" ? [sel.part] : groupParts(sel.group));
  }

  // Raycasting on the CAD meshes
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (e) => {
    if (!robot) return null;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(robot.meshes, false)[0];
    return hit ? robot.parts.find((p) => p.object === hit.object) : null;
  };
  let downAt = null;
  let raf = 0;
  canvas.addEventListener("pointerdown", (e) => (downAt = { x: e.clientX, y: e.clientY }));
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || e.buttons || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const p = pick(e);
      if (p !== hovered?.part) {
        hovered = p ? { type: "part", part: p } : null;
        paint();
      }
      canvas.style.cursor = p ? "pointer" : "grab";
      if (!tip) return;
      if (p) {
        const r = host.getBoundingClientRect();
        tip.hidden = false;
        tip.textContent = p.cadName;
        tip.style.transform = `translate(${e.clientX - r.left + 16}px, ${e.clientY - r.top + 12}px)`;
      } else tip.hidden = true;
    });
  });
  canvas.addEventListener("pointerleave", () => {
    if (tip) tip.hidden = true;
    hovered = null;
    paint();
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return;
    const p = pick(e);
    select(p ? { type: "part", part: p } : null, false);
  });

  const setMode = (exploded) => {
    if (!robot) return;
    gsap.killTweensOf(explode);
    gsap.to(explode, {
      v: exploded ? 1 : 0,
      duration: dur(1.2),
      ease: "power3.inOut",
      onUpdate: () => applyExplode(robot.parts, explode.v),
      onComplete: () => !exploded && robot.parts.forEach((p) => p.object.position.copy(p.home)),
    });
    if (!selected) {
      const k = exploded ? 1.35 : 1;
      const to = home.position.clone().sub(home.target).multiplyScalar(k).add(home.target);
      gsap.to(camera.position, { x: to.x, y: to.y, z: to.z, duration: dur(1.2), ease: "power3.inOut" });
      gsap.to(controls.target, {
        x: home.target.x,
        y: home.target.y + (exploded ? 0.25 : 0),
        z: home.target.z,
        duration: dur(1.2),
      });
    }
  };

  return {
    get ready() {
      return !!robot;
    },
    selectGroup(g) {
      if (robot) select({ type: "group", group: g });
    },
    hoverGroup(g) {
      hovered = g ? { type: "group", group: g } : null;
      paint();
    },
    clear() {
      select(null);
    },
    /** Step through individual parts (arrow keys). */
    step(dir) {
      if (!robot) return;
      const parts = robot.parts;
      const i = selected?.type === "part" ? parts.indexOf(selected.part) : -1;
      const n = dir > 0 ? (i + 1) % parts.length : (i - 1 + parts.length) % parts.length;
      select({ type: "part", part: parts[n] });
    },
    setMode,
    dolly(factor) {
      if (!robot) return;
      const offset = camera.position.clone().sub(controls.target);
      const len = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance);
      const to = controls.target.clone().add(offset.setLength(len));
      gsap.to(camera.position, { x: to.x, y: to.y, z: to.z, duration: dur(0.5), ease: "power2.out" });
    },
    reset() {
      if (!robot) return;
      select(null);
      setMode(false);
      gsap.to(camera.position, { x: home.position.x, y: home.position.y, z: home.position.z, duration: dur(1), ease: "power3.inOut" });
      gsap.to(controls.target, {
        x: home.target.x,
        y: home.target.y,
        z: home.target.z,
        duration: dur(1),
        ease: "power3.inOut",
        onComplete: () => (controls.autoRotate = !reduced),
      });
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      host.removeEventListener("pointerdown", onHostDown);
      host.removeEventListener("pointerleave", onHostLeave);
      gsap.killTweensOf([explode, camera.position, controls.target]);
      controls.dispose();
      stage.dispose();
    },
  };
}
