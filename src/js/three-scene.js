import * as THREE from "three";
import {
  createStage,
  addStudioLights,
  createPlatform,
  prefersReducedMotion,
} from "./stage.js";
import { loadGajjuAsset, createGajju } from "./gajju-model.js";
import { gsap, ScrollTrigger } from "./animations.js";
import { sceneColors } from "./theme.js";

function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(160,240,255,0.8)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function contactShadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(20,28,40,0.55)");
  grd.addColorStop(0.45, "rgba(20,28,40,0.22)");
  grd.addColorStop(1, "rgba(20,28,40,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function createParticles(count) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const speed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 1.2 + Math.random() * 5.5;
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.random() * 5;
    pos[i * 3 + 2] = Math.sin(a) * r - 1;
    speed[i] = 0.05 + Math.random() * 0.2;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.06,
    map: dotTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0x7fe9ff,
    opacity: 0.85,
  });
  const points = new THREE.Points(geo, mat);
  points.userData.speed = speed;
  points.userData.themeColor = "particle";
  points.userData.themeBlend = true;
  return points;
}

function createGridFloor() {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0x2f6bff) },
      uFade: { value: 1 },
    },
    vertexShader: `varying vec2 vUv; varying vec3 vPos; void main(){ vUv=uv; vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor; uniform float uFade; varying vec3 vPos;
      float line(float x, float w){ float f=abs(fract(x-0.5)-0.5)/fwidth(x); return 1.0-min(f/w,1.0); }
      void main(){
        vec2 p = vPos.xy;
        float g = max(line(p.x*1.25,1.0), line(p.y*1.25 + uTime*0.15,1.0));
        float d = length(p);
        float fade = smoothstep(9.0, 1.5, d);
        float pulse = smoothstep(0.08,0.0,abs(d - mod(uTime*1.6, 10.0))) * 0.6;
        gl_FragColor = vec4(uColor + pulse, (g*0.35 + pulse*0.4) * fade * uFade);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(22, 22, 1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.002;
  return mesh;
}

export function initHeroScene(container, labelsRoot) {
  const stage = createStage(container, {
    fov: 32,
    position: [0, 1.6, 8.2],
    target: [0, 1.1, 0],
    exposure: 0.98,
    envIntensity: 0.5,
  });
  if (!stage) {
    labelsRoot?.remove();
    return null;
  }
  const { scene, camera, mobile, renderer } = stage;
  const reduced = prefersReducedMotion();
  scene.fog = new THREE.Fog(sceneColors().fog, 9, 22);
  addStudioLights(scene, { key: 2.4, rim: 30 });
  // Shadow-casting key light: grounds the robot and lifts its contrast against the cream page.
  const shadowKey = new THREE.DirectionalLight(0xffffff, 1.6);
  shadowKey.position.set(2.5, 7, 4);
  shadowKey.castShadow = true;
  shadowKey.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(shadowKey.shadow.camera, {
    left: -3,
    right: 3,
    top: 3,
    bottom: -3,
    near: 1,
    far: 20,
  });
  shadowKey.shadow.bias = -0.0004;
  shadowKey.shadow.normalBias = 0.02;
  shadowKey.shadow.radius = 5;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const spot = new THREE.SpotLight(0x3de8ff, 60, 14, Math.PI / 7, 0.6, 1.4);
  spot.position.set(0, 7, 2);
  scene.add(spot);

  const rig = new THREE.Group();
  scene.add(rig);
  const platform = createPlatform(1.9);
  rig.add(platform);
  shadowKey.target = rig;
  scene.add(shadowKey, shadowKey.target);
  // Cast shadow + soft contact shadow under the feet (stands in for ambient occlusion on the platform).
  const shadowCatcher = new THREE.Mesh(
    new THREE.CircleGeometry(1.9, 96),
    new THREE.ShadowMaterial({ opacity: 0.32 }),
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = 0.006;
  shadowCatcher.receiveShadow = true;
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.005;
  rig.add(shadowCatcher, contact);
  // The real GAJJU CAD model loads asynchronously into this holder.
  const holder = new THREE.Group();
  rig.add(holder);
  spot.target = holder;
  let robot = null;

  // Halo rings behind the robot
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0x3de8ff,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(2.3, 0.008, 8, 200),
    haloMat,
  );
  halo.position.set(0, 1.25, -1.2);
  const halo2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.7, 0.004, 8, 200, Math.PI * 1.4),
    haloMat.clone(),
  );
  halo2.material.opacity = 0.3;
  halo2.position.copy(halo.position);
  for (const h of [halo, halo2]) {
    h.userData.themeColor = "halo";
    h.userData.themeBlend = true;
  }
  rig.add(halo, halo2);

  const floor = createGridFloor();
  scene.add(floor);
  const particles = createParticles(mobile ? 90 : 260);
  scene.add(particles);

  // Layout: the robot sits in the right half beside the copy (desktop/tablet), or in the
  // upper half above the stacked copy (mobile). Positions come from the visible frustum width.
  const view = { camY: 1.6, lookY: 1.1 }; // camera height and aim; mobile looks down from higher up
  const heroPose = { x: 0, y: 0, s: 1 }; // where the robot sits in the hero (set by layout)
  const layout = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    const halfW = Math.tan(THREE.MathUtils.degToRad(16)) * 8.2 * (w / h); // visible half-width at the robot
    if (w > 640) {
      heroPose.s = w / h < 1.45 ? 0.82 : 1;
      heroPose.x = halfW * 0.47;
      view.camY = 1.6;
      view.lookY = 1.1;
    } else {
      // Stacked: robot in the upper half, seen from slightly above, copy below it.
      heroPose.s = Math.min(0.62, (halfW * 0.8) / 1.5);
      heroPose.x = 0;
      view.camY = 3.4;
      view.lookY = -0.5;
    }
  };
  layout();
  window.addEventListener("resize", layout);

  // Mouse parallax
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!mobile) {
    window.addEventListener("pointermove", (e) => {
      mouse.tx = (e.clientX / innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / innerHeight) * 2 - 1;
    });
  }

  // Intro animation
  const intro = { v: reduced ? 1 : 0 };
  holder.position.y = reduced ? 0 : -0.6;

  let introWanted = false;
  loadGajjuAsset().then(
    (asset) => {
      robot = createGajju(asset, { shadows: true, rig: true });
      holder.add(robot.group);
      if (introWanted) runIntro();
    },
    (err) => console.error(err),
  );

  /* ---------- Scroll-driven travel: hero (right) → "Engineered to explore" (left column) ----------
   * The canvas is fixed to the viewport, so the same robot stays on screen between sections.
   * Its position and size are solved every frame from the line-art illustration's live screen
   * rectangle, so it lands exactly there and then scrolls away with that section. */
  const silhouette = document.querySelector("[data-robot-slot]"); // empty left-column slot
  const introSection = silhouette?.closest("section");
  const introText = introSection?.querySelector(".intro__text");
  // Forward axis: createGajju turns the CAD model so its face points along +Z (at the camera),
  // so holder.rotation.y = 0 is face-on. WALK_TURN faces left (the way it walks in); FACE_TURN is
  // a front-facing three-quarter view, turned slightly toward the text, for the reading part.
  const FINAL_TURN = -1.12;
  const FACE_TURN = -0.12;
  const ROBOT_H = 1.92; // model height at scale 1
  const ROBOT_W = 3.4; // screen width of the turned model at scale 1
  const smooth = (a0, a1, x) => THREE.MathUtils.smootherstep(x, a0, a1);
  const lerp = THREE.MathUtils.lerp;
  const wrap = (a) =>
    ((((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  const ndc = new THREE.Vector2();
  const travel = { p: 0 };

  // Desktop/tablet: pin "Engineered to explore" once the illustration is centred, for a further
  // 90% of a viewport, so the section stays fully on screen while the robot finishes walking in.
  // Mobile scrolls normally (no pin). Progress runs from the top of the page to the end of the pin,
  // so the walk is spread over the whole transition instead of finishing early.
  // No pinning: phase A ends as GAJJU settles into its slot, then the page scrolls normally and the
  // robot rides along with the section (it is positioned from the slot's live rectangle).
  const pinST = null;

  /** Phase A ends when the slot is centred (desktop: where the reading pin starts). */
  function slotCentredAt() {
    if (pinST) return pinST.start;
    const r = silhouette.getBoundingClientRect();
    return r.top + scrollY + r.height / 2 - innerHeight / 2;
  }
  function scrollProgress() {
    if (!silhouette || reduced) return 0;
    const end = slotCentredAt();
    return end > 1 ? THREE.MathUtils.clamp(scrollY / end, 0, 1) : 1;
  }

  function toWorld(px, py) {
    const W = container.clientWidth || innerWidth;
    const H = container.clientHeight || innerHeight;
    ndc.set((px / W) * 2 - 1, -((py / H) * 2 - 1));
    ray.setFromCamera(ndc, camera);
    return !!ray.ray.intersectPlane(plane, hit);
  }
  const tmpV = new THREE.Vector3();
  function toScreen(wx, wy) {
    tmpV.set(wx, wy, 0).project(camera);
    const W = container.clientWidth || innerWidth;
    const H = container.clientHeight || innerHeight;
    return {
      x: (tmpV.x * 0.5 + 0.5) * W,
      y: (-tmpV.y * 0.5 + 0.5) * H,
      wx,
      wy,
    };
  }
  function unitsPerPx(wx, wy) {
    const H = container.clientHeight || innerHeight;
    return (
      (2 *
        Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
        camera.position.distanceTo(tmpV.set(wx, wy, 0))) /
      H
    );
  }

  /** Robot pose that fills the illustration's rectangle on screen. */
  function illustrationPose(out) {
    const r = silhouette.getBoundingClientRect();
    const W = container.clientWidth || innerWidth;
    const H = container.clientHeight || innerHeight;
    ndc.set(
      ((r.left + r.width / 2) / W) * 2 - 1,
      -(((r.top + r.height / 2) / H) * 2 - 1),
    );
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(plane, hit)) return false;
    const unitsPerPx =
      (2 *
        Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
        camera.position.distanceTo(hit)) /
      H;
    out.s = Math.min(
      (r.height * unitsPerPx) / ROBOT_H,
      (r.width * unitsPerPx) / ROBOT_W,
    );
    out.x = hit.x;
    out.y = hit.y - (ROBOT_H * out.s) / 2;
    return true;
  }

  // Hero scenery that fades away while the robot travels.
  const fadeables = [];
  [platform, halo, halo2].forEach((o) =>
    o.traverse((m) => {
      if (!m.isMesh) return;
      m.material.transparent = true;
      fadeables.push({ m: m.material, base: m.material.opacity });
    }),
  );
  const particleBase = particles.material.opacity;

  /* ---------- Phase B: "Engineered to explore" → "Robotics without limits" ----------
   * After the intro, GAJJU walks down toward the three capability cards, stops, and separates into
   * three groups of its real CAD parts, each settling over the picture area of its card:
   *   Intelligent engineering → head & neck + internal electronics (sensing, compute, power)
   *   Modular architecture    → torso shell + the four leg assemblies
   *   Hands-on innovation     → trunk & gripper
   * Progress pB runs from the end of phase A to the moment the card row is centred. */
  const capsSection = document.querySelector(".caps");
  const capVisuals = [...(capsSection?.querySelectorAll(".cap__visual") || [])];
  const capsRow = capsSection?.querySelector(".caps__row");
  const heroEl = container.closest(".hero");
  const CARD_OF = {
    head: 0,
    electronics: 0,
    torso: 1,
    "leg-FL": 1,
    "leg-FR": 1,
    "leg-BL": 1,
    "leg-BR": 1,
    trunk: 2,
  };
  const travelB = { p: 0 };
  /** Phase B (reading): the robot stands still in its slot. Desktop: for the whole pin.
   *  Mobile (no pin): for half a viewport of scrolling, moving with the section. */
  /** Phase B starts when "Robotics without limits" begins entering the viewport — not while the
   *  visitor is still reading "Engineered to explore". */
  function phaseAEnd() {
    const capsTop = capsSection
      ? capsSection.getBoundingClientRect().top + scrollY - innerHeight * 0.9
      : 0;
    return Math.max(slotCentredAt(), capsTop);
  }
  function scrollProgressB() {
    if (reduced || !silhouette || !capsRow || capVisuals.length < 3) return 0;
    const start = phaseAEnd();
    const r = capsRow.getBoundingClientRect();
    const end = r.top + scrollY + r.height / 2 - innerHeight / 2;
    return end > start + 1
      ? THREE.MathUtils.clamp((scrollY - start) / (end - start), 0, 1)
      : scrollY > start
        ? 1
        : 0;
  }

  // Exploded view: each card frames its own group independently. Per frame, the group's exploded
  // layout is measured (part centres spread from the group centre, plus each part's radius) and
  // fitted into that card's picture area with its own scale factor, centred, with a margin.
  // Parts scale uniformly about their own centres, so CAD geometry and proportions are preserved.
  const SPREAD = [1.35, 1.3, 1.2]; // how far parts separate within each group
  const FILL = 0.78; // share of the card's picture area the group may use
  let explodeParts = null;
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const tmpM = new THREE.Matrix4();
  const groupCentre = [
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ];
  const groupCount = [0, 0, 0];
  const anchors = [
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ];
  const cardSize = [
    { w: 1, h: 1 },
    { w: 1, h: 1 },
    { w: 1, h: 1 },
  ];
  const fitK = [1, 1, 1];
  function prepareExplode() {
    robot.group.updateMatrixWorld(true);
    const inv = robot.group.matrixWorld.clone().invert();
    const robotScale = robot.group.getWorldScale(new THREE.Vector3()).x;
    explodeParts = robot.parts.map((part) => {
      const m = part.object;
      const g = m.geometry;
      const geoCentre = g.boundingBox.getCenter(new THREE.Vector3());
      const local = geoCentre
        .clone()
        .applyMatrix4(m.matrixWorld)
        .applyMatrix4(inv);
      const radius =
        (g.boundingSphere.radius * m.getWorldScale(new THREE.Vector3()).x) /
        robotScale;
      return {
        part,
        local,
        radius,
        geoCentre,
        baseScale: m.scale.x,
        card: CARD_OF[part.group] ?? 1,
        world: new THREE.Vector3(),
      };
    });
  }
  function restoreAssembled() {
    explodeParts.forEach(({ part, baseScale }) => {
      part.object.position.copy(part.home);
      part.object.scale.setScalar(baseScale);
    });
  }
  /** Moves every part from its CAD position into its card's framed layout (amount 0 = assembled). */
  function applyCardExplode(amount) {
    if (!explodeParts) return;
    if (amount <= 0.0001) return restoreAssembled();
    robot.group.updateMatrixWorld(true);
    const ws = robot.group.getWorldScale(tmpA).x;
    groupCentre.forEach((v) => v.set(0, 0, 0));
    groupCount.fill(0);
    for (const e of explodeParts) {
      e.world.copy(e.local).applyMatrix4(robot.group.matrixWorld);
      groupCentre[e.card].add(e.world);
      groupCount[e.card]++;
    }
    groupCentre.forEach((v, i) => v.divideScalar(Math.max(1, groupCount[i])));
    // Bounding box of each exploded group (screen-plane x/y), then the scale that fits its card.
    const box = [0, 1, 2].map(() => ({
      x0: Infinity,
      x1: -Infinity,
      y0: Infinity,
      y1: -Infinity,
    }));
    for (const e of explodeParts) {
      const bx = box[e.card];
      const r = e.radius * ws * 0.8; // bounding spheres overstate flat parts
      const ox = (e.world.x - groupCentre[e.card].x) * SPREAD[e.card];
      const oy = (e.world.y - groupCentre[e.card].y) * SPREAD[e.card];
      bx.x0 = Math.min(bx.x0, ox - r);
      bx.x1 = Math.max(bx.x1, ox + r);
      bx.y0 = Math.min(bx.y0, oy - r);
      bx.y1 = Math.max(bx.y1, oy + r);
    }
    box.forEach((bx, i) => {
      fitK[i] = Math.min(
        (cardSize[i].w * FILL) / (bx.x1 - bx.x0),
        (cardSize[i].h * FILL) / (bx.y1 - bx.y0),
      );
      // centre the group's box (not its average) on the card
      bx.cx = (bx.x0 + bx.x1) / 2;
      bx.cy = (bx.y0 + bx.y1) / 2;
    });
    for (const e of explodeParts) {
      const i = e.card;
      const k = fitK[i];
      // framed target centre
      tmpA
        .copy(e.world)
        .sub(groupCentre[i])
        .multiplyScalar(SPREAD[i] * k);
      tmpA.x += anchors[i].x - box[i].cx * k;
      tmpA.y += anchors[i].y - box[i].cy * k;
      tmpA.z += anchors[i].z;
      tmpA.lerp(e.world, 1 - amount); // desired world centre
      const f = 1 + (k - 1) * amount; // per-group scale
      const m = e.part.object;
      m.scale.setScalar(e.baseScale * f);
      // place the mesh so its geometry centre lands on the desired point (in parent space)
      tmpM.copy(m.parent.matrixWorld).invert();
      tmpB
        .copy(e.geoCentre)
        .multiplyScalar(m.scale.x)
        .applyQuaternion(m.quaternion);
      m.position.copy(tmpA.applyMatrix4(tmpM)).sub(tmpB);
    }
  }

  // Empty area to the right of the caps heading's text, between it and the card row's right edge.
  const capsHeading = capsSection?.querySelector(".display");
  const headingRange = document.createRange();
  function stagingRect(W) {
    if (!capsHeading || W <= 640) {
      const m = capVisuals[1].getBoundingClientRect();
      return {
        cx: m.left + m.width / 2,
        cy: m.top + m.height / 2,
        w: m.width * 0.9,
        h: m.height * 0.9,
      };
    }
    headingRange.selectNodeContents(capsHeading);
    const t = headingRange.getBoundingClientRect();
    const right =
      capVisuals[2].closest(".cap")?.getBoundingClientRect().right ?? W - 40;
    const gap = 48;
    const w = Math.max(120, right - t.right - gap);
    return {
      cx: t.right + gap + w / 2,
      cy: t.top + t.height / 2,
      w: w * 0.9,
      h: t.height * 1.35,
    };
  }

  let robotOpacity = 1;
  function setRobotOpacity(o) {
    o = THREE.MathUtils.clamp(o, 0, 1);
    if (Math.abs(o - robotOpacity) < 0.001) return;
    robotOpacity = o;
    robot.group.traverse((m) => {
      if (!m.isMesh) return;
      m.material.transparent = o < 1;
      m.material.opacity = o;
      m.material.depthWrite = o > 0.5;
    });
    robot.group.visible = o > 0.01;
  }

  // The canvas sits behind the hero copy; once the robot has left the hero it moves in front of the
  // page content (cards have solid backgrounds), staying clear of text by construction.
  let inFront = false;
  const setFront = (on) => {
    if (on === inFront || !heroEl) return;
    inFront = on;
    heroEl.classList.toggle("hero--robot-front", on);
  };

  // Stop rendering once the capabilities section has scrolled away (restart when scrolling back).
  const hideAfter =
    reduced || !introSection ? heroEl : capsSection || introSection;
  ScrollTrigger.create({
    trigger: hideAfter,
    start: "top bottom",
    end: "bottom top",
    onLeave: () => (container.style.display = "none"),
    onEnterBack: () => (container.style.display = ""),
  });

  const baseCam = new THREE.Vector3(0, 1.6, 8.2);
  const look = new THREE.Vector3();
  const target = { x: 0, y: 0, s: 1 };
  let spin = 0;

  stage.onTick((dt, t) => {
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    const k = Math.min(1, dt * 12); // brief easing, then progress stops with the scroll
    travel.p += (scrollProgress() - travel.p) * k;
    travelB.p += (scrollProgressB() - travelB.p) * k;
    const p = travel.p < 0.0005 ? 0 : travel.p;
    const pb = travelB.p < 0.0005 ? 0 : travelB.p;
    if (robot && !explodeParts) prepareExplode();

    // Camera: hero framing with mouse parallax, which eases out as the robot travels.
    const par = 1 - smooth(0.1, 0.3, p);
    camera.position.set(
      baseCam.x + mouse.x * 0.5 * par,
      view.camY - mouse.y * 0.3 * par,
      baseCam.z,
    );
    look.set(heroPose.x * 0.4, view.lookY, 0);
    camera.lookAt(look);
    camera.updateMatrixWorld();

    const W = container.clientWidth || innerWidth;
    const H = container.clientHeight || innerHeight;

    // Phase A timeline (normalised scroll progress p):
    //   0–0.15  standing in the hero      0.15–0.35 starts walking down
    //   0.35–0.55 section arrives; robot is already in the left column, beside (not over) the text
    //   0.55–0.93 walks into its slot, slowing down    0.93–1 final step, settles standing
    // Then the reading part: no walking, GAJJU stands in its slot and scrolls with the page (idle only).
    // Paths are solved in screen pixels and clamped inside the viewport, so the robot never drops
    // below the fold or under the nav.
    let sx = null,
      sy = null,
      sc = heroPose.s;
    if (p > 0 && illustrationPose(target)) {
      const r = silhouette.getBoundingClientRect();
      sc = lerp(heroPose.s, target.s, smooth(0.15, 0.45, p));
      const hero = toScreen(
        heroPose.x,
        heroPose.y + (ROBOT_H * heroPose.s) / 2,
      );
      const upp = unitsPerPx(hero.wx, hero.wy);
      const halfH = (ROBOT_H * sc) / 2 / upp;
      const halfW = (ROBOT_W * sc) / 2 / upp;
      const top = 72 + halfH; // below the nav
      const bottom = H - halfH - 24;
      // Walk in from slightly right of the illustration and close the gap slowly while the section
      // is pinned, so it keeps walking forward (never on the spot) and only arrives at 80–95%.
      const approach = r.width * 0.32 * (1 - smooth(0.55, 0.93, p));
      const destX = THREE.MathUtils.clamp(
        r.left + r.width / 2 + approach,
        halfW + 16,
        W - halfW - 16,
      );
      const destY = THREE.MathUtils.clamp(
        r.top + r.height / 2,
        top,
        Math.max(top, bottom),
      );
      sx = lerp(hero.x, destX, smooth(0.15, 0.38, p));
      sy = THREE.MathUtils.clamp(
        lerp(hero.y, destY, smooth(0.15, 0.5, p)),
        top,
        Math.max(top, bottom),
      );
      // Never cover the text column (heading + copy): when it is level with the robot, keep the
      // robot's right edge left of it (blended by the vertical overlap so it can't jump).
      if (introText) {
        const tr = introText.getBoundingClientRect();
        const overlap =
          THREE.MathUtils.clamp(
            (sy + halfH + 40 - tr.top) / (halfH * 0.3),
            0,
            1,
          ) * (tr.bottom > sy - halfH ? 1 : 0);
        sx = lerp(sx, Math.min(sx, tr.left - halfW - 16), overlap);
      }

      // Phase B: walk to the empty space RIGHT of the "Robotics without limits" heading (measured
      // from the heading's actual text box), stand there level with it, then separate into the cards.
      // (Mobile has no space beside the heading; the robot is faded out there and returns at the cards.)
      if (pb > 0) {
        const upp2 = unitsPerPx(hero.wx, hero.wy);
        const stage = stagingRect(W);
        const sB = Math.min(
          (stage.h * upp2) / ROBOT_H,
          (stage.w * upp2) / ROBOT_W,
        );
        sc = lerp(sc, sB, smooth(0.05, 0.4, pb));
        const hH = (ROBOT_H * sc) / 2 / upp2;
        const topB = 72 + hH;
        const botB = Math.max(topB, H - hH - 24);
        const by = THREE.MathUtils.clamp(stage.cy, topB, botB);
        // Sideways first, then down beside the heading.
        sx = lerp(sx, stage.cx, smooth(0.02, 0.28, pb));
        sy = THREE.MathUtils.clamp(
          lerp(sy, by, smooth(0.1, 0.4, pb)),
          topB,
          botB,
        );
        // Never cross the heading: while horizontally level with its text, stay above it.
        if (capsHeading && W > 640) {
          headingRange.selectNodeContents(capsHeading);
          const t = headingRange.getBoundingClientRect();
          const hW = (ROBOT_W * sc) / 2 / upp2;
          const level = THREE.MathUtils.clamp(
            (t.right + 16 - (sx - hW)) / (hW * 0.5),
            0,
            1,
          );
          sy = lerp(sy, Math.min(sy, t.top - hH - 12), level);
        }
        // Walk under (never across) the intro copy: while horizontally level with the text column,
        // keep the robot's top below the copy (blended by the overlap, so no jump).
        if (introText) {
          const tr = introText.getBoundingClientRect();
          const hW = (ROBOT_W * sc) / 2 / upp2;
          const hx = THREE.MathUtils.clamp(
            (sx + hW - tr.left) / (hW * 0.6),
            0,
            1,
          );
          if (tr.bottom > 0)
            sy = lerp(sy, Math.max(sy, tr.bottom + hH + 16), hx);
        }
      }
    }
    let x = heroPose.x,
      y = heroPose.y;
    if (sx !== null && toWorld(sx, sy)) {
      x = hit.x;
      y = hit.y - (ROBOT_H * sc) / 2;
    }
    rig.position.set(x, y, 0);
    rig.scale.setScalar(sc * (0.85 + 0.15 * intro.v)); // intro.v: entrance scale-up after the loader
    setFront(pb > 0.001);

    // Rotation: hero turntable (idle, only before scrolling), turning to face the way it walks,
    // then opening to a three-quarter view for the exploded presentation.
    if (!reduced) spin += dt * 0.18 * (1 - smooth(0, 0.05, p));
    const heroTurn = -0.5 + spin;
    let turn = heroTurn + wrap(FINAL_TURN - heroTurn) * smooth(0.15, 0.4, p);
    turn = lerp(turn, FACE_TURN, smooth(0.88, 1, p)); // turns to face the visitor on its last step
    // Phase B: turn toward the walking direction (down-right), face the visitor again on arrival
    // beside the heading, then open to a three-quarter view as the parts separate.
    turn = lerp(
      turn,
      0.9,
      smooth(0.02, 0.12, pb) * (1 - smooth(0.3, 0.42, pb)),
    );
    turn = lerp(turn, -0.8, smooth(0.58, 0.8, pb));
    holder.rotation.y = turn;
    // Feet stay on the ground (no floating); the entrance rise is the only vertical move.
    holder.position.y += (0 - holder.position.y) * 0.06 * intro.v;

    // Walk with the scroll: steps happen only while progress changes (no autoplay). Phase A walks in
    // and settles; phase B walks on, then stops before the parts separate.
    const phase =
      (mobile ? 6 : 10) * smooth(0.15, 0.97, p) +
      (mobile ? 3 : 5) * smooth(0, 0.4, pb);
    const strideA = smooth(0.15, 0.25, p) * (1 - smooth(0.86, 0.98, p));
    const strideB = smooth(0, 0.06, pb) * (1 - smooth(0.3, 0.4, pb));
    const stride = reduced ? 0 : Math.max(strideA, strideB);
    robot?.pose(phase, stride, t);
    robot?.animate(t);

    // Mobile: the copy spans the full width, so instead of walking across it GAJJU fades out as it
    // leaves the illustration and fades back in at the cards as it separates.
    if (robot && W <= 640)
      setRobotOpacity(1 - smooth(0.02, 0.15, pb) + smooth(0.8, 0.94, pb));

    // Exploded view aligned with the three capability cards.
    const ex = smooth(0.55, 0.97, pb); // after a short hold beside the heading
    if (explodeParts) {
      if (ex > 0) {
        capVisuals.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          if (!toWorld(r.left + r.width / 2, r.top + r.height / 2)) return;
          anchors[i].copy(hit);
          const upp = unitsPerPx(hit.x, hit.y);
          cardSize[i].w = r.width * upp;
          cardSize[i].h = r.height * upp;
        });
      }
      applyCardExplode(ex);
    }
    capVisuals.forEach(
      (el) => (el.style.opacity = String(1 - smooth(0.5, 0.8, pb))),
    );
    // Ground shadows belong to the standing robot: fade them as it separates (and with it on mobile).
    const ground = (1 - ex) * robotOpacity;
    contact.material.opacity = 0.55 * ground;
    shadowCatcher.material.opacity = 0.32 * ground;
    contact.visible = shadowCatcher.visible = ground > 0.01;

    // Hero scenery fades out; the line art fades as the robot arrives.
    const env = 1 - smooth(0.15, 0.5, p);
    fadeables.forEach((f) => (f.m.opacity = f.base * env));
    platform.userData.ring.material.opacity =
      (0.6 + Math.sin(t * 2) * 0.25) * env;
    platform.visible = halo.visible = halo2.visible = env > 0.01;
    floor.material.uniforms.uFade.value = env;
    floor.material.uniforms.uTime.value = t;
    particles.material.opacity = particleBase * env;
    particles.visible = env > 0.01;
    halo.rotation.z = t * 0.1;
    halo2.rotation.z = -t * 0.16;

    // Particles drift upward and wrap
    if (!reduced && particles.visible) {
      const arr = particles.geometry.attributes.position.array;
      const sp = particles.userData.speed;
      for (let i = 0; i < sp.length; i++) {
        arr[i * 3 + 1] += sp[i] * dt;
        if (arr[i * 3 + 1] > 5) arr[i * 3 + 1] = 0;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y = t * 0.02;
    }
  });

  stage.start();

  const api = {
    playIntro() {
      if (robot) runIntro();
      else introWanted = true;
    },
  };

  function runIntro() {
    if (reduced) {
      labelsRoot?.classList.add("is-on");
      return;
    }
    gsap.fromTo(
      intro,
      { v: 0 },
      {
        v: 1,
        duration: 1.4,
        ease: "power3.out",
        onComplete: () => labelsRoot?.classList.add("is-on"),
      },
    );
    gsap.fromTo(
      holder.rotation,
      { x: 0.2 },
      { x: 0, duration: 1.6, ease: "power3.out" },
    );
  }
  return api;
}
