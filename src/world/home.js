// @ts-nocheck — остров «Дом автора» (spec v0.3, задача S2): стол, лампа, полка с книгами, почтовый ящик, доска отзывов, фонарь вопросов
import { THREE, clay, glow, mesh, sphere, islandBase, tree } from './core.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const rb = (w, h, d, r = 0.06) => new RoundedBoxGeometry(w, h, d, 3, r);
const SPINES = [0x3fb8a6, 0xf07d24, 0xb53389, 0x2f56a6, 0xf49ac1, 0x6f5aa8]; // шесть книг: цвета планет и двух повестей о Есении

export function buildHome() {
  const root = new THREE.Group();
  const island = islandBase({ R: 6, soil: 0xb98a64, band: 0x8e6448, cream: 0xf3e3cf, rim: 0x9cc77a, top: 0xb5d38f });
  root.add(island);
  const anchors = {};
  const anchor = (id, obj, y) => { const a = new THREE.Object3D(); a.position.y = y; obj.add(a); anchors[`home.${id}`] = a; };
  const put = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; island.add(o); return o; };

  // ковёр
  const rug = mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.04, 48), clay(0xf6c1cf)); put(rug, 0.2, 0.1, -0.4);
  const rug2 = mesh(new THREE.TorusGeometry(2.1, 0.05, 6, 48), clay(0xffffff)); rug2.rotation.x = Math.PI / 2; put(rug2, 0.2, 0.13, -0.4);

  // стол с лампой, тетрадью, пером, чашкой с кувшинкой и стопкой книг
  const desk = new THREE.Group();
  const top = mesh(rb(2.2, 0.12, 1.1), clay(0xb07a4e)); top.position.y = 0.95; desk.add(top);
  [[-1, -0.45], [1, -0.45], [-1, 0.45], [1, 0.45]].forEach(([x, z]) => { const l = mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.9, 8), clay(0x8a5a3c)); l.position.set(x, 0.45, z); desk.add(l); });
  const lampG = new THREE.Group(); lampG.position.set(-0.75, 1.0, -0.25); desk.add(lampG);
  const lbase = mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.05, 16), clay(0x2f56a6)); lampG.add(lbase);
  const larm = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), clay(0x2f56a6)); larm.position.y = 0.35; larm.rotation.z = -0.25; lampG.add(larm);
  const shade = mesh(new THREE.ConeGeometry(0.22, 0.24, 16, 1, true), clay(0xf6d35b, 0.6, { side: THREE.DoubleSide })); shade.position.set(0.16, 0.7, 0); shade.rotation.z = -0.6; lampG.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), glow(0xfff1c2, 3)); bulb.position.set(0.2, 0.64, 0); lampG.add(bulb);
  const lampLight = new THREE.PointLight(0xffd59a, 0, 7, 1.6); lampLight.position.set(0.25, 0.55, 0); lampG.add(lampLight);
  const note = mesh(rb(0.7, 0.03, 0.5, 0.01), clay(0xfffbf4)); note.position.set(0.15, 1.03, 0.05); note.rotation.y = 0.2; desk.add(note);
  for (let i = 0; i < 4; i++) { const ln = mesh(new THREE.BoxGeometry(0.5, 0.005, 0.015), clay(0xc9b7c4)); ln.position.set(0.15, 1.05, -0.1 + i * 0.09); ln.rotation.y = 0.2; desk.add(ln); }
  const quill = mesh(new THREE.ConeGeometry(0.05, 0.6, 8), clay(0xfffbf4)); quill.position.set(0.55, 1.2, 0.05); quill.rotation.z = -0.9; desk.add(quill);
  const cup = mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.2, 14), clay(0x3fb8a6)); cup.position.set(0.85, 1.11, -0.25); desk.add(cup);
  const lily = sphere(0.12, clay(0xf7d6dc), 12, 8); lily.scale.y = 0.6; lily.position.set(0.85, 1.26, -0.25); desk.add(lily);
  SPINES.slice(0, 4).forEach((c, i) => { const b = mesh(rb(0.5, 0.09, 0.36, 0.02), clay(c)); b.position.set(-0.3, 1.06 + i * 0.09, 0.3); b.rotation.y = (i % 2) * 0.2 - 0.1; desk.add(b); });
  const chair = new THREE.Group();
  const seat = mesh(rb(0.6, 0.1, 0.55), clay(0xe86f8a)); seat.position.y = 0.55; chair.add(seat);
  const back = mesh(rb(0.6, 0.7, 0.08), clay(0xe86f8a)); back.position.set(0, 0.95, -0.25); chair.add(back);
  [[-0.25, -0.22], [0.25, -0.22], [-0.25, 0.22], [0.25, 0.22]].forEach(([x, z]) => { const l = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6), clay(0x8a5a3c)); l.position.set(x, 0.27, z); chair.add(l); });
  chair.position.set(0, 0, -0.9); desk.add(chair);
  put(desk, 0.6, 0.1, -0.8, -0.2);
  anchor('about', desk, 1.9);

  // полка с книгами
  const shelf = new THREE.Group();
  const frameM = clay(0x9a6a45);
  [[-0.9, 1.2, 0.08, 2.4], [0.9, 1.2, 0.08, 2.4]].forEach(([x, y, w, h]) => { const s = mesh(rb(w, h, 0.5, 0.02), frameM); s.position.set(x, y, 0); shelf.add(s); });
  [0.1, 0.85, 1.6, 2.35].forEach((y) => { const b = mesh(rb(1.9, 0.07, 0.52, 0.02), frameM); b.position.set(0, y, 0); shelf.add(b); });
  const backP = mesh(new THREE.BoxGeometry(1.8, 2.3, 0.03), clay(0xf3e3cf)); backP.position.set(0, 1.2, -0.24); shelf.add(backP);
  for (let row = 0; row < 3; row++) {
    let x = -0.8;
    for (let i = 0; i < 9 && x < 0.75; i++) {
      const w = 0.12 + ((i + row) % 3) * 0.03, h = 0.5 + ((i * 7 + row) % 4) * 0.05;
      const c = row === 1 && i < 6 ? SPINES[i] : [0xe9dcc7, 0xc9b7c4, 0x9cc77a, 0xf6d35b][(i + row) % 4];
      const b = mesh(rb(w, h, 0.36, 0.015), clay(c)); b.position.set(x + w / 2, 0.14 + row * 0.75 + h / 2, 0.02); shelf.add(b); x += w + 0.02;
    }
  }
  put(shelf, -3.0, 0.1, -1.4, 0.55);
  anchor('books', shelf, 2.9);

  // почтовый ящик с флажком — «Написать автору»
  const mail = new THREE.Group();
  const mp = mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.1, 8), clay(0x8a6247)); mp.position.y = 0.55; mail.add(mp);
  const box = mesh(rb(0.36, 0.34, 0.6, 0.12), clay(0x2f56a6)); box.position.y = 1.25; mail.add(box);
  const flag = new THREE.Group(); flag.position.set(0.2, 1.2, 0.1); mail.add(flag);
  const fp = mesh(new THREE.BoxGeometry(0.02, 0.4, 0.02), clay(0xe0522a)); fp.position.y = 0.2; flag.add(fp);
  const ff = mesh(new THREE.BoxGeometry(0.02, 0.12, 0.18), clay(0xe0522a)); ff.position.set(0, 0.36, 0.09); flag.add(ff);
  put(mail, 3.3, 0.1, 1.7, -0.6);
  anchor('contacts', mail, 1.75);
  // бумажный самолётик кружит над ящиком
  const plane = new THREE.Group();
  [-1, 1].forEach((s) => { const w = mesh(new THREE.ConeGeometry(0.16, 0.5, 3), clay(0xfffbf4)); w.rotation.set(0, 0, -Math.PI / 2); w.scale.z = 0.15; w.position.z = s * 0.06; w.rotation.x = s * 0.4; plane.add(w); });
  island.add(plane);

  // доска отзывов на мольберте
  const board = new THREE.Group();
  [-0.4, 0.4].forEach((x) => { const l = mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.8, 6), clay(0x8a6247)); l.position.set(x, 0.85, 0); l.rotation.z = x * -0.15; board.add(l); });
  const pane = mesh(rb(1.2, 0.9, 0.06, 0.03), clay(0xcfe6c4)); pane.position.y = 1.3; board.add(pane);
  [[-0.3, 1.45, 0xfffbf4], [0.25, 1.4, 0xf8d8ea], [-0.05, 1.12, 0xfff1c2]].forEach(([x, y, c], i) => { const p = mesh(new THREE.BoxGeometry(0.42, 0.3, 0.01), clay(c)); p.position.set(x, y, 0.04); p.rotation.z = (i - 1) * 0.12; board.add(p); });
  put(board, -2.6, 0.1, 2.0, 0.6);
  anchor('reviews', board, 2.05);

  // фонарь вопросов
  const lantern = new THREE.Group();
  const lp = mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.0, 8), clay(0x34405e)); lp.position.y = 1; lantern.add(lp);
  const hook = mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 14, Math.PI), clay(0x34405e)); hook.position.set(0.22, 2.0, 0); lantern.add(hook);
  const lglass = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.32, 8), glow(0xffe7a8, 1.4)); lglass.position.set(0.44, 1.78, 0); lantern.add(lglass);
  const lcap = mesh(new THREE.ConeGeometry(0.2, 0.15, 8), clay(0x34405e)); lcap.position.set(0.44, 2.01, 0); lantern.add(lcap);
  put(lantern, 0.2, 0.1, 3.4, -0.3);
  anchor('faq', lantern, 2.4);

  // сад
  const cherry = tree(0xf4b6c8, 0x8a6247, 2.0, 0.9); put(cherry, 3.4, 0.1, -2.6);
  const bush = tree(0x7cbf55, 0x8a6247, 0.4, 0.7); put(bush, -4.2, 0.1, 0.6);
  const cols = [0xffffff, 0xf6d35b, 0xb53389, 0xf49ac1, 0x8fd3ff];
  for (let i = 0; i < 36; i++) { const a = i * 2.4, r = 3.2 + (i % 6) * 0.35; const f = sphere(0.06, clay(cols[i % 5], 0.6), 6, 5); f.position.set(Math.cos(a) * r, 0.16, Math.sin(a) * r); island.add(f); }

  return {
    root, island, anchors, hit: [],
    focus: new THREE.Vector3(0.2, 0.8, -0.4),
    desk: new THREE.Vector3(0.6, 1.1, -0.8),
    shelf: new THREE.Vector3(-3.0, 1.3, -1.4),
    update(t, reduce, night) {
      lampLight.intensity = 0.6 + night * 5;
      bulb.material.emissiveIntensity = 1 + night * 2.5;
      if (reduce) return;
      const a = t * 0.6; plane.position.set(3.3 + Math.cos(a) * 1.2, 2.3 + Math.sin(t * 1.3) * 0.2, 1.7 + Math.sin(a) * 1.2); plane.rotation.y = -a;
      flag.rotation.z = Math.sin(t * 2) * 0.15;
    },
  };
}
