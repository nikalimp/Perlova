import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const canvas = document.getElementById('scene');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  document.documentElement.classList.add('no-webgl');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf9dcd4, 40, 90);
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

// ---------- свет ----------
scene.add(new THREE.HemisphereLight(0xffe6ef, 0x8a6a55, 1.15));
const sun = new THREE.DirectionalLight(0xfff0dd, 2.4);
sun.position.set(-8, 16, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 50 });
sun.shadow.radius = 6;
sun.shadow.bias = -0.0006;
scene.add(sun);
const rim = new THREE.DirectionalLight(0xffb7c8, 0.9);
rim.position.set(10, 6, -10);
scene.add(rim);

// ---------- материалы «глина» ----------
const clay = (color, rough = 0.82) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
const M = {
  soil: clay(0xb98a64), soilDark: clay(0x8e6448), cream: clay(0xf3e3cf),
  grass: clay(0x86b85a), grassDark: clay(0x5f9a46), pad: clay(0x6fae47), padDark: clay(0x4f8a3a),
  petal: clay(0xf6c1a8, 0.7), petalIn: clay(0xfde6da, 0.7), core: clay(0xf2c46b, 0.6), coreDark: clay(0xe59f3a),
  frog: clay(0x7fbe4f), white: clay(0xffffff, 0.5), black: clay(0x26201f, 0.4),
  bark: clay(0x8a6247), stone: clay(0xc9bdb4), reed: clay(0x7a9a47), cattail: clay(0x6e4a32),
  whale: clay(0x4a6db0, 0.6), whaleBelly: clay(0xdfe7f5, 0.7),
  star: new THREE.MeshStandardMaterial({ color: 0xffe7a8, emissive: 0xffd977, emissiveIntensity: 1.6 }),
};
const shadowed = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
const mesh = (g, m) => shadowed(new THREE.Mesh(g, m));

// ---------- остров ----------
const island = new THREE.Group();
scene.add(island);

// тело острова — «пирог» из слоёв (LatheGeometry)
const R = 6;
const prof = [
  [0, -2.6], [R * 0.55, -2.6], [R * 0.86, -2.2], [R * 0.95, -1.5], [R * 0.98, -0.9],
  [R * 1.0, -0.35], [R * 1.0, 0.0], [R * 0.99, 0.12],
].map(([x, y]) => new THREE.Vector2(x, y));
const body = mesh(new THREE.LatheGeometry(prof, 72), M.soil);
island.add(body);
const band = mesh(new THREE.CylinderGeometry(R * 1.005, R * 0.99, 0.35, 72, 1, true), M.soilDark);
band.position.y = -1.1;
island.add(band);
const creamBand = mesh(new THREE.CylinderGeometry(R * 0.965, R * 0.9, 0.28, 72, 1, true), M.cream);
creamBand.position.y = -1.85;
island.add(creamBand);

// травяной бортик
const rimTorus = mesh(new THREE.TorusGeometry(R * 0.93, 0.48, 18, 96), M.grass);
rimTorus.rotation.x = Math.PI / 2;
rimTorus.position.y = 0.18;
island.add(rimTorus);
const top = mesh(new THREE.CircleGeometry(R * 0.95, 72), M.grass);
top.rotation.x = -Math.PI / 2;
top.position.y = 0.05;
island.add(top);

// вода
const waterGeo = new THREE.CircleGeometry(R * 0.82, 96, 0, Math.PI * 2);
waterGeo.rotateX(-Math.PI / 2);
const water = new THREE.Mesh(waterGeo, new THREE.MeshPhysicalMaterial({
  color: 0x3fb8a6, roughness: 0.15, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.25,
  sheen: 0.6, sheenColor: new THREE.Color(0xbff0e6),
}));
water.position.y = 0.12;
water.receiveShadow = true;
island.add(water);
const waterBase = waterGeo.attributes.position.array.slice();

