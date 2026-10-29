// @ts-nocheck — модули мира перенесены из прототипа (specs/prototypes/world-src), типизация не нужна
import { THREE, clay, glow, mesh, sphere, islandBase, cone } from './core.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const rb = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 3, r);

// «Дуб, орех и мочало» — планета-мяч: школа, дом, ёлка в бумажных розах, баскетбол, Котя, голубой шарик
export function buildDub() {
  const root = new THREE.Group();
  const island = islandBase({ R: 6, soil: 0xe8803a, band: 0xc9611f, cream: 0xf6e7d2, rim: 0xa3c97a, top: 0xbfd99a, });
  root.add(island);

  // площадка с баскетбольным кольцом
  const court = mesh(rb(4.2, 0.12, 2.8, 0.05), clay(0xe5a86e)); court.position.set(1.6, 0.12, 1.4); island.add(court);
  const lineM = clay(0xfff6ea, 0.6);
  [[0, 1.3, 4, 0.06], [0, -1.3, 4, 0.06], [2, 0, 0.06, 2.6], [-2, 0, 0.06, 2.6], [0, 0, 0.06, 2.6]].forEach(([x, z, w, d]) => { const l = mesh(rb(w, 0.02, d, 0.01), lineM); l.position.set(1.6 + x, 0.19, 1.4 + z); island.add(l); });
  const centre = mesh(new THREE.TorusGeometry(0.5, 0.03, 6, 32), lineM); centre.rotation.x = Math.PI / 2; centre.position.set(1.6, 0.19, 1.4); island.add(centre);
  const hoop = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 10), clay(0x3b5f9e)); pole.position.y = 1.2; hoop.add(pole);
  const board = mesh(rb(0.9, 0.6, 0.06, 0.03), clay(0xffffff, 0.5)); board.position.set(0, 2.3, 0.12); hoop.add(board);
  const square = mesh(rb(0.36, 0.26, 0.02, 0.01), clay(0xe0522a)); square.position.set(0, 2.25, 0.16); hoop.add(square);
  const ring = mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 24), clay(0xe0522a, 0.5)); ring.rotation.x = Math.PI / 2; ring.position.set(0, 2.05, 0.42); hoop.add(ring);
  const net = mesh(new THREE.CylinderGeometry(0.22, 0.14, 0.3, 12, 1, true), clay(0xffffff, 0.9, { wireframe: true })); net.position.set(0, 1.88, 0.42); hoop.add(net);
  hoop.position.set(3.55, 0.12, 1.4); hoop.rotation.y = -Math.PI / 2; island.add(hoop);
  const ball = sphere(0.22, clay(0xf07d24, 0.6)); ball.position.set(1.2, 0.36, 1.8); island.add(ball);

  // дом: 9 этажей, окна
  const house = new THREE.Group();
  const hb = mesh(rb(1.8, 3.6, 1.4, 0.12), clay(0xf3d9c4)); hb.position.y = 1.8; house.add(hb);
  const roof = mesh(rb(1.9, 0.18, 1.5, 0.06), clay(0x2d4e9e)); roof.position.y = 3.65; house.add(roof);
  const winM = glow(0xffd98a, 0.35), winOff = clay(0x8fb0d9, 0.4);
  for (let f = 0; f < 9; f++) for (let c = 0; c < 3; c++) {
    const w = mesh(rb(0.3, 0.24, 0.04, 0.02), (f === 4 || f === 8) && c === 1 ? winM : winOff);
    w.position.set(-0.5 + c * 0.5, 0.4 + f * 0.37, 0.71); house.add(w);
  }
  house.position.set(-2.8, 0.1, -1.8); house.rotation.y = 0.5; island.add(house);

  // ёлка с бумажными розами и гирляндой
  const fir = cone(0x2f6b45, 3.4, 1); fir.position.set(-0.6, 0.1, -2.6); island.add(fir);
  const roses = [], lights = [];
  for (let i = 0; i < 46; i++) {
    const tier = i % 4, a = i * 2.39, r = 0.95 - tier * 0.2, y = 1.15 + tier * 0.65 + (i % 3) * 0.08;
    const rose = sphere(0.09, clay(0xffffff, 0.7), 10, 8); rose.position.set(Math.cos(a) * r, y, Math.sin(a) * r); rose.scale.setScalar(0); fir.add(rose); roses.push(rose);
  }
  const garCols = [0xff6b6b, 0xffd166, 0x6bd3ff, 0xb79be0, 0x7bd389];
  for (let i = 0; i < 36; i++) {
    const a = i * 0.7, y = 0.9 + i * 0.075, r = 1.05 - (y - 0.9) * 0.33;
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), glow(garCols[i % 5], 0.15)); l.position.set(Math.cos(a) * r, y, Math.sin(a) * r); fir.add(l); lights.push(l);
  }
  const topStar = mesh(new THREE.OctahedronGeometry(0.2), glow(0xe8b83a, 0.6)); topStar.position.y = 3.6; fir.add(topStar);

  // Котя — старый чихуахуа на подушке
  const kotya = new THREE.Group();
  const pillow = mesh(rb(0.9, 0.18, 0.7, 0.09), clay(0xb79be0)); pillow.position.y = 0.09; kotya.add(pillow);
  const kb = sphere(0.22, clay(0xd99a5b)); kb.scale.set(1.3, 0.8, 0.9); kb.position.y = 0.32; kotya.add(kb);
  const kh = sphere(0.17, clay(0xd99a5b)); kh.position.set(0.28, 0.45, 0); kotya.add(kh);
  [-1, 1].forEach((s) => { const e = mesh(new THREE.ConeGeometry(0.07, 0.2, 8), clay(0xe5ad74)); e.position.set(0.26, 0.64, s * 0.1); e.rotation.x = s * -0.5; kotya.add(e); });
  const nose = sphere(0.03, clay(0x26201f)); nose.position.set(0.44, 0.44, 0); kotya.add(nose);
  kotya.position.set(-1.4, 0.12, 1.6); kotya.rotation.y = -0.6; island.add(kotya);

  // голубой шарик
  const balloon = new THREE.Group();
  const bl = sphere(0.38, clay(0x6ea8e8, 0.35), 24, 18); bl.scale.y = 1.15; bl.position.y = 2.6; balloon.add(bl);
  const str = mesh(new THREE.CylinderGeometry(0.008, 0.008, 2.3, 4), clay(0xffffff)); str.position.y = 1.2; balloon.add(str);
  balloon.position.set(0.6, 0.1, -0.4); island.add(balloon);

  // «Дуб, орех или мочало?» — три предмета (интерактив P0)
  const acorn = new THREE.Group();
  const nut1 = sphere(0.24, clay(0xc98a4b, 0.6)); nut1.scale.y = 1.25; acorn.add(nut1);
  const cap = sphere(0.26, clay(0x7a5232)); cap.scale.y = 0.55; cap.position.y = 0.22; acorn.add(cap);
  const stem = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 6), clay(0x5a3a22)); stem.position.y = 0.4; acorn.add(stem);
  const walnut = sphere(0.28, clay(0xb8915f, 0.95), 10, 8); walnut.geometry = new THREE.IcosahedronGeometry(0.28, 2); walnut.scale.set(1, 0.9, 1.1);
  const sponge = mesh(rb(0.6, 0.32, 0.42, 0.1), clay(0xf2d06b, 0.98));
  const items = [['oak', acorn, -1.0], ['nut', walnut, 0.0], ['sponge', sponge, 1.0]];
  const plinthM = clay(0xfff6ea, 0.7);
  items.forEach(([id, o, dx]) => {
    const g = new THREE.Group();
    const pl = mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.16, 24), plinthM); pl.position.y = 0.08; g.add(pl);
    o.position.y = 0.42; g.add(o);
    g.position.set(1.4 + dx * 1.1, 0.12, -1.9 + dx * 0.25); g.userData.id = id; island.add(g);
    items.find((x) => x[1] === o).push(g);
  });

  // браслет-«морозянка» кольцом вокруг планеты
  const bracelet = new THREE.Group();
  const beadCols = [0xf2d06b, 0xf49ac1, 0xe8b83a];
  for (let i = 0; i < 64; i++) { const b = sphere(0.18, clay(beadCols[i % 3], 0.35), 12, 10); const a = (i / 64) * Math.PI * 2; b.position.set(Math.cos(a) * 8.2, 0, Math.sin(a) * 8.2); bracelet.add(b); }
  bracelet.rotation.set(0.32, 0, 0.12); bracelet.position.y = 0.8; root.add(bracelet);

  let spin = 0, spinT = 0;
  const reply = { oak: '«Вот тебе молочный суп!»', nut: '«Одевайся в рыбий мех!»', sponge: '«Начинаем всё сначала!»' };
  return {
    root, island,
    hit: items.map((x) => x[3]),
    focus: new THREE.Vector3(1.2, 0.6, -1.4),
    pick(obj) { while (obj && !obj.userData.id) obj = obj.parent; return obj ? obj.userData.id : null; },
    press(id) { if (id === 'sponge') spinT = spin + Math.PI * 2; return reply[id]; },
    anchorOf(id) { return items.find((x) => x[0] === id)[3]; },
    update(t, reduce, local) {
      // local: 0..1 — насколько камера у этой планеты; розы садятся на ёлку, гирлянда зажигается
      roses.forEach((r, i) => { const k = THREE.MathUtils.clamp(local * 1.6 - i / roses.length, 0, 1); r.scale.setScalar(k); });
      const on = local > 0.75 ? 1.8 : 0.15;
      lights.forEach((l, i) => { l.material.emissiveIntensity = on * (0.6 + 0.4 * Math.sin(t * 3 + i)); });
      spin += (spinT - spin) * 0.06; island.rotation.y = spin;
      bl.position.y = 2.6 + Math.sin(t * 1.3) * 0.12;
      bracelet.rotation.y = t * 0.08;
      kh.rotation.z = Math.sin(t * 0.8) * 0.1;
      items.forEach(([, , , g], i) => { g.children[1].rotation.y = t * 0.6 + i; });
    },
  };
}
