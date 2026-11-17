/**
 * Part helpers shared by every GAJJU view. Parts follow the contract built in gajju-model.js:
 *   { id, name, kind, group, step, object, home: Vector3, offset: Vector3 }
 */

/** Move each part from its CAD position along its explode offset (0 = assembled, 1 = exploded). */
export function applyExplode(parts, amount) {
  for (const p of parts)
    p.object.position.copy(p.home).addScaledVector(p.offset, amount);
}

export function setHighlight(object, on, color = 0x3de8ff, strength = 0.55) {
  object.traverse((o) => {
    if (!o.isMesh || o.userData.glow || !o.material.emissive) return;
    if (o.userData.baseEmissive === undefined) {
      o.userData.baseEmissive = o.material.emissive.getHex();
      o.userData.baseEmissiveIntensity = o.material.emissiveIntensity;
    }
    if (on) {
      o.material.emissive.setHex(color);
      o.material.emissiveIntensity = strength;
    } else {
      o.material.emissive.setHex(o.userData.baseEmissive);
      o.material.emissiveIntensity = o.userData.baseEmissiveIntensity;
    }
  });
}

export function setOpacity(object, opacity) {
  object.traverse((o) => {
    if (!o.isMesh) return;
    o.material.transparent = opacity < 1;
    o.material.opacity = opacity;
    o.material.depthWrite = opacity > 0.5;
  });
  object.visible = opacity > 0.01;
}
