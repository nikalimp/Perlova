// @ts-nocheck — модули мира перенесены из прототипа (specs/prototypes/world-src), типизация не нужна
import { THREE, clay, glow, mesh, sphere, islandBase, cloud } from './core.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const rb = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 3, r);
const STEP_COLORS = [0xff6b6b, 0xf49ac1, 0x7bd389, 0xffd166, 0xb79be0, 0xffa94d, 0x8fd3ff, 0x4a6fe0]; // красная…синяя — из текста

// «Асфодель» — ночная планета: тёмный пруд, поле асфоделей, поющая лестница в облачный Город Снегов, белые стрижи
export function buildAsfodel(scene) {
  const root = new THREE.Group();
  const island = islandBase({ R: 6, soil: 0x5b5470, band: 0x433d57, cream: 0x8a85a0, rim: 0x6f7f86, top: 0x5f6a72 });
  root.add(island);

  // тёмный пруд и серебристая ива
  const pond = mesh(new THREE.CircleGeometry(2.2, 48), new THREE.MeshPhysicalMaterial({ color: 0x1d2440, roughness: 0.1, clearcoat: 1 }));
  pond.rotation.x = -Math.PI / 2; pond.position.set(-1.6, 0.12, 1.4); island.add(pond);
  const willow = new THREE.Group();
  const tr = mesh(new THREE.CylinderGeometry(0.18, 0.3, 2.2, 10), clay(0x6c6a78)); tr.position.y = 1.1; willow.add(tr);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2, pts = [];
    for (let k = 0; k < 6; k++) pts.push(new THREE.Vector3(Math.cos(a) * (0.9 + k * 0.08), 2.4 - k * 0.38, Math.sin(a) * (0.9 + k * 0.08)));
    willow.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.045, 5), clay(0xc3ccd6, 0.5)));
  }
  const crown = sphere(0.9, clay(0xaeb8c4, 0.6)); crown.scale.y = 0.6; crown.position.y = 2.4; willow.add(crown);
  willow.position.set(-4.0, 0.1, 0.2); island.add(willow);

  // поле асфоделей — серые стебли и белые звёздочки
  for (let i = 0; i < 70; i++) {
    const a = i * 2.39, r = 2.4 + (i % 9) * 0.38;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.hypot(x + 1.6, z - 1.4) < 2.4) continue;
    const st = mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.5, 4), clay(0x8b93a0)); st.position.set(x, 0.35, z); island.add(st);
    const fl = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), glow(0xf3f6fa, 0.5)); fl.position.set(x, 0.62, z); island.add(fl);
  }

  // облачная подушка и Город Снегов
  const sky = new THREE.Group(); sky.position.set(1.2, 9.5, -1.6); root.add(sky);
  [[0, 0, 0, 2.2], [2.2, -0.2, 0.4, 1.7], [-2.1, -0.3, 0.3, 1.8], [0.8, -0.4, 2.0, 1.5], [-0.8, -0.3, -1.9, 1.6], [2.0, -0.3, -1.6, 1.3]]
    .forEach(([x, y, z, r]) => { const c = sphere(r, clay(0xf3f6fa, 0.95, { emissive: 0x5a6aa8, emissiveIntensity: 0.55 }), 24, 16); c.scale.y = 0.55; c.position.set(x, y, z); c.castShadow = false; sky.add(c); });
  const city = new THREE.Group(); city.position.y = 0.9; sky.add(city);
  const stoneM = clay(0xf3f6fa, 0.45, { emissive: 0x8a96c8, emissiveIntensity: 0.35 }), spireM = clay(0xc3ccd6, 0.25, { metalness: 0.5 }), winM = glow(0xfff1c2, 0.9);
  const tower = (x, z, h, r = 0.32) => {
    const g = new THREE.Group();
    const b = mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 16), stoneM); b.position.y = h / 2; g.add(b);
    const s = mesh(new THREE.ConeGeometry(r * 1.15, h * 0.6, 16), spireM); s.position.y = h + h * 0.3; g.add(s);
    for (let i = 0; i < Math.floor(h / 0.5); i++) { const w = mesh(rb(0.09, 0.14, 0.03, 0.02), winM); w.position.set(0, 0.35 + i * 0.5, r + 0.01); g.add(w); }
    g.position.set(x, 0, z); city.add(g); return g;
  };
  // дворец Лазурины с четырьмя башнями
  const palace = mesh(rb(1.8, 1.3, 1.4, 0.1), stoneM); palace.position.y = 0.65; city.add(palace);
  const dome = sphere(0.7, spireM); dome.scale.y = 0.7; dome.position.y = 1.4; city.add(dome);
  [[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]].forEach(([x, z]) => tower(x, z, 2.1, 0.26));
  [[-2.2, 0.4, 1.2], [2.3, 0.2, 1.4], [-1.6, -1.6, 1.0], [1.7, -1.4, 0.9], [0.2, 1.8, 0.8], [-2.6, -0.8, 0.7]].forEach(([x, z, h]) => tower(x, z, h, 0.3));
  const lanterns = [];
  for (let i = 0; i < 24; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), glow(0xffe7a8, 1.6)); const a = i * 0.9; l.position.set(Math.cos(a) * (1.2 + (i % 4) * 0.5), 0.15 + (i % 3) * 0.1, Math.sin(a) * (1.2 + (i % 4) * 0.5)); city.add(l); lanterns.push(l); }

  // поющая лестница: от пруда вверх к облаку — 300 шагов, в сцене 40 ступеней
  const stairs = new THREE.Group(); island.add(stairs);
  const steps = [];
  const N = 40, start = new THREE.Vector3(-1.2, 0.2, 1.2), end = new THREE.Vector3(1.0, 9.3, -0.4);
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1);
    const a = k * Math.PI * 1.6;
    const p = new THREE.Vector3().lerpVectors(start, end, k);
    p.x += Math.sin(a) * 2.2; p.z += Math.cos(a) * 1.4 - 1.4;
    const c = STEP_COLORS[i % 8];
    const m = new THREE.MeshPhysicalMaterial({ color: c, emissive: c, emissiveIntensity: 0.05, transmission: 0.4, roughness: 0.2, thickness: 0.2, transparent: true, opacity: 0.75 });
    const s = new THREE.Mesh(rb(0.9, 0.08, 0.5, 0.04), m);
    s.position.copy(p); s.rotation.y = a + Math.PI / 2; stairs.add(s); steps.push(s);
  }

  // белые стрижи
  const swifts = [];
  for (let i = 0; i < 12; i++) {
    const b = new THREE.Group();
    [-1, 1].forEach((s) => { const w = sphere(0.22, clay(0xffffff, 0.5), 10, 6); w.scale.set(0.35, 0.06, 1); w.position.z = s * 0.18; w.rotation.y = s * 0.5; b.add(w); });
    const body = sphere(0.08, clay(0xffffff, 0.5)); body.scale.x = 2; b.add(body);
    b.userData = { a: i * 0.52, r: 3.2 + (i % 4) * 0.7, h: 9 + (i % 5) * 0.6, s: 0.4 + (i % 3) * 0.15 };
    root.add(b); swifts.push(b);
  }

  // луна
  const moon = sphere(2.2, glow(0xfff6dc, 1.1), 32, 20); moon.position.set(-14, 22, -30); moon.castShadow = false; root.add(moon);

  const stepsLit = { v: 0 };
  return {
    root, island, city,
    hit: [],
    focus: new THREE.Vector3(0, 4, 0),
    stepsLit,
    update(t, reduce, local) {
      const lit = Math.round(local * N);
      stepsLit.v = Math.round(local * 300); stepsLit.n = lit; // сколько ступеней горит — для ксилофона (main.js)
      steps.forEach((s, i) => {
        const on = i < lit;
        s.material.emissiveIntensity += ((on ? 1.4 + Math.sin(t * 3 + i) * 0.2 : 0.05) - s.material.emissiveIntensity) * 0.15;
      });
      swifts.forEach((b) => { const d = b.userData; const a = d.a + t * d.s; b.position.set(1.2 + Math.cos(a) * d.r, d.h + Math.sin(t * 1.5 + d.a) * 0.4, -1.6 + Math.sin(a) * d.r); b.rotation.y = -a; b.children[0].rotation.x = Math.sin(t * 10 + d.a) * 0.4; b.children[1].rotation.x = -Math.sin(t * 10 + d.a) * 0.4; });
      lanterns.forEach((l, i) => { l.material.emissiveIntensity = 1.2 + Math.sin(t * 2 + i) * 0.5; });
      sky.position.y = 9.5 + Math.sin(t * 0.5) * 0.15;
    },
  };
}
