import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { getTheme, sceneColors, onThemeChange } from './theme.js';

export const isMobile = () => window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

/** Static illustration shown when WebGL is unavailable, so no canvas is ever empty. */
export function showFallback(container, label = 'Interactive 3D needs WebGL. Showing a still illustration instead.') {
  container.classList.add('stage--fallback');
  container.innerHTML = `
    <div class="stage-fallback" role="img" aria-label="Robot illustration">
      <svg viewBox="0 0 200 220" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="62" y="30" width="76" height="44" rx="12"/><rect x="74" y="44" width="52" height="14" rx="7" style="fill: rgb(var(--cyan-rgb) / 0.25)"/>
        <path d="M100 74v10"/><path d="M66 84h68l10 64H56z"/><circle cx="100" cy="112" r="10" style="stroke: var(--cyan)"/>
        <rect x="40" y="148" width="120" height="30" rx="8"/><circle cx="52" cy="186" r="18"/><circle cx="148" cy="186" r="18"/>
        <path d="M66 96l-22 30M134 96l22 30"/><path d="M100 30V16"/><circle cx="100" cy="12" r="4" style="stroke: var(--cyan)"/>
      </svg>
      <p>${label}</p>
    </div>`;
}

let sharedEnvTexture = null;

/**
 * Creates a self-managing Three.js stage inside `container`.
 * Rendering pauses automatically while the container is off-screen or the tab is hidden.
 */
export function createStage(container, opts = {}) {
  if (!webglAvailable()) {
    showFallback(container);
    return null;
  }
  const mobile = isMobile();
  const {
    fov = 35,
    position = [0, 1.4, 6],
    target = [0, 1, 0],
    dprMax = mobile ? 1.5 : 2,
    exposure = 1.0,
    envIntensity = 0.9,
  } = opts;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  } catch {
    showFallback(container);
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprMax));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.classList.add('stage-canvas');
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = envIntensity;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 120);
  camera.position.set(...position);
  const lookTarget = new THREE.Vector3(...target);
  camera.lookAt(lookTarget);

  const tickers = new Set();
  const clock = new THREE.Clock();
  let visible = false;
  let running = false;
  let elapsed = 0;

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (!running) renderer.render(scene, camera);
  }

  function loop() {
    if (running) return;
    running = true;
    clock.getDelta();
    const step = () => {
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      tickers.forEach((fn) => fn(dt, elapsed));
      renderer.render(scene, camera);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) loop();
    },
    { rootMargin: '120px' }
  );
  const onVis = () => { if (!document.hidden && visible) loop(); };
  document.addEventListener('visibilitychange', onVis);
  const offTheme = onThemeChange(() => {
    applySceneTheme(scene);
    if (!running) renderer.render(scene, camera);
  });
  resize();

  return {
    renderer,
    scene,
    camera,
    canvas,
    target: lookTarget,
    mobile,
    onTick(fn) {
      tickers.add(fn);
      return () => tickers.delete(fn);
    },
    start() {
      applySceneTheme(scene);
      io.observe(container);
      return this;
    },
    render() {
      renderer.render(scene, camera);
    },
    dispose() {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      offTheme();
      tickers.clear();
      renderer.dispose();
      canvas.remove();
    },
  };
}

/**
 * Applies the current theme's scene colours. Objects opt in with
 * userData.themeColor = '<key in SCENE_COLORS>' and/or userData.themeBlend = true.
 */
export function applySceneTheme(scene) {
  const c = sceneColors();
  if (scene.fog && !scene.userData.fixedTheme) scene.fog.color.set(c.fog);
  scene.traverse((o) => {
    const m = o.material;
    if (!m) return;
    if (o.userData.themeColor) m.color.set(c[o.userData.themeColor]);
    if (o.userData.themeBlend) {
      m.blending = c.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
      m.needsUpdate = true;
    }
  });
}