// ---------- лист кувшинки ----------
function padGeo(r) {
  const s = new THREE.Shape();
  const a = 0.32;
  s.moveTo(0, 0);
  s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  s.absarc(0, 0, r, a, Math.PI * 2 - a, false);
  s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.05, bevelSegments: 3, curveSegments: 40 });
  g.rotateX(-Math.PI / 2);
  return g;
}
const pads = [
  [-2.6, -1.6, 0.9, 0.3], [2.4, -2.4, 0.75, 2.2], [-1.0, 2.8, 1.0, 4.1], [3.0, 1.6, 0.85, 5.0],
  [-3.6, 1.0, 0.7, 1.4], [0.6, -3.6, 0.6, 3.1], [-3.4, -2.9, 0.55, 2.6], [1.4, 3.6, 0.6, 0.9],
];
pads.forEach(([x, z, r, rot], i) => {
  const p = mesh(padGeo(r), i % 2 ? M.pad : M.padDark);
  p.position.set(x, 0.16, z);
  p.rotation.y = rot;
  island.add(p);
});

// ---------- цветок ----------
function petalGeo(len, wid) {
  const g = new THREE.SphereGeometry(1, 24, 16);
  g.scale(wid, 0.14, len);
  g.translate(0, 0, len * 0.92);
  return g;
}
function makeLily(scale = 1) {
  const g = new THREE.Group();
  const outer = [], inner = [];
  const po = petalGeo(0.62, 0.24), pi = petalGeo(0.45, 0.2);
  for (let i = 0; i < 10; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 10) * Math.PI * 2;
    const p = mesh(po, M.petal);
    pivot.add(p); g.add(pivot); outer.push(p);
  }
  for (let i = 0; i < 8; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 8) * Math.PI * 2 + 0.3;
    const p = mesh(pi, M.petalIn);
    p.position.y = 0.06;
    pivot.add(p); g.add(pivot); inner.push(p);
  }
  const core = mesh(new THREE.SphereGeometry(0.2, 20, 14), M.core);
  core.scale.y = 0.6; core.position.y = 0.1;
  g.add(core);
  for (let i = 0; i < 14; i++) {
    const s = mesh(new THREE.SphereGeometry(0.035, 8, 6), M.coreDark);
    const a = (i / 14) * Math.PI * 2;
    s.position.set(Math.cos(a) * 0.17, 0.2, Math.sin(a) * 0.17);
    g.add(s);
  }
  g.scale.setScalar(scale);
  g.userData = { outer, inner, open: 1 };
  return g;
}
function setLilyOpen(l, t) {
  // t: 0 — бутон, 1 — раскрыт
  l.userData.outer.forEach((p) => { p.rotation.x = -THREE.MathUtils.lerp(1.25, 0.18, t); });
  l.userData.inner.forEach((p) => { p.rotation.x = -THREE.MathUtils.lerp(1.4, 0.55, t); });
  l.userData.open = t;
}

// маленькие кувшинки на листьях
[[-2.6, -1.6, 0.8], [3.0, 1.6, 0.7], [-1.0, 2.8, 0.75], [1.4, 3.6, 0.55]].forEach(([x, z, s]) => {
  const l = makeLily(s); l.position.set(x + 0.15, 0.24, z + 0.1); setLilyOpen(l, 0.9); island.add(l);
});

// главная кувшинка — интерактив
const heroPad = mesh(padGeo(1.5), M.padDark);
heroPad.position.set(0.6, 0.17, -0.2); heroPad.rotation.y = 1.1;
island.add(heroPad);
const hero = makeLily(1.6);
hero.position.set(0.55, 0.28, -0.25);
island.add(hero);
setLilyOpen(hero, 0.0);
let heroTarget = 0;

