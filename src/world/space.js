// @ts-nocheck — космос вокруг пути (spec v0.13, арт-директор): бумажные звёзды и далёкие пластилиновые луны.
// Звёзды — один InstancedMesh (одна команда видеокарте), луны — по две-три формы. Медленно вращаются — видно, что мы летим.
import { THREE, clay, glow, sphere, mesh } from './core.js';

function starShape(r = 1, k = 0.45) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? r * k : r; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); }
  return s;
}

export function addSpace(scene, path) {
  // бумажные звёзды: плоские, чуть объёмные, тёплого бумажного цвета, разбросаны вдоль пути далеко в стороны
  const geo = new THREE.ExtrudeGeometry(starShape(1), { depth: 0.18, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.06, bevelSegments: 2 });
  const N = 70, stars = new THREE.InstancedMesh(geo, glow(0xfff1c9, 0.35), N), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let seed = 3; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const spin = [];
  for (let i = 0; i < N; i++) {
    const base = path[Math.floor(r() * path.length)], a = r() * Math.PI * 2, d = 45 + r() * 70;
    const pos = new THREE.Vector3(base[0] + Math.cos(a) * d, base[1] + (r() - 0.3) * 50, base[2] + Math.sin(a) * d);
    const s = 0.6 + r() * 1.6; e.set(r() * 0.6, r() * 6.3, r() * 6.3); spin.push({ pos, s, e: e.clone(), w: (r() - 0.5) * 0.4 });
  }
  stars.castShadow = false; stars.frustumCulled = false; scene.add(stars);
  // далёкие луны: пластилиновые шары с кольцом или кратерами
  const moons = new THREE.Group(); scene.add(moons);
  [[-60, 18, -40, 6, 0xf2b8c6, true], [90, 30, -150, 9, 0xb9d7f0, false], [200, -10, -60, 7, 0xf6d38a, true], [150, 40, -210, 5, 0xc9b6f0, false]].forEach(([x, y, z, rad, col, ring]) => {
    const g = new THREE.Group(); g.position.set(x, y, z);
    const s = sphere(rad, clay(col, 0.9), 40, 26); s.castShadow = false; g.add(s);
    if (ring) { const t = mesh(new THREE.TorusGeometry(rad * 1.6, rad * 0.12, 12, 64), clay(0xfff4e0, 0.9)); t.rotation.x = Math.PI / 2.4; t.castShadow = false; g.add(t); }
    else for (let i = 0; i < 6; i++) { const c = sphere(rad * (0.12 + r() * 0.12), clay(col - 0x101010, 0.95), 16, 10); const a = r() * 6.3, b = r() * 3.1; c.position.setFromSphericalCoords(rad * 0.97, b, a); c.scale.y = 0.4; c.lookAt(0, 0, 0); g.add(c); }
    g.userData.w = 0.02 + r() * 0.03; moons.add(g);
  });
  return {
    update(t) {
      spin.forEach((s, i) => { e.set(s.e.x, s.e.y + t * s.w, s.e.z); q.setFromEuler(e); m4.compose(s.pos, q, new THREE.Vector3(s.s, s.s, s.s)); stars.setMatrixAt(i, m4); });
      stars.instanceMatrix.needsUpdate = true;
      moons.children.forEach((g) => { g.rotation.y = t * g.userData.w; });
    },
  };
}
