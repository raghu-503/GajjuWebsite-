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
import { refreshIcons } from "./icons.js";

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

export function initAssembly(root) {
  const host = root.querySelector("[data-asm-stage]");
  const stepsEl = root.querySelector("[data-asm-steps]");
  const detail = root.querySelector("[data-asm-detail]");
  const bar = root.querySelector("[data-asm-bar]");
  const count = root.querySelector("[data-asm-count]");
  const prev = root.querySelector("[data-asm-prev]");
  const next = root.querySelector("[data-asm-next]");
  const reduced = prefersReducedMotion();
  const dur = (d) => (reduced ? 0.01 : d);

  stepsEl.innerHTML = ASSEMBLY_STEPS.map(
    (s, i) =>
      `<li><button type="button" data-step="${i}"><span class="asm__n">${i + 1}</span><span>${s.title}</span></button></li>`,
  ).join("");

  host.classList.add("gstage");
  const status = document.createElement("div");
  status.className = "gstage__status";
  status.setAttribute("role", "status");
  status.innerHTML =
    '<span class="gstage__spinner" aria-hidden="true"></span><span>Loading GAJJU CAD model…</span>';
  host.appendChild(status);

  const stage = createStage(host, {
    fov: 30,
    position: [6, 3, 7],
    target: [0, 0.9, 0],
    exposure: 1.05,
    envIntensity: 0.6,
  });
  let robot = null;
  const camTarget = new THREE.Vector3(0, 0.9, 0);
  const spin = { on: true, a: 0 };
  let current = 0;

  if (stage) {
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
        robot = createGajju(asset, { shadows: true });
        robot.parts.forEach((p) => (p.amt = 0));
        scene.add(robot.group);
        status.remove();
        goTo(current, true);
      },
      (err) => {
        console.error(err);
        status.classList.add("is-error");
        status.lastElementChild.textContent = `${err.message} Check that public/models/gajju2_robot.glb is deployed with the site.`;
      },
    );
  } else {
    status.classList.add("is-error");
    status.lastElementChild.textContent =
      "This browser cannot display 3D (WebGL is unavailable), so the GAJJU model cannot be shown.";
  }

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
      robot.parts.forEach((p) =>
        b.union(
          p.object.geometry.boundingBox.clone().applyMatrix4(matrixAt(p, 1.15)),
        ),
      );
      return b;
    }
    const b = new THREE.Box3();
    robot.parts
      .filter((p) => groups.includes(p.group))
      .forEach((p) =>
        b.union(
          p.object.geometry.boundingBox.clone().applyMatrix4(matrixAt(p, 0)),
        ),
      );
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
    const s = ASSEMBLY_STEPS[current];
    const stepNo = current + 1;

    stepsEl.querySelectorAll("[data-step]").forEach((b, i) => {
      b.classList.toggle("is-active", i === current);
      b.classList.toggle("is-done", i < current);
      b.setAttribute("aria-current", i === current ? "step" : "false");
    });
    bar.style.width = `${(stepNo / ASSEMBLY_STEPS.length) * 100}%`;
    count.textContent = `Step ${stepNo} of ${ASSEMBLY_STEPS.length}`;
    prev.disabled = current === 0;
    next.innerHTML =
      current === ASSEMBLY_STEPS.length - 1
        ? '<i data-lucide="rotate-ccw"></i>Start over'
        : 'Next step<i data-lucide="chevron-right"></i>';
    detail.innerHTML = `
      <span class="asm__big" aria-hidden="true">${String(stepNo).padStart(2, "0")}</span>
      <h3>${s.title}</h3>
      <p>${s.text}</p>
      <div class="asm__parts">${s.parts.map((x) => `<span class="pill">${x}</span>`).join("")}</div>
      <span class="asm__time"><i data-lucide="clock"></i>About ${s.time}</span>`;
    refreshIcons();
    gsap.fromTo(
      detail.children,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.05,
        duration: dur(0.5),
        ease: "power3.out",
      },
    );

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
        setTimeout(() => setHighlight(p.object, false), reduced ? 600 : 1800);
      } else applyPart(p, 1.4, 0, 0.6);
    });

    // Turntable on the overview and the finished robot; face the camera for the build steps.
    spin.on = stepNo === 1 || stepNo === ASSEMBLY_STEPS.length;
    if (!spin.on) spin.a = Math.round(spin.a / (Math.PI * 2)) * Math.PI * 2;

    const shot = SHOTS[current];
    const framed = frameCamera(
      stage.camera,
      boxOf(shot.groups, shot.exploded),
      { fill: shot.fill, direction: shot.dir },
    );
    if (immediate) {
      stage.camera.position.copy(framed.position);
      camTarget.copy(framed.target);
    } else {
      gsap.to(stage.camera.position, {
        x: framed.position.x,
        y: framed.position.y,
        z: framed.position.z,
        duration: dur(1.3),
        ease: "power3.inOut",
      });
      gsap.to(camTarget, {
        x: framed.target.x,
        y: framed.target.y,
        z: framed.target.z,
        duration: dur(1.3),
        ease: "power3.inOut",
      });
    }
  }

  prev.addEventListener("click", () => goTo(current - 1));
  next.addEventListener("click", () =>
    goTo(current === ASSEMBLY_STEPS.length - 1 ? 0 : current + 1),
  );
  stepsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]");
    if (b) goTo(Number(b.dataset.step));
  });
  root.addEventListener("keydown", (e) => {
    if (!root.contains(document.activeElement)) return;
    if (e.key === "ArrowRight") goTo(current + 1);
    if (e.key === "ArrowLeft") goTo(current - 1);
  });
  goTo(0);
}
