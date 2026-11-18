// Home hero: the real Gajju Mini CAD model (public/models/gajju2_robot.glb) in brand colours,
// standing in a contained frame beside the headline. It sways gently around a three-quarter view
// to show its depth; with reduced motion it stays still. No walk cycle: the site only shows
// walking in the labelled simulation video, never a made-up gait.
import * as THREE from "three";
import { createStage, prefersReducedMotion } from "./stage.js";
import { loadGajjuAsset, createGajju, addBrandStudio, frameCamera } from "./gajju-model.js";

/**
 * @param {HTMLElement} host  element the canvas fills
 * @param {{ onReady?: () => void, onError?: (message: string) => void }} cb
 * @returns {{ destroy(): void } | null}  null when WebGL is unavailable (onError is called)
 */
export function createHeroRobot(host, { onReady = () => {}, onError = () => {} } = {}) {
  const reduced = prefersReducedMotion();
  const stage = createStage(host, { fov: 30, position: [6, 3, 7], target: [0, 0.9, 0], exposure: 1.0, envIntensity: 0.55 });
  if (!stage) {
    onError("3D needs WebGL, which this browser doesn't have.");
    return null;
  }
  const { scene, camera, renderer } = stage;
  addBrandStudio(scene, { renderer });

  let robot = null;
  let destroyed = false;
  const START_TURN = -0.55; // three-quarter view, face toward the headline
  const SWAY = 0.35; // radians either side: shows its depth while it keeps facing the visitor

  stage.onTick((dt, t) => {
    if (robot && !reduced) robot.group.rotation.y = START_TURN + Math.sin(t * 0.3) * SWAY;
  });
  stage.start();

  loadGajjuAsset().then(
    (asset) => {
      if (destroyed) return;
      robot = createGajju(asset, { shadows: true, palette: "brand" });
      robot.group.rotation.y = START_TURN;
      scene.add(robot.group);
      // Frame the union of the model's world bounds at both ends of the sway, so it never clips.
      const swept = new THREE.Box3();
      for (const turn of [START_TURN - SWAY, START_TURN, START_TURN + SWAY]) {
        robot.group.rotation.y = turn;
        robot.group.updateMatrixWorld(true);
        swept.union(new THREE.Box3().setFromObject(robot.group));
      }
      robot.group.rotation.y = START_TURN;
      const home = frameCamera(camera, swept, { fill: 0.9, direction: [0.35, 0.38, 1] });
      camera.position.copy(home.position);
      camera.lookAt(home.target);
      stage.target.copy(home.target);
      stage.render();
      onReady();
    },
    (err) => {
      if (destroyed) return;
      console.error(err);
      onError("The 3D model couldn't be loaded.");
    },
  );

  return {
    destroy() {
      destroyed = true;
      stage.dispose();
    },
  };
}
