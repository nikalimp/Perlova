// @ts-nocheck — глиняные фигурки героев и таблички (spec v0.3, решение Ника 2026-10-29)
import { THREE, clay, mesh, sphere } from './core.js';

const cap = (r, l, m) => mesh(new THREE.CapsuleGeometry(r, l, 6, 12), m);
const M = { eye: clay(0x26201f, 0.4), white: clay(0xffffff, 0.5), cheek: clay(0xf4a6a6, 0.9), wing: new THREE.MeshPhysicalMaterial({ color: 0xdff4ff, roughness: 0.1, transmission: 0.6, transparent: true, opacity: 0.6, thickness: 0.05 }) };

// Фигурка-«чиби» из глины. Начало координат — у ног. Рост при scale = 1 — около 1,5.
// o: skin, hair, hair2 (пряди), eye, necklace, hat (соломка), hatBand, style ('pigtails' | 'bob' | 'short' | 'long' | 'bun' | 'wavy'), top, bottom, dress (true — юбка-конус), shoes,
//    wreath, crown, wings, ears (эльф), tail (русалка), wave (машет рукой), hop (подпрыгивает), scale
export function figure(o = {}) {
  const skin = clay(o.skin ?? 0xf6d2b8), hair = clay(o.hair ?? 0xe9c46a, 0.7), top = clay(o.top ?? 0xf07d24), bottom = clay(o.bottom ?? 0x2f56a6), shoes = clay(o.shoes ?? 0x5a3a2c);
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const legs = [];

  if (o.tail) {
    const t = mesh(new THREE.ConeGeometry(0.2, 0.7, 14), bottom); t.rotation.x = Math.PI; t.position.y = 0.35; body.add(t);
    const fin = sphere(0.18, bottom, 12, 8); fin.scale.set(1.4, 0.25, 0.7); fin.position.y = 0.04; body.add(fin);
  } else {
    [-0.1, 0.1].forEach((x) => {
      const leg = cap(0.07, 0.22, o.dress ? skin : bottom); leg.position.set(x, 0.2, 0); body.add(leg);
      const shoe = sphere(0.09, shoes, 12, 8); shoe.scale.set(1, 0.6, 1.4); shoe.position.set(x, 0.05, 0.04); body.add(shoe);
      legs.push(leg, shoe);
    });
  }
  const torso = o.dress
    ? mesh(new THREE.ConeGeometry(0.3, 0.62, 18), top)
    : cap(0.19, 0.24, top);
  torso.position.y = o.dress ? 0.62 : 0.6; body.add(torso);
  if (o.dress) { const ch = cap(0.15, 0.1, top); ch.position.y = 0.82; body.add(ch); }

  const arms = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.2, 0.82, 0);
    const a = cap(0.055, 0.26, top); a.position.y = -0.17; pivot.add(a);
    const h = sphere(0.065, skin, 10, 8); h.position.y = -0.34; pivot.add(h);
    pivot.rotation.z = s * 0.25; body.add(pivot); return pivot;
  });

  const head = new THREE.Group(); head.position.y = 1.18; body.add(head);
  const hd = sphere(0.3, skin, 28, 20); head.add(hd);
  const eyeM = o.eye ? clay(o.eye, 0.4) : M.eye;
  const eyes = [-0.1, 0.1].map((x) => { const e = sphere(0.035, eyeM, 10, 8); e.position.set(x, 0.02, 0.28); e.scale.y = 1.3; head.add(e); return e; });
  [-0.17, 0.17].forEach((x) => { const c = sphere(0.05, M.cheek, 10, 8); c.scale.set(1, 0.6, 0.4); c.position.set(x, -0.08, 0.25); head.add(c); });
  const mouth = mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 12, Math.PI), M.eye); mouth.rotation.z = Math.PI; mouth.position.set(0, -0.1, 0.29); head.add(mouth);

  // волосы
  const capH = sphere(0.32, hair, 24, 16); capH.scale.set(1, 0.9, 1); capH.position.set(0, 0.06, -0.04);
  head.add(capH);
  const fringe = sphere(0.2, hair, 16, 10); fringe.scale.set(1.3, 0.45, 0.6); fringe.position.set(0, 0.2, 0.18); head.add(fringe);
  const style = o.style ?? 'short';
  if (style === 'pigtails') [-1, 1].forEach((s) => { const p = sphere(0.12, hair, 14, 10); p.scale.set(0.8, 1.3, 0.8); p.position.set(s * 0.34, -0.08, -0.06); head.add(p); const tie = sphere(0.04, clay(o.tie ?? 0xe0522a), 8, 6); tie.position.set(s * 0.32, 0.06, -0.04); head.add(tie); });
  if (style === 'bob') { const b = sphere(0.34, hair, 20, 14); b.scale.set(1.05, 0.8, 1); b.position.set(0, -0.04, -0.08); head.add(b); }
  if (style === 'long') { const b = cap(0.26, 0.4, hair); b.scale.z = 0.5; b.position.set(0, -0.3, -0.16); head.add(b); }
  if (style === 'wavy') {
    // волнистые волосы одного цвета, чуть ниже ушей (автор, spec v0.8)
    for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {
      const a = -Math.PI * 0.72 + (i / 8) * Math.PI * 1.44 + (row % 2) * 0.09; // от затылка (a = 0) к вискам, лицо открыто
      const r = 0.3 + row * 0.025, c = sphere(0.1 - row * 0.01, hair, 12, 8);
      c.position.set(Math.sin(a) * r, -0.03 - row * 0.12, -Math.cos(a) * r * 0.9 - 0.02);
      c.scale.set(1, 1.2, 1); head.add(c);
    }
    const side = sphere(0.18, hair, 14, 10); side.scale.set(1.3, 0.5, 0.6); side.position.set(-0.08, 0.17, 0.2); side.rotation.z = 0.35; head.add(side);
  }
  if (o.hat) {
    // соломенная шляпа (spec v0.9): тулья — одна фигура вращения, без совпадающих поверхностей (иначе мерцает)
    const straw = clay(o.hat, 0.95), hat = new THREE.Group();
    const brim = mesh(new THREE.CylinderGeometry(0.58, 0.6, 0.04, 40), straw); brim.receiveShadow = false; hat.add(brim);
    const prof = [[0.31, 0], [0.295, 0.1], [0.28, 0.19], [0.255, 0.235], [0.19, 0.265], [0.1, 0.28], [0.001, 0.285]].map(([x, y]) => new THREE.Vector2(x, y));
    const crown = mesh(new THREE.LatheGeometry(prof, 32), straw); crown.receiveShadow = false; hat.add(crown);
    const band = mesh(new THREE.CylinderGeometry(0.33, 0.335, 0.06, 32, 1, true), clay(o.hatBand ?? 0x9b6b3c, 0.8)); band.position.y = 0.05; band.receiveShadow = false; hat.add(band);
    hat.position.set(0, 0.25, -0.02); hat.rotation.set(-0.12, 0, 0.08); head.add(hat);
  }
  if (o.necklace) {
    const chain = mesh(new THREE.TorusGeometry(0.13, 0.008, 6, 28), clay(o.necklace, 0.3, { metalness: 0.6 })); chain.rotation.x = Math.PI / 2 + 0.35; chain.position.set(0, 0.86, 0.03); body.add(chain);
    const drop = sphere(0.025, clay(o.necklace, 0.3, { metalness: 0.6 }), 8, 6); drop.scale.y = 1.4; drop.position.set(0, 0.79, 0.15); body.add(drop);
  }
  if (style === 'bun') { const b = sphere(0.13, hair, 14, 10); b.position.set(0, 0.34, -0.12); head.add(b); }
  if (o.wreath) { const w = new THREE.Group(); for (let i = 0; i < 10; i++) { const f = sphere(0.045, clay([0xffffff, 0xf6d35b, 0xb53389, 0x8fd3ff][i % 4], 0.6), 8, 6); const a = (i / 10) * Math.PI * 2; f.position.set(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3); w.add(f); } w.position.y = 0.2; w.rotation.x = -0.15; head.add(w); }
  if (o.crown) { const c = mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.1, 10, 1, true), clay(o.crown, 0.3, { metalness: 0.5, side: THREE.DoubleSide })); c.position.y = 0.33; head.add(c); }
  if (o.ears) [-1, 1].forEach((s) => { const e = mesh(new THREE.ConeGeometry(0.05, 0.18, 8), skin); e.position.set(s * 0.3, 0.06, 0); e.rotation.z = -s * 1.1; head.add(e); });
  let wings = null;
  if (o.wings) { wings = [-1, 1].map((s) => { const w = sphere(0.3, M.wing, 16, 10); w.scale.set(0.18, 0.9, 0.5); w.position.set(s * 0.18, 0.86, -0.2); w.rotation.z = s * 0.5; w.castShadow = false; body.add(w); return w; }); }
  if (o.prop) { const p = o.prop(); arms[1].add(p); }

  const anchor = new THREE.Object3D(); anchor.position.y = o.hat ? 1.95 : 1.62; body.add(anchor); // со шляпой — над полями, чтобы бабл не наезжал
  g.scale.setScalar(o.scale ?? 1);
  const seed = Math.random() * 10;
  g.userData.anchor = anchor;
  // поза: sit — сидит (ноги спрятаны за столом), write — пишет правой рукой, wave — машет
  g.userData.pose = { sit: false, write: false, wave: !!o.wave };
  g.userData.update = (t) => {
    const pose = g.userData.pose;
    legs.forEach((l) => { l.visible = !pose.sit; });
    body.position.y = pose.sit ? 0 : o.hop ? Math.max(0, Math.sin(t * 3 + seed)) * 0.12 : Math.sin(t * 2 + seed) * 0.015;
    const br = 1 + Math.sin(t * 2.4 + seed) * 0.03; torso.scale.set(br, 1, br); // дыхание
    const blink = (t + seed) % 3.6 < 0.12 ? 0.15 : 1.3; eyes.forEach((e) => { e.scale.y = blink; });
    head.rotation.y = Math.sin(t * 0.5 + seed) * 0.25;
    if (pose.write) { arms[1].rotation.set(-1.1 + Math.sin(t * 7) * 0.08, 0, 0.15 + Math.sin(t * 3.1) * 0.12); head.rotation.x = 0.3; }
    else if (pose.wave) { arms[1].rotation.set(0, 0, 2.5 + Math.sin(t * 6 + seed) * 0.35 * (Math.sin(t * 0.7 + seed) > 0.3 ? 1 : 0)); head.rotation.x = 0; }
    else { arms[1].rotation.set(0, 0, 0.25); head.rotation.x = 0; }
    if (wings) wings.forEach((w, i) => { w.rotation.y = (i ? 1 : -1) * (0.3 + Math.sin(t * 14) * 0.3); });
  };
  return g;
}

// Табличка в мире: столб и доска; HTML-табличка садится на якорь над доской
export function signPost(color = 0xf3e3cf, h = 1.6) {
  const g = new THREE.Group();
  const post = mesh(new THREE.CylinderGeometry(0.06, 0.08, h, 8), clay(0x8a6247)); post.position.y = h / 2; g.add(post);
  const knob = mesh(new THREE.SphereGeometry(0.13, 14, 10), clay(color)); knob.position.y = h; g.add(knob);
  const anchor = new THREE.Object3D(); anchor.position.y = h + 0.2; g.add(anchor);
  g.userData.anchor = anchor;
  return g;
}

// Стрекоза (у принцессы Ирис «стрекозы, как радуга»)
export function dragonfly(color) {
  const g = new THREE.Group();
  const b = cap(0.03, 0.3, clay(color, 0.4)); b.rotation.z = Math.PI / 2; g.add(b);
  [-1, 1].forEach((s) => { const w = sphere(0.14, M.wing, 10, 6); w.scale.set(0.35, 0.05, 1); w.position.set(0.05, 0.03, s * 0.14); g.add(w); });
  return g;
}
