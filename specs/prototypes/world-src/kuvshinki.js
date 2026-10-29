import { THREE, clay, glow, mesh, sphere, islandBase } from './core.js';

const M = {
  pad: clay(0x6fae47), padDark: clay(0x4f8a3a), petal: clay(0xf6c1a8, 0.7), petalIn: clay(0xfde6da, 0.7),
  core: clay(0xf2c46b, 0.6), coreDark: clay(0xe59f3a), frog: clay(0x7fbe4f), white: clay(0xffffff, 0.5), black: clay(0x26201f, 0.4),
  bark: clay(0x8a6247), stone: clay(0xc9bdb4), reed: clay(0x7a9a47), cattail: clay(0x6e4a32), star: glow(0xffd977),
  whale: clay(0x4a6db0, 0.6), whaleBelly: clay(0xdfe7f5, 0.7),
};

function padGeo(r) {
  const s = new THREE.Shape(), a = 0.32;
  s.moveTo(0, 0); s.lineTo(Math.cos(a) * r, Math.sin(a) * r); s.absarc(0, 0, r, a, Math.PI * 2 - a, false); s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.05, bevelSegments: 3, curveSegments: 40 });
  g.rotateX(-Math.PI / 2);
  return g;
}
function petalGeo(len, wid) { const g = new THREE.SphereGeometry(1, 24, 16); g.scale(wid, 0.14, len); g.translate(0, 0, len * 0.92); return g; }

export function makeLily(scale = 1) {
  const g = new THREE.Group(), outer = [], inner = [];
  const po = petalGeo(0.62, 0.24), pi = petalGeo(0.45, 0.2);
  for (let i = 0; i < 10; i++) { const pv = new THREE.Group(); pv.rotation.y = (i / 10) * Math.PI * 2; const p = mesh(po, M.petal); pv.add(p); g.add(pv); outer.push(p); }
  for (let i = 0; i < 8; i++) { const pv = new THREE.Group(); pv.rotation.y = (i / 8) * Math.PI * 2 + 0.3; const p = mesh(pi, M.petalIn); p.position.y = 0.06; pv.add(p); g.add(pv); inner.push(p); }
  const core = sphere(0.2, M.core); core.scale.y = 0.6; core.position.y = 0.1; g.add(core);
  for (let i = 0; i < 14; i++) { const s = sphere(0.035, M.coreDark, 8, 6); const a = (i / 14) * Math.PI * 2; s.position.set(Math.cos(a) * 0.17, 0.2, Math.sin(a) * 0.17); g.add(s); }
  g.scale.setScalar(scale);
  g.userData = { outer, inner, open: 1 };
  return g;
}
export function setLilyOpen(l, t) {
  l.userData.outer.forEach((p) => { p.rotation.x = -THREE.MathUtils.lerp(1.25, 0.18, t); });
  l.userData.inner.forEach((p) => { p.rotation.x = -THREE.MathUtils.lerp(1.4, 0.55, t); });
  l.userData.open = t;
}