// ---------- лягушонок ----------
const frog = new THREE.Group();
const fBody = mesh(new THREE.SphereGeometry(0.42, 24, 18), M.frog); fBody.scale.set(1, 0.72, 0.9); fBody.position.y = 0.3;
frog.add(fBody);
[-0.18, 0.18].forEach((x) => {
  const eye = mesh(new THREE.SphereGeometry(0.15, 18, 14), M.frog); eye.position.set(x, 0.62, 0.12); frog.add(eye);
  const w = mesh(new THREE.SphereGeometry(0.1, 16, 12), M.white); w.position.set(x, 0.66, 0.2); frog.add(w);
  const b = mesh(new THREE.SphereGeometry(0.05, 12, 10), M.black); b.position.set(x, 0.67, 0.29); frog.add(b);
});
const smile = mesh(new THREE.TorusGeometry(0.13, 0.025, 8, 20, Math.PI), M.black);
smile.rotation.set(0, 0, Math.PI); smile.position.set(0, 0.38, 0.36); frog.add(smile);
[-0.3, 0.3].forEach((x) => { const leg = mesh(new THREE.SphereGeometry(0.16, 14, 10), M.frog); leg.scale.set(1.2, 0.5, 1.4); leg.position.set(x, 0.12, -0.05); frog.add(leg); });
frog.scale.setScalar(1.35);
frog.position.set(-2.55, 0.2, -1.5);
frog.rotation.y = 0.9;
island.add(frog);

// ---------- ива ----------
const willow = new THREE.Group();
const trunk = mesh(new THREE.CylinderGeometry(0.22, 0.38, 2.6, 12), M.bark); trunk.position.y = 1.3; willow.add(trunk);
const crownMat = M.grassDark;
for (let i = 0; i < 7; i++) {
  const c = mesh(new THREE.IcosahedronGeometry(0.85 + Math.random() * 0.35, 1), crownMat);
  const a = (i / 7) * Math.PI * 2;
  c.position.set(Math.cos(a) * 0.7, 2.9 + Math.random() * 0.4, Math.sin(a) * 0.7);
  willow.add(c);
}
const strandMat = clay(0x6aa64c);
for (let i = 0; i < 26; i++) {
  const a = (i / 26) * Math.PI * 2, r = 1.2 + Math.random() * 0.4;
  const pts = [];
  for (let k = 0; k < 6; k++) pts.push(new THREE.Vector3(Math.cos(a) * (r + k * 0.06), 3.0 - k * 0.42, Math.sin(a) * (r + k * 0.06)));
  const tube = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.05, 6), strandMat);
  willow.add(tube);
}
willow.position.set(-4.3, 0.2, 2.6);
island.add(willow);

// камыши
for (let i = 0; i < 14; i++) {
  const a = 0.2 + (i / 14) * 1.3, r = R * 0.86 + Math.random() * 0.3;
  const h = 0.9 + Math.random() * 0.6;
  const st = mesh(new THREE.CylinderGeometry(0.03, 0.04, h, 6), M.reed);
  st.position.set(Math.cos(a) * r, 0.2 + h / 2, Math.sin(a) * r);
  st.rotation.z = (Math.random() - 0.5) * 0.2;
  island.add(st);
  if (i % 2 === 0) { const ct = mesh(new THREE.CapsuleGeometry(0.07, 0.28, 4, 8), M.cattail); ct.position.set(st.position.x, 0.25 + h, st.position.z); island.add(ct); }
}
// камни
for (let i = 0; i < 9; i++) {
  const a = 3.4 + (i / 9) * 1.6, r = R * 0.88;
  const s = mesh(new THREE.IcosahedronGeometry(0.2 + Math.random() * 0.22, 1), M.stone);
  s.position.set(Math.cos(a) * r, 0.3, Math.sin(a) * r);
  s.scale.y = 0.6;
  island.add(s);
}
// светлячки (феи)
const flyGeo = new THREE.SphereGeometry(0.05, 8, 6);
const flies = [];
for (let i = 0; i < 18; i++) {
  const f = new THREE.Mesh(flyGeo, M.star);
  f.userData = { a: Math.random() * 6.28, r: 1 + Math.random() * 4, h: 0.6 + Math.random() * 1.6, s: 0.2 + Math.random() * 0.4 };
  island.add(f); flies.push(f);
}

