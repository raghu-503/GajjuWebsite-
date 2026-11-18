// Interactive GAJJU viewer: orbit / zoom / pan, assembled ↔ exploded, reset, auto-rotate and
// click-to-inspect on the real CAD meshes. Used on the home showcase, product page and assembly guide.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createStage, prefersReducedMotion } from "./stage.js";
import { applyExplode, setHighlight } from "./robot-model.js";
import {
  loadGajjuAsset,
  onGajjuProgress,
  createGajju,
  addGajjuStudio,
  frameCamera,
} from "./gajju-model.js";
import { gsap } from "./animations.js";
import { refreshIcons } from "./icons.js";

const pad = (n) => String(n).padStart(3, "0");

/**
 * @param {HTMLElement} host   element the canvas fills
 * @param {object} opts
 *   ui        element that receives the toolbar and inspect panel (defaults to host.parentElement)
 *   toolbar   show Assembled / Exploded / Reset / Auto-rotate controls
 *   inspect   enable click-to-select with the component name panel
 *   explode   initial explode amount (0–1)
 *   zoomOnEngage  only enable wheel zoom after the visitor presses inside (avoids hijacking page scroll)
 *   onSelect  callback(part | null)
 *   camera    { fill, direction } passed to frameCamera
 */
export function createGajjuViewer(host, opts = {}) {
  const {
    ui = host.parentElement,
    toolbar = true,
    inspect = true,
    explode = 0,
    zoomOnEngage = true,
    autoRotate = true,
    onSelect = () => {},
    camera: camOpts = {},
  } = opts;
  const reduced = prefersReducedMotion();
  const dur = (d) => (reduced ? 0.01 : d);

  host.classList.add("gstage");
  if (!host.hasAttribute("tabindex")) host.tabIndex = -1; // focusable on click so Escape clears a selection
  const status = document.createElement("div");
  status.className = "gstage__status";
  status.setAttribute("role", "status");
  status.innerHTML =
    '<span class="gstage__spinner" aria-hidden="true"></span><span data-gstatus>Loading GAJJU CAD model…</span>';
  ui.appendChild(status);
  const statusText = status.querySelector("[data-gstatus]");
  const offProgress = onGajjuProgress(
    (p) =>
      (statusText.textContent = `Loading GAJJU CAD model… ${Math.round(p * 100)}%`),
  );

  const stage = createStage(host, {
    fov: 30,
    position: [6, 3, 7],
    target: [0, 0.9, 0],
    exposure: 1.05,
    envIntensity: 0.6,
  });
  if (!stage) {
    status.classList.add("is-error");
    statusText.textContent =
      "This browser cannot display 3D (WebGL is unavailable), so the GAJJU model cannot be shown.";
    return null;
  }
  const { scene, camera, canvas, renderer, mobile } = stage;
  const studio = addGajjuStudio(scene, { renderer, mobile });

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true; // right-drag
  controls.screenSpacePanning = true;
  controls.enableZoom = !zoomOnEngage;
  controls.maxPolarAngle = Math.PI * 0.495; // stay above the floor
  controls.autoRotate = autoRotate && !reduced;
  controls.autoRotateSpeed = 0.8;
  let autoRotateWanted = controls.autoRotate;
  if (zoomOnEngage) {
    host.addEventListener("pointerdown", () => {
      controls.enableZoom = true;
      host.setAttribute("data-lenis-prevent", "");
    });
    host.addEventListener("pointerleave", () => {
      controls.enableZoom = false;
      host.removeAttribute("data-lenis-prevent");
    });
  }
  let resume;
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
    clearTimeout(resume);
  });
  controls.addEventListener("end", () => {
    clearTimeout(resume);
    resume = setTimeout(() => (controls.autoRotate = autoRotateWanted), 4000);
  });

  let model = null;
  let base = null; // framed camera for reset
  const ex = { v: explode, target: explode };
  let selected = null;

  /* ---------- UI ---------- */
  let tools = null;
  if (toolbar) {
    tools = document.createElement("div");
    tools.className = "gtools";
    tools.setAttribute("role", "toolbar");
    tools.setAttribute("aria-label", "GAJJU viewer controls");
    tools.innerHTML = `
      <button type="button" class="gtool" data-g="assemble" aria-pressed="${explode < 0.5}"><i data-lucide="box"></i><span>Assembled</span></button>
      <button type="button" class="gtool" data-g="explode" aria-pressed="${explode >= 0.5}"><i data-lucide="boxes"></i><span>Exploded</span></button>
      <button type="button" class="gtool" data-g="reset" title="Reset parts and camera"><i data-lucide="rotate-ccw"></i><span>Reset</span></button>
      <button type="button" class="gtool" data-g="spin" aria-pressed="${controls.autoRotate}" title="Auto rotate"><i data-lucide="refresh-cw"></i><span>Auto rotate</span></button>`;
    tools.querySelectorAll("button").forEach((b) => (b.disabled = true));
    ui.appendChild(tools);
    tools.addEventListener("click", (e) => {
      const b = e.target.closest("[data-g]");
      if (!b) return;
      const a = b.dataset.g;
      if (a === "assemble") api.setExplode(0);
      if (a === "explode") api.setExplode(1);
      if (a === "reset") api.reset();
      if (a === "spin") api.setAutoRotate(!autoRotateWanted);
    });
  }
  const syncTools = () => {
    if (!tools) return;
    tools
      .querySelector('[data-g="assemble"]')
      .setAttribute("aria-pressed", String(ex.target < 0.5));
    tools
      .querySelector('[data-g="explode"]')
      .setAttribute("aria-pressed", String(ex.target >= 0.5));
    tools
      .querySelector('[data-g="spin"]')
      .setAttribute("aria-pressed", String(autoRotateWanted));
  };

  let panel = null;
  if (inspect) {
    panel = document.createElement("aside");
    panel.className = "ginspect";
    panel.setAttribute("aria-live", "polite");
    panel.hidden = true;
    ui.appendChild(panel);
  }
  const tip = document.createElement("div");
  tip.className = "gtip";
  tip.hidden = true;
  ui.appendChild(tip);

  function showPanel(p) {
    if (!panel) return;
    if (!p) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    panel.innerHTML = `
      <span class="ginspect__idx">${pad(p.index)} / ${pad(model.parts.length)} · ${p.groupLabel}</span>
      <strong class="ginspect__cad">${p.cadName}</strong>
      <span class="ginspect__name">${p.name}</span>
      <button type="button" class="ginspect__close" aria-label="Clear selection"><i data-lucide="x"></i></button>`;
    panel
      .querySelector("button")
      .addEventListener("click", () => api.select(null));
    refreshIcons();
  }

  /* ---------- Picking ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(e) {
    if (!model) return null;
    const r = canvas.getBoundingClientRect();
    ndc.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    );
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(model.meshes, false)[0];
    return hit ? model.parts.find((p) => p.object === hit.object) : null;
  }
  if (inspect) {
    let down = null;
    canvas.addEventListener(
      "pointerdown",
      (e) => (down = { x: e.clientX, y: e.clientY, b: e.button }),
    );
    canvas.addEventListener("pointerup", (e) => {
      if (
        !down ||
        down.b !== 0 ||
        Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5
      )
        return;
      api.select(pick(e));
    });
    if (!mobile) {
      let raf = 0;
      canvas.addEventListener("pointermove", (e) => {
        if (raf || e.buttons) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const p = pick(e);
          canvas.style.cursor = p ? "pointer" : "";
          if (p && p !== selected) {
            const r = ui.getBoundingClientRect();
            tip.hidden = false;
            tip.textContent = p.cadName;
            tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px)`;
          } else tip.hidden = true;
        });
      });
      canvas.addEventListener("pointerleave", () => (tip.hidden = true));
    }
    host.addEventListener(
      "keydown",
      (e) => e.key === "Escape" && api.select(null),
    );
  }

  /* ---------- Loop ---------- */
  stage.onTick((dt, t) => {
    model?.animate(t, true);
    studio.update(t);
    controls.update();
  });
  stage.start();

  // Box corners overstate the robot's silhouette, so a high box fill gives ~65–75% visual fill.
  const fitOpts = { fill: 0.94, ...camOpts };
  let explodedBounds = null;
  function frame(immediate = true) {
    if (!model) return;
    base = frameCamera(camera, model.bounds, fitOpts);
    controls.minDistance = base.distance * 0.3;
    controls.maxDistance = base.distance * 2.4;
    if (immediate) {
      camera.position.copy(base.position);
      controls.target.copy(base.target);
      controls.update();
    }
  }

  function getExplodedBounds() {
    if (explodedBounds) return explodedBounds;
    const rot = model.group.rotation.y;
    model.group.rotation.y = 0;
    applyExplode(model.parts, 1);
    model.group.updateMatrixWorld(true);
    explodedBounds = new THREE.Box3().setFromObject(model.group);
    applyExplode(model.parts, ex.v);
    model.group.rotation.y = rot;
    model.group.updateMatrixWorld(true);
    return explodedBounds;
  }

  let destroyed = false;
  let ro = null;
  const ready = loadGajjuAsset().then(
    (asset) => {
      offProgress();
      if (destroyed) return null;
      model = createGajju(asset, { shadows: true });
      scene.add(model.group);
      applyExplode(model.parts, ex.v);
      frame(true);
      if (ex.v >= 0.5) {
        const shot = frameCamera(camera, getExplodedBounds(), fitOpts);
        camera.position.copy(shot.position);
        controls.target.copy(shot.target);
      }
      ro = new ResizeObserver(() => {
        // Keep the model framed on layout changes until the visitor moves the camera.
        if (controls.userMoved) return;
        frame(true);
        if (ex.target >= 0.5) {
          const shot = frameCamera(camera, getExplodedBounds(), fitOpts);
          camera.position.copy(shot.position);
          controls.target.copy(shot.target);
        }
      }).observe(host);
      controls.addEventListener("start", () => (controls.userMoved = true));
      status.remove();
      tools?.querySelectorAll("button").forEach((b) => (b.disabled = false));
      refreshIcons();
      stage.render();
      return model;
    },
    (err) => {
      offProgress();
      if (destroyed) return null;
      console.error(err);
      status.classList.add("is-error");
      statusText.textContent = `${err.message} Check that public/models/gajju2_robot.glb is deployed with the site.`;
      tools?.remove();
      throw err;
    },
  );
  refreshIcons();

  const api = {
    stage,
    controls,
    ready,
    get model() {
      return model;
    },
    setExplode(v, d = 1.2) {
      if (!model) return;
      gsap.killTweensOf(ex);
      ex.target = v;
      gsap.to(ex, {
        v,
        duration: dur(d),
        ease: "power3.inOut",
        onUpdate: () => applyExplode(model.parts, ex.v),
      });
      syncTools();
      // Pull back to fit the exploded layout (and return), unless the visitor has taken the camera.
      if (!controls.userMoved && base) {
        const shot =
          v >= 0.5 ? frameCamera(camera, getExplodedBounds(), fitOpts) : base;
        gsap.to(camera.position, {
          x: shot.position.x,
          y: shot.position.y,
          z: shot.position.z,
          duration: dur(d),
          ease: "power3.inOut",
        });
        gsap.to(controls.target, {
          x: shot.target.x,
          y: shot.target.y,
          z: shot.target.z,
          duration: dur(d),
          ease: "power3.inOut",
        });
      }
    },
    setExplodeNow(v) {
      gsap.killTweensOf(ex);
      ex.v = ex.target = v;
      if (model) applyExplode(model.parts, v);
      syncTools();
    },
    /** Restore every part to its exact CAD position, reframe the camera and clear the selection. */
    reset() {
      api.select(null);
      if (!model) return;
      gsap.killTweensOf(ex);
      ex.target = 0;
      gsap.to(ex, {
        v: 0,
        duration: dur(0.9),
        ease: "power3.inOut",
        onUpdate: () => applyExplode(model.parts, ex.v),
        onComplete: () => {
          ex.v = 0;
          model.parts.forEach((p) => p.object.position.copy(p.home));
          syncTools();
        },
      });
      controls.userMoved = false;
      frame(false);
      gsap.to(camera.position, {
        x: base.position.x,
        y: base.position.y,
        z: base.position.z,
        duration: dur(1.1),
        ease: "power3.inOut",
      });
      gsap.to(controls.target, {
        x: base.target.x,
        y: base.target.y,
        z: base.target.z,
        duration: dur(1.1),
        ease: "power3.inOut",
      });
      api.setAutoRotate(autoRotate && !reduced);
    },
    setAutoRotate(on) {
      autoRotateWanted = on;
      controls.autoRotate = on;
      clearTimeout(resume);
      syncTools();
    },
    select(part) {
      if (selected) setHighlight(selected.object, false);
      selected = part || null;
      if (selected) setHighlight(selected.object, true, 0x3de8ff, 0.7);
      tip.hidden = true;
      showPanel(selected);
      onSelect(selected);
    },
    /** Remove the canvas, controls and overlay UI, and stop every listener and tween. */
    destroy() {
      destroyed = true;
      offProgress();
      clearTimeout(resume);
      ro?.disconnect();
      gsap.killTweensOf([ex, camera.position, controls.target]);
      controls.dispose();
      stage.dispose();
      [status, tools, panel, tip].forEach((el) => el?.remove());
    },
    /** Highlight every part of a kit component kind (null clears). */
    highlightKind(kind) {
      model?.parts.forEach((p) => {
        if (p === selected) return;
        setHighlight(p.object, !!kind && p.kind === kind, 0x3de8ff, 0.6);
      });
    },
  };
  return api;
}
