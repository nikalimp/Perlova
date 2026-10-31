// @ts-nocheck — «запекание» неподвижных предметов (spec v0.8, облегчение)
// Было: ~1500 отдельных 3D-объектов → сотни команд видеокарте на кадр и ещё столько же на тени.
// Стало: неподвижные предметы каждой планеты склеены в один объект на материал.
// Как узнаём «неподвижные»: прогоняем анимации мира вхолостую (simulate) и сравниваем положение, видимость и цвет.
// Подвижное, нажимаемое (P.*.hit), прозрачное и необычные материалы остаются отдельными.
// Оригиналы не удаляются: уходят на слой 1 — камера и тени их не рисуют, якоря подписей на них работают.
import { THREE, rimOnly, isClay } from './core.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// тот же шум, что в шейдере patchClay (core.js): неровность «вылепленных» форм вносим в вершины заранее
const h3 = (x, y, z) => { const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return v - Math.floor(v); };
function n3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let fx = x - ix, fy = y - iy, fz = z - iz; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const m = (a, b, t) => a + (b - a) * t;
  return m(m(m(h3(ix, iy, iz), h3(ix + 1, iy, iz), fx), m(h3(ix, iy + 1, iz), h3(ix + 1, iy + 1, iz), fx), fy),
    m(m(h3(ix, iy, iz + 1), h3(ix + 1, iy, iz + 1), fx), m(h3(ix, iy + 1, iz + 1), h3(ix + 1, iy + 1, iz + 1), fx), fy), fz);
}
function displace(g) {
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = (n3(x * 2.3, y * 2.3, z * 2.3) - 0.5) * 0.014 * Math.min(Math.hypot(x, y, z), 5);
    p.setXYZ(i, x + n.getX(i) * k, y + n.getY(i) * k, z + n.getZ(i) * k);
  }
}

const matKey = (m) => [m.uuid, m.color?.getHex(), m.emissive?.getHex(), m.emissiveIntensity, m.opacity, m.visible].join('|');

// roots — что запекаем (острова планет, фигурка автора); skip — нажимаемые предметы (меняются по клику)
export function bakeStatic(roots, skipRoots, simulate, runs = 4) {
  const nodes = [];
  roots.forEach((r) => r.traverse((o) => nodes.push(o)));
  const skip = new Set();
  skipRoots.forEach((h) => h.traverse((o) => skip.add(o)));

  // снимок: локальная матрица каждого узла, видимость, материал, вершины
  const snap = () => nodes.map((o) => { o.updateMatrix(); return [o.matrix.elements.map((v) => v.toFixed(4)).join(), o.visible, o.isMesh && !Array.isArray(o.material) ? matKey(o.material) : '', o.geometry?.attributes?.position?.version ?? ''].join('#'); });
  const base = snap();
  const dynamic = new Set();
  for (let i = 0; i < runs; i++) { simulate(i); snap().forEach((s, j) => { if (s !== base[j]) dynamic.add(nodes[j]); }); }
  simulate(-1); // вернуть исходное состояние
  roots.forEach((r) => r.updateWorldMatrix(true, true));

  const rootSet = new Set(roots);
  // «опора» склейки — ближайший подвижный предок (или корень): внутри него деталь неподвижна
  const anchorOf = (o) => { for (let x = o.parent; x; x = x.parent) if (dynamic.has(x) || rootSet.has(x)) return x; return null; };
  const visibleUp = (o) => { for (let x = o; x && !rootSet.has(x); x = x.parent) if (!x.visible) return false; return true; };
  const groups = new Map();
  nodes.forEach((o) => {
    if (!o.isMesh) return;
    const m = o.material, g = o.geometry;
    if (skip.has(o) || dynamic.has(o) || Array.isArray(m) || !m.isMeshStandardMaterial || m.isMeshPhysicalMaterial || m.transparent || m.wireframe) return;
    if (o.isInstancedMesh || o.isSkinnedMesh || !visibleUp(o) || g.morphAttributes?.position) return;
    if (!g.attributes.position || !g.attributes.normal || !g.attributes.uv) return;
    // по пути от детали к опоре все узлы должны быть неподвижны и видимы
    const A = anchorOf(o); if (!A) return;
    const key = A.uuid + m.uuid + o.castShadow + o.receiveShadow;
    if (!groups.has(key)) groups.set(key, { A, m, cast: o.castShadow, recv: o.receiveShadow, list: [] });
    groups.get(key).list.push(o);
  });

  const inv = new THREE.Matrix4(), rel = new THREE.Matrix4();
  let baked = 0, made = 0;
  groups.forEach(({ A, m, cast, recv, list }) => {
    if (list.length < 2) return;
    inv.copy(A.matrixWorld).invert();
    const geos = list.map((o) => {
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
      if (isClay(m)) displace(g);
      rel.multiplyMatrices(inv, o.matrixWorld); g.applyMatrix4(rel);
      return g;
    });
    const merged = mergeGeometries(geos, false); if (!merged) return;
    geos.forEach((g) => g.dispose());
    const mesh = new THREE.Mesh(merged, isClay(m) ? rimOnly(m) : m);
    mesh.castShadow = cast; mesh.receiveShadow = recv; mesh.name = 'baked';
    A.add(mesh);
    list.forEach((o) => o.layers.set(1)); baked += list.length; made++;
  });
  // что осталось отдельным — для детализации по расстоянию (main.js): мелочь издалека не рисуем
  const rest = []; const ws = new THREE.Vector3();
  nodes.forEach((o) => { if ((o.isMesh || o.isPoints) && o.layers.isEnabled(0) && !skip.has(o)) { o.geometry.computeBoundingSphere(); o.getWorldScale(ws); rest.push({ o, r: o.geometry.boundingSphere.radius * Math.max(ws.x, ws.y, ws.z) }); } });
  return { meshes: nodes.filter((o) => o.isMesh).length, baked, into: made, dynamicNodes: dynamic.size, rest };
}
