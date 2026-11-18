// 3D controller for the step-by-step build. The step list, detail text and buttons are rendered
// by components/home/Assembly.jsx, which calls goTo() whenever the current step changes.
import * as THREE from "three";
import { createStage, prefersReducedMotion } from "./stage.js";
import { setOpacity, setHighlight } from "./robot-model.js";
import {
  loadGajjuAsset,
  createGajju,
  addGajjuStudio,
  frameCamera,
} from "./gajju-model.js";
import { ASSEMBLY_STEPS } from "./data.js";
import { gsap } from "./animations.js";

// Camera for each step: which assembly groups to frame, from which direction, and how tightly.
const SHOTS = [
  { groups: null, dir: [1, 0.75, 1.2], fill: 0.78, exploded: true },
  { groups: ["torso"], dir: [1, 0.85, 1.1], fill: 0.8 },
  { groups: ["torso", "electronics"], dir: [0.6, 1.4, 0.9], fill: 0.8 },
  { groups: null, dir: [1.35, 0.35, 0.9], fill: 0.86 },
  { groups: ["head"], dir: [0.55, 0.55, 1.4], fill: 0.8 },
  { groups: ["head", "trunk"], dir: [0.9, 0.3, 1.4], fill: 0.82 },
  { groups: null, dir: [0.95, 0.5, 1.25], fill: 0.88 },
];

/**
 * @param {HTMLElement} host
 * @param {object} cb  onReady(), onError(message)
 * @param {number} initial  step shown once the model has loaded
 */
export function createAssembly(host, { onReady = () => {}, onError = () => {} } = {}, initial = 0) {
  const reduced = prefersReducedMotion();
  const dur = (d) => (reduced ? 0.01 : d);

  const stage = createStage(host, {
    fov: 30,
    position: [6, 3, 7],
    target: [0, 0.9, 0],
    exposure: 1.05,
    envIntensity: 0.6,
  });
  if (!stage) {
    onError("This browser cannot display 3D (WebGL is unavailable), so the GAJJU model cannot be shown.");
    return null;
  }

  let robot = null;
  let destroyed = false;
  const timers = new Set();
  const camTarget = new THREE.Vector3(0, 0.9, 0);
  const spin = { on: true, a: 0 };
  let current = initial;

  const { scene, camera, renderer, mobile } = stage;
  const studio = addGajjuStudio(scene, { renderer, mobile, radius: 2.1 });
  stage.onTick((dt, t) => {
    studio.update(t);
    if (robot) {
      robot.animate(t, current === ASSEMBLY_STEPS.length - 1);
      if (spin.on && !reduced) spin.a += dt * 0.25;
      robot.group.rotation.y += (spin.a - robot.group.rotation.y) * 0.08;
    }
    camera.lookAt(camTarget);
  });
  stage.start();
  loadGajjuAsset().then(
    (asset) => {
      if (destroyed) return;
      robot = createGajju(asset, { shadows: true });
      robot.parts.forEach((p) => (p.amt = 0));
      scene.add(robot.group);
      onReady();
      goTo(current, true);
    },
    (err) => {
      if (destroyed) return;
      console.error(err);
      onError(`${err.message} Check that public/models/gajju2_robot.glb is deployed with the site.`);
    },
  );

  function applyPart(p, amt, opacity, d = 0.9, delay = 0) {
    const o = { amt: p.amt, op: p.op ?? 1 };
    p.tween?.kill();
    p.tween = gsap.to(o, {
      amt,
      op: opacity,
      duration: dur(d),
      delay: reduced ? 0 : delay,
      ease: "power3.inOut",
      onUpdate: () => {
        p.amt = o.amt;
        p.op = o.op;
        p.object.position.copy(p.home).addScaledVector(p.offset, o.amt);
        setOpacity(p.object, o.op);
      },
      onComplete: () => {
        if (amt === 0) p.object.position.copy(p.home); // exact CAD position once assembled
      },
    });
  }

  /** Bounding box of the given groups in their assembled positions (or the whole robot). */
  function boxOf(groups, exploded) {
    if (!groups) {
      if (!exploded) return robot.bounds.clone();
      const b = new THREE.Box3();
      robot.parts.forEach((p) => b.union(p.object.geometry.boundingBox.clone().applyMatrix4(matrixAt(p, 1.15))));
      return b;
    }
    const b = new THREE.Box3();
    robot.parts
      .filter((p) => groups.includes(p.group))
      .forEach((p) => b.union(p.object.geometry.boundingBox.clone().applyMatrix4(matrixAt(p, 0))));
    return b;
  }
  const tmp = new THREE.Object3D();
  function matrixAt(p, amt) {
    // World matrix the part would have at a given explode amount, with the robot facing forward.
    const parent = p.object.parent;
    const rot = robot.group.rotation.y;
    robot.group.rotation.y = 0;
    robot.group.updateMatrixWorld(true);
    tmp.position.copy(p.home).addScaledVector(p.offset, amt);
    tmp.quaternion.copy(p.object.quaternion);
    tmp.scale.copy(p.object.scale);
    tmp.updateMatrix();
    const m = parent.matrixWorld.clone().multiply(tmp.matrix);
    robot.group.rotation.y = rot;
    robot.group.updateMatrixWorld(true);
    return m;
  }

  function goTo(n, immediate = false) {
    current = Math.max(0, Math.min(ASSEMBLY_STEPS.length - 1, n));
    const stepNo = current + 1;
    if (!robot) return;
    robot.parts.forEach((p) => {
      setHighlight(p.object, false);
      if (stepNo === 1) applyPart(p, 1.15, 1);
      else if (p.step < stepNo) applyPart(p, 0, 1);
      else if (p.step === stepNo) {
        if ((p.op ?? 1) < 0.05) {
          p.amt = 1.4;
          p.object.position.copy(p.home).addScaledVector(p.offset, 1.4);
        }
        applyPart(p, 0, 1, 1.1, 0.15);
        setHighlight(p.object, true, 0x3de8ff, 0.45);
        const id = setTimeout(() => {
          timers.delete(id);
          setHighlight(p.object, false);
        }, reduced ? 600 : 1800);
        timers.add(id);
      } else applyPart(p, 1.4, 0, 0.6);
    });

    // Turntable on the overview and the finished robot; face the camera for the build steps.
    spin.on = stepNo === 1 || stepNo === ASSEMBLY_STEPS.length;
    if (!spin.on) spin.a = Math.round(spin.a / (Math.PI * 2)) * Math.PI * 2;

    const shot = SHOTS[current];
    const framed = frameCamera(camera, boxOf(shot.groups, shot.exploded), { fill: shot.fill, direction: shot.dir });
    if (immediate) {
      camera.position.copy(framed.position);
      camTarget.copy(framed.target);
    } else {
      gsap.to(camera.position, { x: framed.position.x, y: framed.position.y, z: framed.position.z, duration: dur(1.3), ease: "power3.inOut" });
      gsap.to(camTarget, { x: framed.target.x, y: framed.target.y, z: framed.target.z, duration: dur(1.3), ease: "power3.inOut" });
    }
  }

  return {
    goTo,
    destroy() {
      destroyed = true;
      timers.forEach(clearTimeout);
      robot?.parts.forEach((p) => p.tween?.kill());
      gsap.killTweensOf([camera.position, camTarget]);
      stage.dispose();
    },
  };
}
