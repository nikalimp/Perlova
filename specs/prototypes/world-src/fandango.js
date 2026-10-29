import { THREE, clay, glow, mesh, sphere, islandBase, cone, tree } from './core.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const rb = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 3, r);

// Оттенки пантонного веера из книги (hex — подбор под названия)
export const SHADES = {
  well: { name: 'ослепительно синий с крапинками фанданго', color: 0x3850a0 },
  river: { name: 'турбулентный серый', color: 0x6f767e },
  milk: { name: 'розовый загар', color: 0xd19c97 },
  stone: { name: 'угольный', color: 0x4a4646 },
};

// «Цветные запахи лета и немного фанданго» — летняя деревня: зелёный домик, речка с понтоном, колодец Леденец, «древнее море», зарянка
export function buildFandango() {
  const root = new THREE.Group();
  const island = islandBase({ R: 6, soil: 0xc79a6a, band: 0x9a7048, cream: 0xf4e6c8, rim: 0x8cc35c, top: 0x9ccc68 });
  root.add(island);

  // речка через остров
  const river = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-5.6, 0.1, 2.4), new THREE.Vector3(-2, 0.1, 1.2), new THREE.Vector3(1, 0.1, 2.6), new THREE.Vector3(5.6, 0.1, 1.4)]);
  const pts = curve.getPoints(60), shape = [];
  const rg = new THREE.BufferGeometry(); const pos = [], idx = [];
  pts.forEach((p, i) => { const tng = curve.getTangent(i / 60); const n = new THREE.Vector3(-tng.z, 0, tng.x).multiplyScalar(0.75); pos.push(p.x + n.x, 0.14, p.z + n.z, p.x - n.x, 0.14, p.z - n.z); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setIndex(idx); rg.computeVertexNormals();
  const water = new THREE.Mesh(rg, new THREE.MeshPhysicalMaterial({ color: 0x5aa9c9, roughness: 0.2, clearcoat: 1, side: THREE.DoubleSide })); water.receiveShadow = true; river.add(water);
  // белые барашки
  for (let i = 0; i < 18; i++) { const p = curve.getPoint(i / 18); const f = sphere(0.08, clay(0xffffff, 0.6), 8, 6); f.position.set(p.x + (i % 3 - 1) * 0.25, 0.2, p.z); f.scale.y = 0.4; river.add(f); }
  river.userData.id = 'river'; island.add(river);

  // понтон
  const pontoon = new THREE.Group();
  for (let i = 0; i < 6; i++) { const pl = mesh(rb(0.24, 0.08, 1.4, 0.03), clay(0xb58758)); pl.position.set(i * 0.27, 0, 0); pontoon.add(pl); }
  pontoon.position.set(-2.4, 0.24, 1.1); pontoon.rotation.y = 0.3; island.add(pontoon);
  // половина моста с ржавой трубой
  const pier = mesh(rb(0.5, 0.9, 0.5, 0.06), clay(0xb9b4ad)); pier.position.set(2.6, 0.5, 2.2); island.add(pier);
  const deck = mesh(rb(1.6, 0.12, 0.8, 0.04), clay(0xa9a39b)); deck.position.set(2.0, 1.0, 2.2); island.add(deck);
  const pipe = mesh(new THREE.TorusGeometry(0.5, 0.09, 8, 20, Math.PI * 0.8), clay(0xa4532c, 0.9)); pipe.position.set(2.9, 1.0, 2.2); pipe.rotation.z = 0.6; island.add(pipe);

  // зелёный домик со шторкой в горошек
  const house = new THREE.Group();
  const walls = mesh(rb(1.6, 1.2, 1.3, 0.08), clay(0x7cc46a)); walls.position.y = 0.6; house.add(walls);
  const roofG = new THREE.ConeGeometry(1.3, 0.9, 4); roofG.rotateY(Math.PI / 4);
  const roof = mesh(roofG, clay(0xe86f8a)); roof.position.y = 1.65; roof.scale.set(1, 1, 0.85); house.add(roof);
  const door = mesh(rb(0.36, 0.62, 0.05, 0.04), clay(0xfff1de)); door.position.set(-0.4, 0.4, 0.66); house.add(door);
  const curtain = mesh(rb(0.48, 0.42, 0.04, 0.03), clay(0xf6a5c0)); curtain.position.set(0.35, 0.72, 0.66); house.add(curtain);
  for (let i = 0; i < 9; i++) { const d = sphere(0.035, clay(0xffffff, 0.5), 8, 6); d.position.set(0.21 + (i % 3) * 0.14, 0.6 + Math.floor(i / 3) * 0.12, 0.69); house.add(d); }
  const mat = mesh(rb(0.5, 0.03, 0.3, 0.01), clay(0xc84d6e)); mat.position.set(-0.4, 0.03, 0.85); house.add(mat);
  house.position.set(-2.2, 0.1, -2.3); house.rotation.y = 0.35; island.add(house);

  // колодец Леденец
  const well = new THREE.Group();
  const ringW = mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.6, 20, 1, true), clay(0xb7aea4)); ringW.position.y = 0.3; well.add(ringW);
  const wtop = mesh(new THREE.CircleGeometry(0.5, 20), clay(0x3850a0, 0.2)); wtop.rotation.x = -Math.PI / 2; wtop.position.y = 0.5; well.add(wtop);
  [-0.5, 0.5].forEach((x) => { const post = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 6), clay(0x8a6247)); post.position.set(x, 0.85, 0); well.add(post); });
  const wroof = mesh(rb(1.3, 0.08, 0.8, 0.03), clay(0x8a5a3c)); wroof.position.y = 1.45; wroof.rotation.z = 0.0; well.add(wroof);
  const ladle = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), clay(0x8a6247)); ladle.position.set(0.3, 0.75, 0.3); ladle.rotation.z = 0.8; well.add(ladle);
  well.position.set(2.4, 0.1, -2.2); well.userData.id = 'well'; island.add(well);

  // камень «древнее море» с окаменевшими кораллами
  const stone = new THREE.Group();
  const rock = mesh(new THREE.IcosahedronGeometry(0.75, 2), clay(0xa8a29a, 0.95)); rock.scale.set(1.3, 0.6, 1); rock.position.y = 0.3; stone.add(rock);
  for (let i = 0; i < 7; i++) { const tube = mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.25, 8, 1, true), clay(0xe6dccd)); tube.position.set(-0.4 + i * 0.13, 0.65, (i % 2) * 0.15 - 0.05); tube.rotation.z = (i - 3) * 0.08; stone.add(tube); }
  const moss = sphere(0.22, clay(0x6f8f3e, 0.98), 10, 8); moss.scale.y = 0.4; moss.position.set(0.5, 0.5, 0.2); stone.add(moss);
  stone.position.set(0.3, 0.1, -0.3); stone.userData.id = 'stone'; island.add(stone);

  // забор с кашпо и зарянкой Мандарином
  const fence = new THREE.Group();
  for (let i = 0; i < 7; i++) { const p = mesh(rb(0.12, 0.8, 0.08, 0.03), clay(0xe9dcc7)); p.position.set(i * 0.4, 0.4, 0); fence.add(p); }
  [0.25, 0.6].forEach((y) => { const r = mesh(rb(2.6, 0.08, 0.06, 0.02), clay(0xe9dcc7)); r.position.set(1.2, y, 0.06); fence.add(r); });
  const pot = mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.2, 12), clay(0xc8693c)); pot.position.set(2.0, 0.92, 0); fence.add(pot);
  const robin = new THREE.Group();
  const rbd = sphere(0.14, clay(0x8a6a4e)); rbd.scale.set(1.2, 1, 1); robin.add(rbd);
  const breast = sphere(0.11, clay(0xe8742a)); breast.position.set(0.08, -0.02, 0); robin.add(breast);
  const head = sphere(0.09, clay(0x8a6a4e)); head.position.set(0.13, 0.11, 0); robin.add(head);
  const beak = mesh(new THREE.ConeGeometry(0.025, 0.08, 6), clay(0x2a2420)); beak.rotation.z = -Math.PI / 2; beak.position.set(0.24, 0.11, 0); robin.add(beak);
  robin.position.set(0.8, 0.95, 0); fence.add(robin);
  fence.position.set(-1.0, 0.1, -4.2); island.add(fence);

  // кедр, кусты, цветы
  const cedar = cone(0x2f5e3c, 4.2, 1); cedar.position.set(-4.0, 0.1, -0.6); island.add(cedar);
  const bush = tree(0x7cbf55, 0x8a6247, 0.6, 0.8); bush.position.set(-0.4, 0.1, -3.6); island.add(bush);
  const flowerCols = [0xffffff, 0xf6d35b, 0xb53389, 0xf49ac1];
  for (let i = 0; i < 40; i++) { const a = i * 2.4, r = 2.5 + (i % 7) * 0.45; const f = sphere(0.06, clay(flowerCols[i % 4], 0.6), 6, 5); f.position.set(Math.cos(a) * r, 0.16, Math.sin(a) * r * 0.9 - 0.6); island.add(f); }

  // скамейка: железные кружки, лимонная свеча, кувшин парного молока
  const bench = new THREE.Group();
  const top = mesh(rb(1.3, 0.1, 0.5, 0.04), clay(0x9a6a45)); top.position.y = 0.45; bench.add(top);
  [-0.5, 0.5].forEach((x) => { const leg = mesh(rb(0.08, 0.45, 0.4, 0.02), clay(0x7a5236)); leg.position.set(x, 0.22, 0); bench.add(leg); });
  [-0.35, -0.15].forEach((x) => { const mug = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 12), clay(0xdfe4ea, 0.4, { metalness: 0.4 })); mug.position.set(x, 0.57, 0); bench.add(mug); });
  const candle = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10), clay(0xf6e27a)); candle.position.set(0.1, 0.58, 0); bench.add(candle);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), glow(0xffc24a, 2.5)); flame.position.set(0.1, 0.7, 0); flame.scale.y = 1.6; bench.add(flame);
  const jug = new THREE.Group();
  const jb = sphere(0.16, clay(0xfaf2ea, 0.5)); jb.scale.y = 1.2; jb.position.y = 0.66; jug.add(jb);
  const jn = mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.12, 10), clay(0xfaf2ea, 0.5)); jn.position.y = 0.86; jug.add(jn);
  jug.position.x = 0.42; jug.userData.id = 'milk'; bench.add(jug);
  bench.position.set(1.0, 0.1, -3.2); bench.rotation.y = -0.15; island.add(bench);

  // пантонный веер
  const fan = new THREE.Group();
  const fanCols = [0xb53389, 0xd19c97, 0x3850a0, 0xb8a472, 0xe8742a, 0x4e545b, 0x1c39bb, 0x7cc46a];
  const blades = fanCols.map((c, i) => { const b = mesh(rb(0.22, 1.5, 0.03, 0.04), clay(c, 0.6)); b.geometry.translate(0, 0.75, 0); b.position.z = i * 0.01; fan.add(b); return b; });
  const pin = sphere(0.06, clay(0xcfd3d8, 0.3, { metalness: 0.6 })); pin.position.z = 0.1; fan.add(pin);
  fan.position.set(3.2, 0.2, 0.2); fan.rotation.set(-0.3, -0.6, 0); island.add(fan);

  // цыплята
  const chicks = [];
  for (let i = 0; i < 4; i++) { const c = new THREE.Group(); const b = sphere(0.12, clay(0xf6dc6e, 0.9)); c.add(b); const h = sphere(0.08, clay(0xf6dc6e, 0.9)); h.position.set(0.08, 0.1, 0); c.add(h); c.position.set(-0.6 + i * 0.35, 0.22, -1.6 + (i % 2) * 0.3); island.add(c); chicks.push(c); }

  // аура «понюхать цветом»
  const aura = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
  aura.renderOrder = 2; island.add(aura);
  let auraT = 0, auraTarget = 0;
  const targets = { well, river, milk: jug, stone };

  let fanOpen = 0.15;
  return {
    root, island,
    hit: [well, river, stone, jug, ...blades],
    focus: new THREE.Vector3(0.4, 0.6, -0.8),
    pick(obj) { if (blades.includes(obj)) return 'fan'; while (obj && !obj.userData.id) obj = obj.parent; return obj ? obj.userData.id : null; },
    press(id) {
      if (id === 'fan') { fanOpen = fanOpen > 0.5 ? 0.15 : 1; return null; }
      const s = SHADES[id]; if (!s) return null;
      const o = targets[id]; const p = new THREE.Vector3(); o.getWorldPosition(p); island.worldToLocal(p);
      aura.position.copy(p); aura.position.y += 0.5; aura.material.color.setHex(s.color); auraTarget = 1; auraT = 0;
      return `Пахнет цветом «${s.name}»`;
    },
    anchorOf(id) { return id === 'fan' ? fan : targets[id]; },
    update(t) {
      blades.forEach((b, i) => { b.rotation.z = THREE.MathUtils.lerp(b.rotation.z, (i - 3.5) * 0.2 * fanOpen, 0.08); });
      auraT += 0.016; if (auraT > 2.2) auraTarget = 0;
      aura.material.opacity += ((auraTarget ? 0.32 : 0) - aura.material.opacity) * 0.08;
      aura.scale.setScalar(0.6 + aura.material.opacity * 4);
      robin.position.y = 0.95 + Math.abs(Math.sin(t * 3)) * 0.05; robin.rotation.y = Math.sin(t * 0.7) * 0.4;
      flame.scale.x = 1 + Math.sin(t * 9) * 0.15;
      chicks.forEach((c, i) => { c.position.x += Math.sin(t * 1.5 + i) * 0.003; c.rotation.y = Math.sin(t + i) * 0.8; });
    },
  };
}