export function buildKuvshinki() {
  const R = 6;
  const root = new THREE.Group();
  const island = islandBase({ R });
  root.add(island);

  const waterGeo = new THREE.CircleGeometry(R * 0.82, 96); waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, new THREE.MeshPhysicalMaterial({ color: 0x3fb8a6, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.25, sheen: 0.6, sheenColor: new THREE.Color(0xbff0e6) }));
  water.position.y = 0.12; water.receiveShadow = true; island.add(water);
  const waterBase = waterGeo.attributes.position.array.slice();

  [[-2.6, -1.6, 0.9, 0.3], [2.4, -2.4, 0.75, 2.2], [-1.0, 2.8, 1.0, 4.1], [3.0, 1.6, 0.85, 5.0], [-3.6, 1.0, 0.7, 1.4], [0.6, -3.6, 0.6, 3.1], [-3.4, -2.9, 0.55, 2.6], [1.4, 3.6, 0.6, 0.9]]
    .forEach(([x, z, r, rot], i) => { const p = mesh(padGeo(r), i % 2 ? M.pad : M.padDark); p.position.set(x, 0.16, z); p.rotation.y = rot; island.add(p); });
  [[-2.6, -1.6, 0.8], [3.0, 1.6, 0.7], [-1.0, 2.8, 0.75], [1.4, 3.6, 0.55]].forEach(([x, z, s]) => { const l = makeLily(s); l.position.set(x + 0.15, 0.24, z + 0.1); setLilyOpen(l, 0.9); island.add(l); });

  const heroPad = mesh(padGeo(1.5), M.padDark); heroPad.position.set(0.6, 0.17, -0.2); heroPad.rotation.y = 1.1; island.add(heroPad);
  const hero = makeLily(1.6); hero.position.set(0.55, 0.28, -0.25); island.add(hero); setLilyOpen(hero, 0);

  // лягушонок
  const frog = new THREE.Group();
  const fBody = sphere(0.42, M.frog, 24, 18); fBody.scale.set(1, 0.72, 0.9); fBody.position.y = 0.3; frog.add(fBody);
  [-0.18, 0.18].forEach((x) => {
    const e = sphere(0.15, M.frog); e.position.set(x, 0.62, 0.12); frog.add(e);
    const w = sphere(0.1, M.white); w.position.set(x, 0.66, 0.2); frog.add(w);
    const b = sphere(0.05, M.black); b.position.set(x, 0.67, 0.29); frog.add(b);
  });
  const smile = mesh(new THREE.TorusGeometry(0.13, 0.025, 8, 20, Math.PI), M.black); smile.rotation.z = Math.PI; smile.position.set(0, 0.38, 0.36); frog.add(smile);
  [-0.3, 0.3].forEach((x) => { const l = sphere(0.16, M.frog); l.scale.set(1.2, 0.5, 1.4); l.position.set(x, 0.12, -0.05); frog.add(l); });
  frog.scale.setScalar(1.35); frog.position.set(-2.55, 0.2, -1.5); frog.rotation.y = 0.9; island.add(frog);

  // ива
  const willow = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.22, 0.38, 2.6, 12), M.bark); trunk.position.y = 1.3; willow.add(trunk);
  for (let i = 0; i < 7; i++) { const c = mesh(new THREE.IcosahedronGeometry(0.85 + (i % 3) * 0.15, 1), clay(0x5f9a46)); const a = (i / 7) * Math.PI * 2; c.position.set(Math.cos(a) * 0.7, 2.9 + (i % 2) * 0.35, Math.sin(a) * 0.7); willow.add(c); }
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2, r = 1.2 + (i % 4) * 0.1, pts = [];
    for (let k = 0; k < 6; k++) pts.push(new THREE.Vector3(Math.cos(a) * (r + k * 0.06), 3.0 - k * 0.42, Math.sin(a) * (r + k * 0.06)));
    willow.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.05, 6), clay(0x6aa64c)));
  }
  willow.position.set(-4.3, 0.2, 2.6); island.add(willow);

  for (let i = 0; i < 14; i++) {
    const a = 0.2 + (i / 14) * 1.3, r = R * 0.86 + (i % 3) * 0.1, h = 0.9 + (i % 4) * 0.15;
    const st = mesh(new THREE.CylinderGeometry(0.03, 0.04, h, 6), M.reed); st.position.set(Math.cos(a) * r, 0.2 + h / 2, Math.sin(a) * r); island.add(st);
    if (i % 2 === 0) { const ct = mesh(new THREE.CapsuleGeometry(0.07, 0.28, 4, 8), M.cattail); ct.position.set(st.position.x, 0.25 + h, st.position.z); island.add(ct); }
  }
  for (let i = 0; i < 9; i++) { const a = 3.4 + (i / 9) * 1.6; const s = mesh(new THREE.IcosahedronGeometry(0.2 + (i % 3) * 0.08, 1), M.stone); s.position.set(Math.cos(a) * R * 0.88, 0.3, Math.sin(a) * R * 0.88); s.scale.y = 0.6; island.add(s); }

  const flies = [];
  for (let i = 0; i < 16; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), M.star); f.userData = { a: i * 0.4, r: 1 + (i % 5) * 0.8, h: 0.6 + (i % 4) * 0.4, s: 0.2 + (i % 3) * 0.12 }; island.add(f); flies.push(f); }

  // звёздный кит
  const whale = new THREE.Group();
  const wb = sphere(1, M.whale, 32, 20); wb.scale.set(2.2, 0.85, 0.95); whale.add(wb);
  const belly = sphere(1, M.whaleBelly, 28, 16); belly.scale.set(1.9, 0.55, 0.8); belly.position.set(0.1, -0.32, 0); whale.add(belly);
  const tail = new THREE.Group();
  [-1, 1].forEach((s) => { const f = sphere(0.5, M.whale, 16, 10); f.scale.set(0.9, 0.12, 0.45); f.position.set(-0.35, 0, s * 0.42); f.rotation.y = s * 0.5; tail.add(f); });
  tail.position.set(-2.3, 0.15, 0); whale.add(tail);
  [-1, 1].forEach((s) => { const e = sphere(0.09, M.white); e.position.set(1.55, 0.05, s * 0.55); whale.add(e); });
  for (let i = 0; i < 16; i++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.05 + (i % 3) * 0.025, 8, 6), M.star); const u = -1.2 + (i / 16) * 2.6, v = (i * 2.3) % Math.PI; st.position.set(u, 0.55 * Math.sin(v) + 0.1, 0.86 * Math.cos(v)); whale.add(st); }
  whale.scale.setScalar(0.8);
  root.add(whale);

  let target = 0;
  return {
    root, island, hit: [hero, heroPad],
    focus: new THREE.Vector3(0.5, 0.2, -0.3),
    toggle(force) { target = typeof force === 'number' ? force : (target > 0.5 ? 0 : 1); return target > 0.5; },
    get open() { return target > 0.5; },
    update(t, reduce) {
      if (!reduce) {
        const pos = waterGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) pos.array[i * 3 + 1] = Math.sin(waterBase[i * 3] * 1.3 + t * 1.2) * 0.025 + Math.cos(waterBase[i * 3 + 2] * 1.1 + t) * 0.025;
        pos.needsUpdate = true; waterGeo.computeVertexNormals();
      }
      setLilyOpen(hero, hero.userData.open + (target - hero.userData.open) * 0.07);
      hero.rotation.y = t * 0.08;
      fBody.scale.y = 0.72 + Math.sin(t * 2.4) * 0.02;
      flies.forEach((f) => { const d = f.userData; f.position.set(Math.cos(d.a + t * d.s) * d.r, d.h + Math.sin(t * 2 + d.a) * 0.15, Math.sin(d.a + t * d.s) * d.r); });
      const wa = t * 0.12;
      whale.position.set(Math.cos(wa) * 11, 6 + Math.sin(t * 0.7) * 0.5, Math.sin(wa) * 11 - 2);
      whale.rotation.y = -wa - Math.PI / 2; tail.rotation.z = Math.sin(t * 1.6) * 0.25;
    },
  };
}
