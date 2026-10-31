// @ts-nocheck — «мелкая жизнь» мира (spec v0.5, задача P4)
// Модуль ищет в сцене помеченные объекты и оживляет их:
//   userData.sway — дерево качается от ветра (качание вокруг основания);
//   userData.dust — у фонаря летает пыль ({ y } — высота лампы над группой);
//   userData.pond — по пруду идёт рябь ({ r, y } — радиус зоны и высота воды).
// Следы облачка автора (вмятины в траве) — тоже здесь: dent(island, worldPos).
// Светлячки у интерактивных объектов (spec v0.6): fly(group, worldPos) — мерцает и кружит рядом.
import { THREE } from './core.js';

const ringGeo = new THREE.RingGeometry(0.86, 1, 40).rotateX(-Math.PI / 2);
let haloTex;
function halo() {
  if (haloTex) return haloTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,250,200,1)'); gr.addColorStop(0.25, 'rgba(255,236,140,.55)'); gr.addColorStop(1, 'rgba(255,220,120,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); haloTex = new THREE.CanvasTexture(c); return haloTex;
}

export function addLife(scene) {
  const sway = [], dust = [], ponds = [], dents = [], flies = [];
  scene.traverse((o) => {
    if (o.userData.sway !== undefined) sway.push({ o, ph: o.userData.sway, rz: o.rotation.z, rx: o.rotation.x });
    if (o.userData.dust) dust.push(makeDust(o, o.userData.dust.y));
    if (o.userData.pond) ponds.push(makePond(o, o.userData.pond));
  });

  return {
    // t — «кадровое» время (12 кадров/с), night — 0…1
    update(t, night, tr = t) {
      flies.forEach((f) => {
        const a = tr * f.s + f.ph;
        f.g.position.set(f.base.x + Math.sin(a) * 0.22, f.base.y + Math.sin(a * 1.7) * 0.1, f.base.z + Math.sin(a * 0.8) * 0.16);
        const k = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(tr * 2.6 + f.ph * 3), 3); // мерцание
        f.core.material.opacity = 0.5 + k * 0.5; f.glow.material.opacity = k * (0.65 + night * 0.35); f.glow.scale.setScalar(0.42 + k * 0.22);
      });
      sway.forEach(({ o, ph, rz, rx }) => { o.rotation.z = rz + Math.sin(t * 1.3 + ph) * 0.035; o.rotation.x = rx + Math.sin(t * 0.9 + ph * 1.7) * 0.02; });
      dust.forEach((d) => d.update(t, night));
      ponds.forEach((p) => p.update(t));
      dents.forEach((d) => { d.k = Math.min(1, d.k + 0.04); d.mats.forEach((m, i) => { m.opacity = d.k * (i ? 0.22 : 0.14); }); });
    },
    // светлячок рядом с интерактивным объектом; group — остров, pos — точка в мировых координатах
    fly(group, pos) {
      const g = new THREE.Group();
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff6b0, transparent: true, toneMapped: false }));
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo(), color: 0xfff0a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      g.add(core, glow);
      group.updateMatrixWorld(); const base = group.worldToLocal(pos.clone()); g.position.copy(base);
      // светлячок не зависит от масштаба острова
      const ws = new THREE.Vector3(); group.getWorldScale(ws); g.scale.setScalar(1 / ws.x);
      group.add(g); flies.push({ g, core, glow, base, ph: Math.random() * 6.3, s: 0.6 + Math.random() * 0.5 });
    },
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
