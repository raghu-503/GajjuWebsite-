// "Every component has a purpose": inspect the real GAJJU CAD assembly part by part.
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

const GROUP_DESC = {
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
const pad = (n, l = 3) => String(n).padStart(l, "0");

export function initExplorer(root) {
  const host = root.querySelector("[data-explorer-stage]");
  const list = root.querySelector("[data-explorer-list]");
  const tip = root.querySelector("[data-explorer-tip]");
  const idx = root.querySelector("[data-ex-idx]");
  const nameEl = root.querySelector("[data-ex-name]");
  const descEl = root.querySelector("[data-ex-desc]");
  const reduced = prefersReducedMotion();
  const dur = (d) => (reduced ? 0.01 : d);

  const status = document.createElement("div");
  status.className = "gstage__status";
  status.setAttribute("role", "status");
  status.innerHTML =
    '<span class="gstage__spinner" aria-hidden="true"></span><span>Loading GAJJU CAD model…</span>';
  host.appendChild(status);

  const stage = createStage(host, {
    fov: 34,
    position: [6, 3, 7],
    target: [0, 0.9, 0],
    exposure: 1.05,
    envIntensity: 0.6,
  });
  if (!stage) {
    status.classList.add("is-error");
    status.lastElementChild.textContent =
      "This browser cannot display 3D (WebGL is unavailable), so the GAJJU model cannot be shown.";
    root.querySelector(".explorer__tools")?.remove();
    return;
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
  host.addEventListener("pointerdown", () => {
    controls.enableZoom = true;
    host.setAttribute("data-lenis-prevent", "");
  });
  host.addEventListener("pointerleave", () => {
    controls.enableZoom = false;
    host.removeAttribute("data-lenis-prevent");
  });
  let idle = 0;
  controls.addEventListener("start", () => {
    idle = 0;
    controls.autoRotate = false;
  });

  let robot = null;
  let home = null;
  let selected = null; // { type: 'part' | 'group', part?, group? }
  let hovered = null;
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
      robot = createGajju(asset, { shadows: true });
      scene.add(robot.group);
      home = frameCamera(camera, robot.bounds, { fill: 0.8 });
      controls.minDistance = home.distance * 0.25;
      controls.maxDistance = home.distance * 2.4;
      camera.position.copy(home.position);
      controls.target.copy(home.target);
      controls.update();
      status.remove();
      buildList();
    },
    (err) => {
      console.error(err);
      status.classList.add("is-error");
      status.lastElementChild.textContent = `${err.message} Check that public/models/gajju2_robot.glb is deployed with the site.`;
      root.querySelector(".explorer__tools")?.remove();
    },
  );

  function buildList() {
    const counts = {};
    robot.parts.forEach((p) => (counts[p.group] = (counts[p.group] || 0) + 1));
    list.innerHTML = Object.keys(GROUPS)
      .map(
        (g) =>
          `<li><button type="button" data-group="${g}"><span class="dot"></span>${GROUPS[g].label}<span class="explorer__count">${counts[g] || 0}</span></button></li>`,
      )
      .join("");
  }

  const groupParts = (g) => robot.parts.filter((p) => p.group === g);
  function paint() {
    if (!robot) return;
    const selSet = new Set(
      selected?.type === "part"
        ? [selected.part]
        : selected?.type === "group"
          ? groupParts(selected.group)
          : [],
    );
    const hovSet = new Set(
      hovered?.type === "part"
        ? [hovered.part]
        : hovered?.type === "group"
          ? groupParts(hovered.group)
          : [],
    );
    robot.parts.forEach((p) => {
      if (selSet.has(p)) setHighlight(p.object, true, 0x3de8ff, 0.7);
      else if (hovSet.has(p)) setHighlight(p.object, true, 0x2f6bff, 0.35);
      else setHighlight(p.object, false);
    });
    const activeGroup =
      selected?.type === "group" ? selected.group : selected?.part?.group;
    list.querySelectorAll("[data-group]").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.group === activeGroup);
      b.classList.toggle(
        "is-hover",
        hovered?.type === "group" && hovered.group === b.dataset.group,
      );
    });
  }

  const box = new THREE.Box3();
  function focusOn(parts) {
    box.makeEmpty();
    parts.forEach((p) => box.expandByObject(p.object));
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    const dir = camera.position.clone().sub(controls.target).normalize();
    const dist = THREE.MathUtils.clamp(
      size * 2.2,
      home.distance * 0.35,
      home.distance,
    );
    controls.autoRotate = false;
    gsap.to(controls.target, {
      x: center.x,
      y: center.y,
      z: center.z,
      duration: dur(0.9),
      ease: "power3.inOut",
    });
    const to = center.clone().add(dir.multiplyScalar(dist));
    gsap.to(camera.position, {
      x: to.x,
      y: to.y,
      z: to.z,
      duration: dur(0.9),
      ease: "power3.inOut",
    });
  }

  function select(sel, focus = true) {
    selected = sel;
    paint();
    if (!sel) {
      idx.textContent = "—";
      nameEl.textContent = "Select a component";
      descEl.textContent =
        "Click any part of GAJJU, or pick an assembly from the list, to see what it is.";
      return;
    }
    if (sel.type === "part") {
      const p = sel.part;
      idx.textContent = `${pad(p.index)} / ${pad(robot.parts.length)} · ${p.groupLabel}`;
      nameEl.textContent = p.cadName;
      descEl.textContent = p.name;
    } else {
      const ps = groupParts(sel.group);
      idx.textContent = `${ps.length} parts`;
      nameEl.textContent = GROUPS[sel.group].label;
      descEl.textContent = GROUP_DESC[sel.group];
    }
    gsap.fromTo(
      [nameEl, descEl],
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: dur(0.4), stagger: 0.05 },
    );
    if (focus)
      focusOn(sel.type === "part" ? [sel.part] : groupParts(sel.group));
  }

  list.addEventListener("click", (e) => {
    const b = e.target.closest("[data-group]");
    if (b && robot) select({ type: "group", group: b.dataset.group });
  });
  list.addEventListener("pointerover", (e) => {
    const b = e.target.closest("[data-group]");
    hovered = b ? { type: "group", group: b.dataset.group } : null;
    paint();
  });
  list.addEventListener("pointerleave", () => {
    hovered = null;
    paint();
  });

  // Raycasting on the CAD meshes
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (e) => {
    if (!robot) return null;
    const r = canvas.getBoundingClientRect();
    ndc.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    );
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(robot.meshes, false)[0];
    return hit ? robot.parts.find((p) => p.object === hit.object) : null;
  };
  let downAt = null;
  let raf = 0;
  canvas.addEventListener(
    "pointerdown",
    (e) => (downAt = { x: e.clientX, y: e.clientY }),
  );
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
      if (p) {
        const r = host.getBoundingClientRect();
        tip.hidden = false;
        tip.textContent = p.cadName;
        tip.style.transform = `translate(${e.clientX - r.left + 16}px, ${e.clientY - r.top + 12}px)`;
      } else tip.hidden = true;
    });
  });
  canvas.addEventListener("pointerleave", () => {
    tip.hidden = true;
    hovered = null;
    paint();
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6)
      return;
    const p = pick(e);
    select(p ? { type: "part", part: p } : null, false);
  });

  // Tools
  const setMode = (exploded) => {
    if (!robot) return;
    root
      .querySelector('[data-ex="explode"]')
      .setAttribute("aria-pressed", String(exploded));
    root
      .querySelector('[data-ex="assemble"]')
      .setAttribute("aria-pressed", String(!exploded));
    gsap.killTweensOf(explode);
    gsap.to(explode, {
      v: exploded ? 1 : 0,
      duration: dur(1.2),
      ease: "power3.inOut",
      onUpdate: () => applyExplode(robot.parts, explode.v),
      onComplete: () =>
        !exploded && robot.parts.forEach((p) => p.object.position.copy(p.home)),
    });
    if (!selected) {
      const k = exploded ? 1.35 : 1;
      const to = home.position
        .clone()
        .sub(home.target)
        .multiplyScalar(k)
        .add(home.target);
      gsap.to(camera.position, {
        x: to.x,
        y: to.y,
        z: to.z,
        duration: dur(1.2),
        ease: "power3.inOut",
      });
      gsap.to(controls.target, {
        x: home.target.x,
        y: home.target.y + (exploded ? 0.25 : 0),
        z: home.target.z,
        duration: dur(1.2),
      });
    }
  };
  const dolly = (factor) => {
    const offset = camera.position.clone().sub(controls.target);
    const len = THREE.MathUtils.clamp(
      offset.length() * factor,
      controls.minDistance,
      controls.maxDistance,
    );
    const to = controls.target.clone().add(offset.setLength(len));
    gsap.to(camera.position, {
      x: to.x,
      y: to.y,
      z: to.z,
      duration: dur(0.5),
      ease: "power2.out",
    });
  };
  root.querySelector(".explorer__tools")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ex]");
    if (!b || !robot) return;
    const a = b.dataset.ex;
    if (a === "explode") setMode(true);
    if (a === "assemble") setMode(false);
    if (a === "zoom-in") dolly(0.78);
    if (a === "zoom-out") dolly(1.28);
    if (a === "reset") {
      select(null);
      setMode(false);
      gsap.to(camera.position, {
        x: home.position.x,
        y: home.position.y,
        z: home.position.z,
        duration: dur(1),
        ease: "power3.inOut",
      });
      gsap.to(controls.target, {
        x: home.target.x,
        y: home.target.y,
        z: home.target.z,
        duration: dur(1),
        ease: "power3.inOut",
        onComplete: () => (controls.autoRotate = !reduced),
      });
    }
  });

  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape") return select(null);
    if (
      !robot ||
      !["ArrowRight", "ArrowLeft"].includes(e.key) ||
      !root.contains(document.activeElement) ||
      /input/i.test(document.activeElement.tagName)
    )
      return;
    const parts = robot.parts;
    const i = selected?.type === "part" ? parts.indexOf(selected.part) : -1;
    const n =
      e.key === "ArrowRight"
        ? (i + 1) % parts.length
        : (i - 1 + parts.length) % parts.length;
    select({ type: "part", part: parts[n] });
  });
}