// ---------- облака из «глины» и тень острова ----------
const cloudMat = clay(0xfff7f2, 0.95);
function cloud(x, y, z, s) {
  const c = new THREE.Group();
  [[0, 0, 0, 1], [0.9, -0.1, 0.2, 0.75], [-0.9, -0.15, 0, 0.7], [0.3, 0.35, -0.1, 0.65], [-0.4, 0.3, 0.2, 0.55]]
    .forEach(([a, b, d, r]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), cloudMat); m.position.set(a, b, d); m.scale.y = 0.8; c.add(m); });
  c.position.set(x, y, z); c.scale.setScalar(s); scene.add(c); return c;
}
const clouds = [cloud(-11, 4, -6, 1.6), cloud(10, 2, 4, 1.2), cloud(-6, -4, 8, 1.1), cloud(16, 8, -26, 2), cloud(32, 6, -38, 1.5)];
const shadowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(90,50,60,.45)'); gr.addColorStop(1, 'rgba(90,50,60,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
})();
const contact = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
contact.rotation.x = -Math.PI / 2; contact.position.y = -4.2; scene.add(contact);

// ---------- звёздный кит ----------
const whale = new THREE.Group();
const wBody = mesh(new THREE.SphereGeometry(1, 32, 20), M.whale); wBody.scale.set(2.2, 0.85, 0.95); whale.add(wBody);
const belly = mesh(new THREE.SphereGeometry(1, 28, 16), M.whaleBelly); belly.scale.set(1.9, 0.55, 0.8); belly.position.set(0.1, -0.32, 0); whale.add(belly);
const tail = new THREE.Group();
[-1, 1].forEach((s) => { const f = mesh(new THREE.SphereGeometry(0.5, 16, 10), M.whale); f.scale.set(0.9, 0.12, 0.45); f.position.set(-0.35, 0, s * 0.42); f.rotation.y = s * 0.5; tail.add(f); });
tail.position.set(-2.3, 0.15, 0); whale.add(tail);
[-1, 1].forEach((s) => { const fin = mesh(new THREE.SphereGeometry(0.4, 14, 8), M.whale); fin.scale.set(0.9, 0.14, 0.4); fin.position.set(0.5, -0.4, s * 0.8); fin.rotation.x = s * 0.6; whale.add(fin); });
[-1, 1].forEach((s) => { const e = mesh(new THREE.SphereGeometry(0.09, 12, 8), M.white); e.position.set(1.55, 0.05, s * 0.55); whale.add(e); });
for (let i = 0; i < 16; i++) {
  const st = new THREE.Mesh(new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 8, 6), M.star);
  const u = Math.random() * 2.6 - 1.2, v = Math.random() * Math.PI;
  st.position.set(u, 0.55 * Math.sin(v) + 0.1, 0.9 * Math.cos(v) * 0.95);
  whale.add(st);
}
whale.scale.setScalar(0.8);
scene.add(whale);

// ---------- следующая планета (заглушка «Дуб, орех и мочало») ----------
const next = new THREE.Group();
const ball = mesh(new THREE.SphereGeometry(4, 48, 32), clay(0xf07d24, 0.7));
next.add(ball);
const seamMat = clay(0x2a1d14);
[0, Math.PI / 2].forEach((r) => { const t = mesh(new THREE.TorusGeometry(4.01, 0.06, 8, 96), seamMat); t.rotation.y = r; next.add(t); });
const eq = mesh(new THREE.TorusGeometry(4.01, 0.06, 8, 96), seamMat); eq.rotation.x = Math.PI / 2; next.add(eq);
const beads = new THREE.Group();
const beadCols = [0xe8b83a, 0xf49ac1, 0xf2d06b];
for (let i = 0; i < 48; i++) { const b = mesh(new THREE.SphereGeometry(0.22, 12, 10), clay(beadCols[i % 3], 0.4)); const a = (i / 48) * Math.PI * 2; b.position.set(Math.cos(a) * 6.2, 0, Math.sin(a) * 6.2); beads.add(b); }
beads.rotation.x = 0.35; next.add(beads);
next.position.set(26, 10, -40);
scene.add(next);

