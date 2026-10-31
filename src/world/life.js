// @ts-nocheck — «мелкая жизнь» мира (spec v0.5, задача P4)
// Модуль ищет в сцене помеченные объекты и оживляет их:
//   userData.sway — дерево качается от ветра (качание вокруг основания);
//   userData.dust — у фонаря летает пыль ({ y } — высота лампы над группой);
//   userData.pond — по пруду идёт рябь ({ r, y } — радиус зоны и высота воды).
// Следы облачка автора (вмятины в траве) — тоже здесь: dent(island, worldPos).
import { THREE } from './core.js';

const ringGeo = new THREE.RingGeometry(0.86, 1, 40).rotateX(-Math.PI / 2);

export function addLife(scene) {
  const sway = [], dust = [], ponds = [], dents = [], ripples = [], squishes = [];
  scene.traverse((o) => {
    if (o.userData.sway !== undefined) sway.push({ o, ph: o.userData.sway, rz: o.rotation.z, rx: o.rotation.x });
    if (o.userData.dust) dust.push(makeDust(o, o.userData.dust.y));
    if (o.userData.pond) ponds.push(makePond(o, o.userData.pond));
  });

  return {
    // t — «кадровое» время (12 кадров/с), night — 0…1
    update(t, night) {
      // рябь от клика: кольцо расходится и тает
      for (let i = ripples.length - 1; i >= 0; i--) { const r = ripples[i]; r.k += 0.03; r.m.scale.setScalar(0.1 + r.k * 1.4); r.m.material.opacity = (1 - r.k) * 0.6; if (r.k >= 1) { r.m.removeFromParent(); r.m.material.dispose(); ripples.splice(i, 1); } }
      // «мнётся, как пластилин»: сплющился и упруго вернулся
      for (let i = squishes.length - 1; i >= 0; i--) { const q = squishes[i]; q.k += 0.045; const e = Math.exp(-q.k * 5) * Math.cos(q.k * 16) * 0.22;
        q.o.scale.set(q.s.x * (1 + e * 0.6), q.s.y * (1 - e), q.s.z * (1 + e * 0.6)); if (q.k >= 1) { q.o.scale.copy(q.s); squishes.splice(i, 1); } }
      sway.forEach(({ o, ph, rz, rx }) => { o.rotation.z = rz + Math.sin(t * 1.3 + ph) * 0.035; o.rotation.x = rx + Math.sin(t * 0.9 + ph * 1.7) * 0.02; });
      dust.forEach((d) => d.update(t, night));
      ponds.forEach((p) => p.update(t));
      dents.forEach((d) => { d.k = Math.min(1, d.k + 0.04); d.mats.forEach((m, i) => { m.opacity = d.k * (i ? 0.22 : 0.14); }); });
    },
    // рябь в точке клика по земле или воде (spec v0.12, дизайнер)
    ripple(group, pos) {
      const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }));
      group.updateMatrixWorld(); m.position.copy(group.worldToLocal(pos.clone())); m.position.y += 0.03; group.add(m); ripples.push({ m, k: 0 });
    },
    // предмет «мнётся» по клику; повторный клик во время анимации не копит искажение
    squish(o) { if (squishes.some((q) => q.o === o)) return; squishes.push({ o, s: o.scale.clone(), k: 0 }); },
    // вмятина от облачка там, где автор приземлился; group — остров, pos — точка на земле в мировых координатах
    dent(group, pos) {
      const g = new THREE.Group(), mats = [];
      const dark = new THREE.MeshBasicMaterial({ color: 0x2c3a22, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
      const lite = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
      mats.push(dark, lite);
      // форма облачка: три сплющенных круга
      [[0, 0, 0.5], [0.45, 0.05, 0.38], [-0.45, -0.04, 0.36]].forEach(([x, z, r]) => {
        const d = new THREE.Mesh(new THREE.CircleGeometry(r, 28).rotateX(-Math.PI / 2), dark); d.position.set(x, 0, z); g.add(d);
        const rim = new THREE.Mesh(ringGeo, lite); rim.scale.setScalar(r * 1.08); rim.position.set(x, 0.005, z); g.add(rim);
      });
      group.updateMatrixWorld(); g.position.copy(group.worldToLocal(pos.clone()));
      group.add(g); dents.push({ k: 0, mats });
    },
  };
}

// пыль в свете фонаря: 28 тёплых точек медленно кружат в шаре
function makeDust(parent, y) {
  const N = 28, pos = new Float32Array(N * 3), seed = [];
  for (let i = 0; i < N; i++) seed.push([Math.random() * 6.3, 0.15 + Math.random() * 0.45, Math.random() * 6.3, 0.2 + Math.random() * 0.5]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xfff0c8, size: 0.05, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, mat); pts.position.y = y; pts.frustumCulled = false; parent.add(pts);
  return {
    update(t, night) {
      mat.opacity = 0.25 + night * 0.6;
      seed.forEach(([a, r, b, s], i) => {
        pos[i * 3] = Math.cos(a + t * s * 0.4) * r; pos[i * 3 + 1] = -0.35 + ((b + t * s * 0.12) % 1) * 0.6; pos[i * 3 + 2] = Math.sin(a + t * s * 0.4) * r;
      });
      geo.attributes.position.needsUpdate = true;
    },
  };
}

// рябь: кольца расходятся по воде и тают, каждое в своём месте
function makePond(parent, { r, y }) {
  const rings = [0, 1, 2, 3].map((i) => {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xe8fffb, transparent: true, opacity: 0, depthWrite: false }));
    m.position.y = y; parent.add(m);
    return { m, off: i * 0.9, cyc: -1 };
  });
  return {
    update(t) {
      rings.forEach((g) => {
        const T = (t + g.off) / 3.6, cyc = Math.floor(T), f = T - cyc;
        if (cyc !== g.cyc) { g.cyc = cyc; const a = Math.random() * 6.3, d = Math.sqrt(Math.random()) * r; g.m.position.x = Math.cos(a) * d; g.m.position.z = Math.sin(a) * d; }
        g.m.scale.setScalar(0.15 + f * 0.9); g.m.material.opacity = (1 - f) * 0.45;
      });
    },
  };
}
