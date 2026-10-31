// @ts-nocheck — герои и детали планет поверх сцен из прототипа (spec v0.3, задача S1)
// Каждый якорь (anchor) — точка, над которой main.js держит HTML-табличку с тем же data-anchor.
import { THREE, clay, glow, mesh, sphere, tree } from './core.js';
import { figure, dragonfly } from './figures.js';

const BLONDE = 0xf0d27a; // Яся одинакова в двух повестях: светлые хвостики (decisions.md), во второй повести старше и с венком

function place(parent, obj, x, y, z, ry = 0) { obj.position.set(x, y, z); obj.rotation.y = ry; parent.add(obj); return obj; }

export function addHeroes(P) {
  const anchors = {}, figs = [], movers = [];
  const hero = (k, i, fig, parent, x, y, z, ry) => { place(parent ?? P[k].island, fig, x, y, z, ry); figs.push(fig); anchors[`${k}.hero.${i}`] = fig.userData.anchor; return fig; };
  // таблички книг на планетах убраны (spec v0.6): описание книг — на полке в Доме автора
  const tag = (k, i, obj, y = 0.9) => { const a = new THREE.Object3D(); a.position.y = y; obj.add(a); anchors[`${k}.hero.${i}`] = a; };

  // ---------- Кувшинки: принцесса Ирис, русалочка и ветер-эльф, звёздный кит ----------
  {
    const isl = P.kuv.island;
    const iris = hero('kuv', 0, figure({ style: 'long', hair: 0x3f8f7a, top: 0xb79be0, dress: true, wings: true, crown: 0xe8b83a, scale: 0.6 }), null, 2.4, 0.22, -2.4, -0.6);
    const flies = [0xff6b6b, 0xffd166, 0x7bd389, 0x6bd3ff, 0xb79be0].map((c, i) => { const d = dragonfly(c); isl.add(d); return { d, a: i * 1.26 }; });
    movers.push((t) => flies.forEach(({ d, a }) => { const u = a + t * 0.9; d.position.set(2.4 + Math.cos(u) * 0.8, 1.3 + Math.sin(t * 3 + a) * 0.15, -2.4 + Math.sin(u) * 0.8); d.rotation.y = -u; }));
    // ракушка-лодка
    const boat = new THREE.Group();
    const shell = sphere(0.55, clay(0xf7c9c2, 0.5), 24, 12); shell.scale.set(1.2, 0.45, 0.8); boat.add(shell);
    for (let i = 0; i < 5; i++) { const r = mesh(new THREE.TorusGeometry(0.5, 0.025, 6, 20, Math.PI), clay(0xe8a79c)); r.rotation.set(0, (i - 2) * 0.25, 0); r.scale.set(1.2, 0.5, 1); boat.add(r); }
    const mermaid = figure({ tail: true, style: 'long', hair: 0xe8742a, top: 0xf49ac1, bottom: 0x3fb8a6, scale: 0.42 }); place(boat, mermaid, -0.22, 0.05, 0); figs.push(mermaid);
    const elf = figure({ ears: true, style: 'short', hair: 0xf3f6fa, top: 0x8fd3ff, bottom: 0x8fd3ff, scale: 0.38, wave: true }); place(boat, elf, 0.25, 0.05, 0, 0.4); figs.push(elf);
    isl.add(boat); anchors['kuv.hero.1'] = mermaid.userData.anchor;
    movers.push((t) => { const a = 1.9 + Math.sin(t * 0.15) * 0.7; boat.position.set(Math.cos(a) * 4.1, 0.2 + Math.sin(t * 1.5) * 0.03, Math.sin(a) * 4.1); boat.rotation.y = -a; });
    // кит уже плавает по небу — табличка над ним
    tag('kuv', 2, P.kuv.whale, 1.2);
    // мельница на пригорке (из «Мира книги»)
    const mill = new THREE.Group();
    const hill = sphere(1.0, clay(0x86b85a), 20, 12); hill.scale.y = 0.4; mill.add(hill);
    const tw = mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.4, 12), clay(0xf3e3cf)); tw.position.y = 0.9; mill.add(tw);
    const rf = mesh(new THREE.ConeGeometry(0.42, 0.5, 12), clay(0xe86f8a)); rf.position.y = 1.85; mill.add(rf);
    const blades = new THREE.Group(); blades.position.set(0, 1.45, 0.4);
    for (let i = 0; i < 4; i++) { const b = mesh(new THREE.BoxGeometry(0.12, 0.9, 0.03), clay(0xfff6ea)); b.geometry.translate(0, 0.45, 0); b.rotation.z = (i * Math.PI) / 2; blades.add(b); }
    mill.add(blades); place(isl, mill, 3.7, 0.1, -3.6, -0.7);
    movers.push((t) => { blades.rotation.z = t * 0.8; });
    // остров потерянных носков — парит рядом
    const socks = new THREE.Group();
    const rock = sphere(1.1, clay(0xb98a64), 16, 10); rock.scale.y = 0.45; socks.add(rock);
    const grass = mesh(new THREE.CircleGeometry(1.05, 24), clay(0x86b85a)); grass.rotation.x = -Math.PI / 2; grass.position.y = 0.46; socks.add(grass);
    [[0xf07d24, -0.4], [0x3fb8a6, 0.1], [0xb53389, 0.5]].forEach(([c, x], i) => {
      const s = new THREE.Group(); const leg = mesh(new THREE.CapsuleGeometry(0.09, 0.3, 4, 8), clay(c)); leg.position.y = 0.2; s.add(leg);
      const foot = mesh(new THREE.CapsuleGeometry(0.09, 0.16, 4, 8), clay(c)); foot.rotation.z = Math.PI / 2; foot.position.set(0.1, 0.02, 0); s.add(foot);
      const stripe = mesh(new THREE.TorusGeometry(0.095, 0.02, 6, 14), clay(0xffffff)); stripe.rotation.x = Math.PI / 2; stripe.position.y = 0.36; s.add(stripe);
      place(socks, s, x, 0.55, (i - 1) * 0.25, i);
    });
    place(P.kuv.root, socks, -8.5, 3.2, -3.5);
    movers.push((t) => { socks.position.y = 3.2 + Math.sin(t * 0.8) * 0.25; socks.rotation.y = t * 0.1; });
  }

  // ---------- Дуб, орех и мочало: Яся (7 лет), Котя, Соня и Стеша, Рома ----------
  {
    const isl = P.dub.island;
    hero('dub', 0, figure({ style: 'pigtails', hair: BLONDE, top: 0xf07d24, bottom: 0x2f56a6, wave: true, scale: 0.62 }), null, 0.5, 0.18, 2.1, 0.2);
    tag('dub', 1, P.dub.kotya, 0.85);
    const sonya = hero('dub', 2, figure({ style: 'bob', hair: 0x3a2a22, top: 0xf49ac1, dress: true, scale: 0.6 }), null, -1.3, 0.1, 0.1, 0.5);
    figs.push(place(isl, figure({ style: 'long', hair: 0xb0552e, top: 0x7bd389, dress: true, scale: 0.6, wave: true }), -0.7, 0.1, 0.45, -0.2));
    hero('dub', 3, figure({ style: 'short', hair: 0x5a3a2c, top: 0x3b5f9e, bottom: 0x34405e, hop: true, scale: 0.66 }), null, 2.5, 0.18, 0.9, -1.2);
    // двор: фонарь, кусты, скамейка, качели
    const lamp = new THREE.Group();
    const lp = mesh(new THREE.CylinderGeometry(0.05, 0.07, 2, 8), clay(0x34405e)); lp.position.y = 1; lamp.add(lp);
    const lb = sphere(0.18, glow(0xffe7a8, 0.8)); lb.position.y = 2.05; lamp.add(lb);
    lamp.userData.dust = { y: 2.05 };
    place(isl, lamp, -2.2, 0.1, 1.2);
    [[-4.2, 0.4], [-3.4, -3.6], [3.8, -2.2], [-0.2, 4.2]].forEach(([x, z]) => place(isl, tree(0x7cbf55, 0x8a6247, 0.5, 0.7), x, 0.1, z));
    const swing = new THREE.Group();
    [-0.5, 0.5].forEach((x) => { const p = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), clay(0xe0522a)); p.position.set(x, 0.8, 0); swing.add(p); });
    const bar = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), clay(0xe0522a)); bar.rotation.z = Math.PI / 2; bar.position.y = 1.6; swing.add(bar);
    const seat = new THREE.Group(); seat.position.y = 1.6; swing.add(seat);
    [-0.18, 0.18].forEach((x) => { const r = mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.1, 4), clay(0xdddddd)); r.position.set(x, -0.55, 0); seat.add(r); });
    const sb = mesh(new THREE.BoxGeometry(0.46, 0.05, 0.22), clay(0xf6d35b)); sb.position.y = -1.1; seat.add(sb);
    place(isl, swing, 3.3, 0.1, -0.9, 0.6);
    movers.push((t) => { seat.rotation.x = Math.sin(t * 1.6) * 0.35; });
    void sonya;
  }

  // ---------- Цветные запахи лета: Яся (9 лет), Эрик, Маша, зарянка Мандарин ----------
  {
    const isl = P.fan.island;
    hero('fan', 0, figure({ style: 'pigtails', hair: BLONDE, wreath: true, top: 0xf6d35b, dress: true, wave: true, scale: 0.72 }), null, 2.2, 0.1, -0.2, -0.3);
    const book = () => { const b = mesh(new THREE.BoxGeometry(0.22, 0.03, 0.3), clay(0xb53389)); b.position.set(0, -0.36, 0.08); return b; };
    hero('fan', 1, figure({ style: 'short', hair: 0x6b4a32, top: 0x5aa06a, bottom: 0x4e545b, scale: 0.74, prop: book }), null, 1.5, 0.1, -1.0, 0.4);
    hero('fan', 2, figure({ style: 'long', hair: 0x2a2020, top: 0xe0522a, bottom: 0x2f56a6, scale: 0.72 }), null, -1.9, 0.1, -0.6, 0.6);
    tag('fan', 3, P.fan.robin, 0.35);
    // подсолнухи и грядки
    [[-3.2, -1.8], [-3.6, -1.2], [-2.9, -1.0]].forEach(([x, z], i) => {
      const s = new THREE.Group(); const st = mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.3 + i * 0.15, 6), clay(0x5a8a3a)); st.position.y = 0.65; s.add(st);
      const h = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 16), clay(0xf6c33b)); h.rotation.x = 1.2; h.position.set(0, 1.35 + i * 0.15, 0.06); s.add(h);
      const c = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 14), clay(0x6b4a32)); c.rotation.x = 1.2; c.position.set(0, 1.35 + i * 0.15, 0.09); s.add(c);
      place(isl, s, x, 0.1, z, 0.5);
    });
    for (let r = 0; r < 2; r++) { const bed = mesh(new THREE.BoxGeometry(1.6, 0.16, 0.42), clay(0x7a5236)); place(isl, bed, 3.0, 0.15, -3.0 + r * 0.6, 0.4); for (let i = 0; i < 4; i++) { const cb = sphere(0.13, clay(0x7cbf55), 10, 8); cb.position.set(-0.6 + i * 0.4, 0.15, 0); bed.add(cb); } }
    // верёвка с бельём и прищепками
    const line = new THREE.Group();
    [-1, 1].forEach((s) => { const p = mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.4, 6), clay(0x8a6247)); p.position.set(s * 1, 0.7, 0); line.add(p); });
    const rope = mesh(new THREE.CylinderGeometry(0.008, 0.008, 2, 4), clay(0xffffff)); rope.rotation.z = Math.PI / 2; rope.position.y = 1.3; line.add(rope);
    [0xf49ac1, 0x8fd3ff, 0xffffff].forEach((c, i) => { const cl = mesh(new THREE.BoxGeometry(0.36, 0.42, 0.02), clay(c)); cl.position.set(-0.6 + i * 0.6, 1.08, 0); line.add(cl); });
    place(isl, line, -3.0, 0.1, 0.0, 1.2);
  }

  // ---------- Асфодель: Мика, Элли, Лазурина ----------
  {
    const isl = P.asf.island;
    hero('asf', 0, figure({ style: 'short', hair: 0x2a2020, top: 0x6f767e, bottom: 0x34405e, scale: 0.86 }), null, 1.5, 0.1, 2.9, -0.4);
    hero('asf', 1, figure({ style: 'long', hair: 0xc89a5a, top: 0x2f56a6, dress: true, wave: true, scale: 0.8 }), null, 0.8, 0.1, 2.6, 0.2);
    hero('asf', 2, figure({ style: 'long', hair: 0xffffff, top: 0xf3f6fa, dress: true, crown: 0xc3ccd6, scale: 0.7 }), P.asf.city, -1.6, 0, 2.0, 0.4); // впереди башен: при подъёме её видно (замечание дизайнера)
  }

  return {
    anchors,
    update(t, reduce) { if (reduce) return; figs.forEach((f) => f.userData.update(t)); movers.forEach((m) => m(t)); },
  };
}
