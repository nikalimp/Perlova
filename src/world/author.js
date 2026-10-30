// @ts-nocheck — фигурка автора-проводника на облачке (spec v0.4, задача A1)
// Летит по станциям маршрута, приземляется у каждой книги и говорит в бабле (.say в HTML главной).
// В конце садится за свой стол в Доме автора и пишет новую книгу.
import { THREE, clay, sphere } from './core.js';
import { figure } from './figures.js';

// Внешность — нейтральная, фото на сайте нет (decisions.md). ❓ Сверить с автором: причёска и цвет одежды (05-tasks, вопрос A1).
const LOOK = { style: 'bun', hair: 0x5a3a2c, top: 0x1f6f69, dress: true, shoes: 0x3a2a2c, scale: 0.95 };
const W = 0.035; // полуокно посадки на станции (в долях прогресса скролла)

function makeCloud() {
  const c = new THREE.Group();
  [[0, 0, 0, 0.55], [0.5, -0.05, 0.1, 0.42], [-0.5, -0.06, 0, 0.4], [0.15, 0.18, -0.1, 0.38], [-0.2, 0.14, 0.15, 0.32]]
    .forEach(([x, y, z, r]) => { const s = sphere(r, clay(0xfff7f2, 0.95), 18, 12); s.position.set(x, y, z); s.scale.y = 0.7; c.add(s); });
  return c;
}

// stations: [{ p, say, pos: () => Vector3, sit? }] — по возрастанию p
export function buildAuthor(scene, stations) {
  const root = new THREE.Group(); scene.add(root);
  const fig = figure(LOOK); root.add(fig);
  const cloud = makeCloud(); root.add(cloud);
  const tmp = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const smooth = (t) => t * t * (3 - 2 * t);
  let yaw = 0;

  function state(p) {
    let i = 0; while (i < stations.length - 2 && p > stations[i + 1].p) i++;
    const A = stations[i], B = stations[i + 1];
    if (p <= A.p + W) return { st: A, at: A };
    if (p >= B.p - W) return { st: B, at: B };
    const s = smooth((p - A.p - W) / (B.p - A.p - 2 * W));
    return { st: s < 0.5 ? A : B, land: 0, from: A, to: B, s };
  }

  return {
    root, fig, anchor: fig.userData.anchor,
    // p — прогресс маршрута; cam — позиция камеры; возвращает id реплики, которую сейчас показывать
    update(t, p, cam, reduce) {
      const S = state(p);
      let land = 0, sit = false;
      if (S.from) {
        a.copy(S.from.pos()); b.copy(S.to.pos());
        tmp.lerpVectors(a, b, S.s); tmp.y += Math.sin(Math.PI * S.s) * Math.min(12, a.distanceTo(b) * 0.25);
      } else {
        tmp.copy(S.at.pos()); sit = !!S.at.sit;
        // у края окна посадки облачко приподнимается — взлёт и посадка мягкие
        const d = Math.abs(p - S.at.p); land = 1 - smooth(THREE.MathUtils.clamp((d - W * 0.5) / (W * 0.5), 0, 1));
        if (!sit && S.at.hover) land = 0.4;
      }
      root.position.copy(tmp);
      if (!sit) root.position.y += (1 - land) * 0.6 + (reduce ? 0 : Math.sin(t * 1.6) * 0.06 * (1 - land * 0.7));

      // поворот: за столом — лицом к столу, иначе — к камере
      if (sit && S.at.seatQuat) { S.at.seatQuat(q); e.setFromQuaternion(q, 'YXZ'); yaw = e.y; }
      else { const ty = Math.atan2(cam.x - root.position.x, cam.z - root.position.z); yaw += Math.atan2(Math.sin(ty - yaw), Math.cos(ty - yaw)) * 0.12; }
      root.rotation.y = yaw;

      // облачко: в полёте — под ногами, на земле — рядом и ниже, за столом — паркуется в стороне
      const cx = sit ? 1.6 : land * 1.0, cy = sit ? 1.2 : -0.22 + land * 0.35;
      cloud.position.set(cx, cy, sit ? -0.4 : 0); cloud.scale.setScalar(1 - land * 0.25);
      fig.position.y = sit ? 0 : -0.02;

      const pose = fig.userData.pose;
      pose.sit = sit; pose.write = sit; pose.wave = !sit && (S.st.wave || land < 0.5);
      if (!reduce) fig.userData.update(t);
      // реплика видна, пока автор у станции (у «зависающих» станций — тоже, без посадки)
      return S.at && Math.abs(p - S.at.p) < W * 0.8 ? S.at.say : '';
    },
  };
}