// ---------- камера по скроллу ----------
const keys = [
  // p, позиция камеры, точка взгляда
  [0.0, [14, 22, 30], [3, 0, 0]],
  [0.32, [9, 11, 15], [0, 0, 0]],
  [0.52, [3.2, 3.6, 6.4], [0.5, 0.2, -0.3]],
  [0.72, [6, 9, 2], [10, 5, -20]],
  [1.0, [20, 12, -22], [26, 10, -40]],
];
const v3 = (a) => new THREE.Vector3(...a);
const smooth = (t) => t * t * (3 - 2 * t);
function camAt(p) {
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1][0]) i++;
  const [p0, c0, l0] = keys[i], [p1, c1, l1] = keys[i + 1];
  const t = smooth(THREE.MathUtils.clamp((p - p0) / (p1 - p0), 0, 1));
  return [v3(c0).lerp(v3(c1), t), v3(l0).lerp(v3(l1), t)];
}

let target = 0, cur = 0;
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  target = max > 0 ? scrollY / max : 0;
}
addEventListener('scroll', onScroll, { passive: true });

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 48 : 32;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize(); onScroll();

// ---------- интерактив ----------
const verse = document.getElementById('verse');
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
function toggleLily(force) {
  heroTarget = typeof force === 'number' ? force : (heroTarget > 0.5 ? 0 : 1);
  const open = heroTarget > 0.5;
  verse.textContent = open ? '«Тебе кувшинок корабли / Закатных сказок привезли»' : '';
  verse.classList.toggle('on', open);
  document.getElementById('lilyBtn').setAttribute('aria-pressed', open);
}
function pick(e) {
  ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  return ray.intersectObjects([hero, heroPad], true).length > 0;
}
canvas.addEventListener('click', (e) => { if (pick(e)) toggleLily(); });
canvas.addEventListener('pointermove', (e) => { canvas.style.cursor = pick(e) ? 'pointer' : ''; });
document.getElementById('lilyBtn').addEventListener('click', () => toggleLily());

// ---------- цикл ----------
const clock = new THREE.Clock();
function tick() {
  const t = clock.getElapsedTime();
  cur += (target - cur) * (reduce ? 1 : 0.08);
  const p = reduce ? 0.52 : cur;
  const [cp, lp] = camAt(p);
  if (innerWidth < innerHeight) lp.y -= 2.2;
  camera.position.copy(cp); camera.lookAt(lp);

  if (p > 0.66 && heroTarget > 0.5) toggleLily(0);

  // вода
  if (!reduce) {
    const pos = waterGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = waterBase[i * 3], z = waterBase[i * 3 + 2];
      pos.array[i * 3 + 1] = Math.sin(x * 1.3 + t * 1.2) * 0.025 + Math.cos(z * 1.1 + t) * 0.025;
    }
    pos.needsUpdate = true; waterGeo.computeVertexNormals();
  }
  // цветок
  const o = hero.userData.open + (heroTarget - hero.userData.open) * 0.07;
  setLilyOpen(hero, o);
  hero.rotation.y = t * 0.08;
  // лягушонок дышит
  fBody.scale.y = 0.72 + Math.sin(t * 2.4) * 0.02;
  // светлячки
  flies.forEach((f) => { const d = f.userData; f.position.set(Math.cos(d.a + t * d.s) * d.r, d.h + Math.sin(t * 2 + d.a) * 0.15, Math.sin(d.a + t * d.s) * d.r); });
  // кит
  const wa = t * 0.12;
  whale.position.set(Math.cos(wa) * 11, 6 + Math.sin(t * 0.7) * 0.5, Math.sin(wa) * 11 - 2);
  whale.rotation.y = -wa - Math.PI / 2;
  tail.rotation.z = Math.sin(t * 1.6) * 0.25;
  // остров медленно вращается
  island.rotation.y = reduce ? 0 : t * 0.02;
  next.rotation.y = t * 0.1; beads.rotation.z = t * 0.05;
  clouds.forEach((c, i) => { c.position.x += Math.sin(t * 0.2 + i) * 0.002; });
  island.position.y = reduce ? 0 : Math.sin(t * 0.6) * 0.12;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
toggleLily(0);
tick();