/** Studio key/rim lighting used by most stages. */
export function addStudioLights(scene, { key = 2.2, rim = 18, fill = 0.35 } = {}) {
  const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x05070a, fill);
  scene.add(hemi);
  const keyLight = new THREE.DirectionalLight(0xffffff, key);
  keyLight.position.set(3, 5, 4);
  scene.add(keyLight);
  const rimA = new THREE.PointLight(0x3de8ff, rim, 12, 2);
  rimA.position.set(-3, 2.5, -2.5);
  scene.add(rimA);
  const rimB = new THREE.PointLight(0x2f6bff, rim * 0.9, 12, 2);
  rimB.position.set(3.2, 1.2, -2.8);
  scene.add(rimB);
  return { hemi, keyLight, rimA, rimB };
}

/** Glowing platform disc with concentric rings under a model. */
export function createPlatform(radius = 1.6) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 96),
    new THREE.MeshStandardMaterial({ color: sceneColors().disc, metalness: 0.25, roughness: 0.7, envMapIntensity: 0.35 })
  );
  disc.userData.themeColor = 'disc';
  disc.rotation.x = -Math.PI / 2;
  g.add(disc);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x3de8ff, transparent: true, opacity: 0.85 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.985, radius, 128), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  g.add(ring);
  const inner = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.62, radius * 0.625, 96),
    new THREE.MeshBasicMaterial({ color: 0x2f6bff, transparent: true, opacity: 0.5 })
  );
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.003;
  g.add(inner);
  g.userData.ring = ring;
  return g;
}

/* ---------- Snapshot renderer: turns procedural models into "product photography" ---------- */
let snapRenderer = null;
const snapCache = new Map(); // "<key>:<theme>" -> urls
const snapDefs = new Map(); // key -> { buildScene, shots, size }
const snapOwner = new Map(); // url -> { key, index }

export function renderSnapshots(key, buildScene, shots, size = 720) {
  snapDefs.set(key, { buildScene, shots, size });
  const cacheKey = `${key}:${getTheme()}`;
  if (snapCache.has(cacheKey)) return snapCache.get(cacheKey);
  if (!webglAvailable()) return [];
  if (!snapRenderer) {
    snapRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    snapRenderer.outputColorSpace = THREE.SRGBColorSpace;
    snapRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    snapRenderer.shadowMap.enabled = true;
    snapRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    snapRenderer.setPixelRatio(1);
  }
  snapRenderer.setSize(size, size, false);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(snapRenderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;
  pmrem.dispose();
  scene.background = new THREE.Color(sceneColors().snapBg);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const ctx = buildScene(scene);
  snapRenderer.toneMappingExposure = scene.userData.exposure ?? 1;
  const urls = shots.map((shot) => {
    if (shot.setup) shot.setup(ctx);
    camera.position.set(...shot.position);
    camera.lookAt(new THREE.Vector3(...shot.target));
    snapRenderer.render(scene, camera);
    return snapRenderer.domElement.toDataURL('image/jpeg', 0.86);
  });
  scene.traverse((o) => {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); // shared CAD geometry stays alive
  });
  snapCache.set(cacheKey, urls);
  urls.forEach((u, index) => snapOwner.set(u, { key, index }));
  return urls;
}

/** Mark stand-in image URLs (e.g. while a GLB loads) so refreshSnapshotImages() can replace them. */
export function registerSnapshotPlaceholders(key, urls) {
  urls.forEach((u, index) => snapOwner.set(u, { key, index }));
}

/**
 * Re-renders product photos (for the current theme, or once a model has loaded) and swaps
 * every matching <img> on the page. Pass a key to refresh one product only.
 */
export function refreshSnapshotImages(onlyKey) {
  document.querySelectorAll('img').forEach((img) => {
    const owner = snapOwner.get(img.getAttribute('src'));
    if (!owner || (onlyKey && owner.key !== onlyKey)) return;
    const def = snapDefs.get(owner.key);
    if (!def) return;
    const next = renderSnapshots(owner.key, def.buildScene, def.shots, def.size)[owner.index];
    if (next) img.setAttribute('src', next);
  });
}

onThemeChange(() => refreshSnapshotImages());
