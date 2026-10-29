// @ts-nocheck — модули мира перенесены из прототипа (specs/prototypes/world-src), типизация не нужна
import { THREE, cloud, contactShadow } from './core.js';
import { buildKuvshinki } from './kuvshinki.js';
import { buildDub } from './dub.js';
import { buildFandango } from './fandango.js';
import { buildAsfodel } from './asfodel.js';

// Мир планет: запускается компонентом World (src/components/world.tsx). Возвращает функцию очистки.
export function startWorld(canvas) {
const reduce = false; // при prefers-reduced-motion мир не запускается вовсе — показывается статичная страница
const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf9dcd4, 70, 230);
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);

// ---------- свет ----------
const hemi = new THREE.HemisphereLight(0xffe6ef, 0x8a6a55, 1.15); scene.add(hemi);
// Лунный свет и звёзды — включаются ночью (рекомендация Д6)
const moonLight = new THREE.DirectionalLight(0xc9d4ff, 0); scene.add(moonLight, moonLight.target);
const starGeo = new THREE.BufferGeometry(); const starPos = [];
for (let i = 0; i < 900; i++) { const u = Math.random() * Math.PI * 2, v = Math.random() * 0.45 + 0.05, r = 260; starPos.push(55 + Math.cos(u) * Math.cos(v) * r, Math.sin(v) * r, -50 + Math.sin(u) * Math.cos(v) * r); }
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
scene.add(stars);
const sun = new THREE.DirectionalLight(0xfff0dd, 2.4);
sun.castShadow = true; sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 13, bottom: -9, near: 1, far: 70 });
sun.shadow.radius = 6; sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);
const rim = new THREE.DirectionalLight(0xffb7c8, 0.9); scene.add(rim, rim.target);

// ---------- планеты по маршруту ----------
const P = {
  kuv: buildKuvshinki(),
  dub: buildDub(),
  fan: buildFandango(),
  asf: buildAsfodel(scene),
};
const POS = { kuv: [0, 0, 0], dub: [34, 3, -30], fan: [68, -2, -62], asf: [104, 4, -96] };
Object.entries(P).forEach(([k, p]) => { p.root.position.set(...POS[k]); p.root.add(contactShadow(6)); scene.add(p.root); });
P.dub.root.rotation.y = -0.4; P.fan.root.rotation.y = -0.2; P.asf.root.rotation.y = -0.3;
const clouds = [
  cloud(scene, -11, 4, -6, 1.6), cloud(scene, 10, 2, 4, 1.2), cloud(scene, 18, -5, -24, 1.6), cloud(scene, 46, 0, -40, 1.4),
  cloud(scene, 56, 9, -50, 2.0), cloud(scene, 80, 4, -76, 1.5), cloud(scene, 90, -2, -84, 1.3),
];

// ---------- камера: ключи по прогрессу ----------
const at = (k, x, y, z) => new THREE.Vector3(...POS[k]).add(new THREE.Vector3(x, y, z));
const atL = (k, x, y, z) => { P[k].root.updateMatrixWorld(); return P[k].root.localToWorld(new THREE.Vector3(x, y, z)); };
const focus = (k) => P[k].focus.clone().applyEuler(P[k].root.rotation).add(new THREE.Vector3(...POS[k]));
const DIVE = { kuv: [2.7, 3.4, 6.7], dub: [4.2, 5.2, 9.5], fan: [3.4, 4.4, 8.2] };
const dive = (k) => focus(k).add(new THREE.Vector3(...DIVE[k]).applyEuler(P[k].root.rotation));
const KEYS = [
  [0.00, () => new THREE.Vector3(10, 34, 64), () => new THREE.Vector3(40, 0, -30)],
  [0.08, () => at('kuv', 9, 11, 15), () => at('kuv', 0, 0, 0)],
  [0.16, () => dive('kuv'), () => focus('kuv')],
  [0.27, () => at('kuv', 18, 14, -6), () => at('dub', 0, 0, 0)],
  [0.33, () => at('dub', 9, 11, 15), () => at('dub', 0, 0.5, 0)],
  [0.39, () => dive('dub'), () => focus('dub')],
  [0.49, () => at('dub', 18, 14, -6), () => at('fan', 0, 0, 0)],
  [0.55, () => at('fan', 9, 11, 15), () => at('fan', 0, 0, 0)],
  [0.61, () => dive('fan'), () => focus('fan')],
  [0.72, () => at('asf', 22, 16, 34), () => at('asf', 0, 5, 0)],
  [0.80, () => atL('asf', 7, 2.5, 13), () => atL('asf', 0, 4.5, 0)],
  [0.88, () => atL('asf', 7, 15, 10), () => atL('asf', 1.2, 10.2, -1.6)],
  [1.00, () => new THREE.Vector3(-6, 58, 92), () => new THREE.Vector3(56, 0, -50)],
];
const smooth = (t) => t * t * (3 - 2 * t);
function camAt(p) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
  const [p0, c0, l0] = KEYS[i], [p1, c1, l1] = KEYS[i + 1];
  const t = smooth(THREE.MathUtils.clamp((p - p0) / (p1 - p0), 0, 1));
  return [c0().lerp(c1(), t), l0().lerp(l1(), t)];
}
const active = (p) => (p < 0.27 ? 'kuv' : p < 0.49 ? 'dub' : p < 0.68 ? 'fan' : 'asf');

// ---------- день → ночь ----------
const SKY = [ // p, верх, низ, туман, hemi-небо, hemi-земля, солнце, интенсивность солнца
  [0.00, '#f6b3c3', '#fbeee2', '#f9dcd4', '#ffe6ef', '#8a6a55', '#fff0dd', 2.4],
  [0.33, '#b9dcf2', '#fdf3e3', '#e7eef2', '#f2f6ff', '#7a6a55', '#fff6e8', 2.6],
  [0.55, '#ffd59a', '#fff4dc', '#fbe8c8', '#fff3d6', '#8a6a45', '#ffe6b8', 2.6],
  [0.68, '#7a6aa8', '#f2a48a', '#b99aa8', '#e9c9e0', '#5a4a60', '#ffb88a', 1.6],
  [0.78, '#0e1433', '#2b2a55', '#1b1d3d', '#5a6aa8', '#1d1a2c', '#b9c8ff', 0.9],
  [1.00, '#0b1030', '#25244d', '#171936', '#4f5e9e', '#18162a', '#b9c8ff', 0.8],
];
const C = (h) => new THREE.Color(h);
function skyAt(p) {
  let i = 0; while (i < SKY.length - 2 && p > SKY[i + 1][0]) i++;
  const a = SKY[i], b = SKY[i + 1], t = THREE.MathUtils.clamp((p - a[0]) / (b[0] - a[0]), 0, 1);
  const mix = (k) => C(a[k]).lerp(C(b[k]), t);
  return { top: mix(1), bottom: mix(2), fog: mix(3), hs: mix(4), hg: mix(5), sun: mix(6), si: a[7] + (b[7] - a[7]) * t };
}
const root = document.documentElement;

// ---------- скролл → прогресс по якорям секций ----------
const sections = [...document.querySelectorAll('.world-sec[data-p]')];
let anchors = [];
function measure() {
  anchors = sections.map((s) => [Math.max(0, s.offsetTop + s.offsetHeight - innerHeight), +s.dataset.p]);
  anchors[0][0] = 0;
}
function progress() {
  const y = scrollY;
  if (y <= anchors[0][0]) return anchors[0][1];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [y0, p0] = anchors[i], [y1, p1] = anchors[i + 1];
    if (y <= y1) return p0 + (p1 - p0) * ((y - y0) / Math.max(1, y1 - y0));
  }
  return anchors[anchors.length - 1][1];
}
let target = 0, cur = 0;
const onScroll = () => { target = progress(); };
window.__snap = () => { target = progress(); cur = target; return target; };
addEventListener('scroll', onScroll, { passive: true });
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.fov = innerWidth < innerHeight ? 50 : 32; camera.updateProjectionMatrix();
  measure(); onScroll();
}
addEventListener('resize', resize);
const ro = new ResizeObserver(() => { measure(); onScroll(); }); ro.observe(document.body);

// ---------- интерактив ----------
const verse = document.getElementById('verse');
const bubble = document.getElementById('bubble');
let bubbleAnchor = null, bubbleUntil = 0;
function say(text, anchor) {
  if (!text) return;
  bubble.textContent = text; bubble.classList.add('on'); bubbleAnchor = anchor; bubbleUntil = performance.now() + 2600;
}
function lily(force) {
  const open = P.kuv.toggle(force);
  const line = open ? '«Тебе кувшинок корабли / Закатных сказок привезли»' : '';
  verse.textContent = line; verse.classList.toggle('on', open);
  const inline = document.getElementById('verseInline'); if (inline) inline.textContent = line; // телефон: строка в карточке
  document.getElementById('lilyBtn')?.setAttribute('aria-pressed', String(open));
}
const onClick = (e) => {
  const t = e.target.closest('[data-dub],[data-smell],#lilyBtn,#skip16'); if (!t) return;
  if (t.id === 'lilyBtn') lily();
  else if (t.id === 'skip16') { e.preventDefault(); document.getElementById('shelf').scrollIntoView({ behavior: 'smooth' }); }
  else if (t.dataset.dub) say(P.dub.press(t.dataset.dub), P.dub.anchorOf(t.dataset.dub));
  else if (t.dataset.smell) say(P.fan.press(t.dataset.smell), P.fan.anchorOf(t.dataset.smell));
};
document.addEventListener('click', onClick);

const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
function hitTest(e) {
  ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  for (const k of ['kuv', 'dub', 'fan']) {
    const h = ray.intersectObjects(P[k].hit, true)[0];
    if (h) return [k, h.object];
  }
  return null;
}
canvas.addEventListener('click', (e) => {
  const h = hitTest(e); if (!h) return;
  const [k, obj] = h;
  if (k === 'kuv') lily();
  else { const id = P[k].pick(obj); if (id) say(P[k].press(id), P[k].anchorOf(id)); }
});
canvas.addEventListener('pointermove', (e) => { canvas.style.cursor = hitTest(e) ? 'pointer' : ''; });

// ---------- цикл ----------
const counter = document.getElementById('steps');
const clock = new THREE.Clock();
const v = new THREE.Vector3();
function local(p, a, b) { return THREE.MathUtils.clamp((p - a) / (b - a), 0, 1); }
resize();
function tick() {
  const t = clock.getElapsedTime();
  cur += (target - cur) * (reduce ? 1 : 0.07);
  const p = cur;
  const [cp, lp] = camAt(p);
  if (innerWidth < innerHeight) lp.y -= 2.2;
  camera.position.copy(cp); camera.lookAt(lp);

  // небо и свет
  const s = skyAt(p);
  root.style.setProperty('--sky-top', '#' + s.top.getHexString());
  root.style.setProperty('--sky-bottom', '#' + s.bottom.getHexString());
  // за полкой мир гаснет: дальше обычная страница
  ready = Math.min(1, ready + 0.03); // плавное появление сцены (Д7)
  const fadeOut = 1 - Math.min(1, Math.max(0, (scrollY - anchors[anchors.length - 1][0]) / innerHeight));
  canvas.style.opacity = String(ready * fadeOut);
  const night = Math.min(1, Math.max(0, (p - 0.68) / 0.12));
  moonLight.intensity = night * 1.3; hemi.intensity = 1.15 + night * 0.55; stars.material.opacity = night * 0.9;
  // активная точка маршрута (Д3)
  const railId = p < 0.27 ? 'planet-kuv' : p < 0.49 ? 'planet-dub' : p < 0.66 ? 'planet-fan' : p < 0.95 ? 'planet-asf' : 'shelf';
  if (railId !== lastRail) { lastRail = railId; document.querySelectorAll('[data-rail]').forEach((a) => a.toggleAttribute('aria-current', false)); document.querySelector(`[data-rail="${railId}"]`)?.setAttribute('aria-current', 'step'); }
  scene.fog.color.copy(s.fog);
  hemi.color.copy(s.hs); hemi.groundColor.copy(s.hg);
  sun.color.copy(s.sun); sun.intensity = s.si;
  root.classList.toggle('night', p > 0.7);

  // солнце следует за активной планетой — тени всегда рядом
  const k = active(p);
  v.set(...POS[k]);
  sun.target.position.copy(v); sun.position.copy(v).add(new THREE.Vector3(-8, 18, 10));
  rim.target.position.copy(v); rim.position.copy(v).add(new THREE.Vector3(10, 6, -10));
  moonLight.target.position.copy(v); moonLight.position.copy(v).add(new THREE.Vector3(-20, 30, 15));

  if (p > 0.22 && P.kuv.open) lily(0);
  P.kuv.update(t, reduce);
  P.dub.update(t, reduce, local(p, 0.3, 0.39));
  P.fan.update(t, reduce);
  const stairs = local(p, 0.74, 0.88);
  P.asf.update(t, reduce, stairs);
  if (counter) counter.textContent = String(P.asf.stepsLit.v);

  Object.values(P).forEach((pl, i) => { pl.island.position.y = reduce ? 0 : Math.sin(t * 0.6 + i) * 0.12; });
  clouds.forEach((c, i) => { c.position.x += Math.sin(t * 0.2 + i) * 0.002; });

  // пузырь-подпись над предметом
  if (bubbleAnchor) {
    bubbleAnchor.getWorldPosition(v); v.y += 1.1; v.project(camera);
    bubble.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px, ${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, -100%)`;
    if (performance.now() > bubbleUntil) { bubble.classList.remove('on'); bubbleAnchor = null; }
  }

  if (ready * fadeOut > 0) renderer.render(scene, camera);
  raf = document.hidden ? 0 : requestAnimationFrame(tick); // вкладка скрыта — цикл стоит (В6)
}
let raf = 0, ready = 0, lastRail = '';
const onVis = () => { if (!document.hidden && !raf) raf = requestAnimationFrame(tick); };
document.addEventListener('visibilitychange', onVis);
lily(0);
tick();
return () => {
  cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVis);
  removeEventListener('scroll', onScroll); removeEventListener('resize', resize); ro.disconnect();
  document.removeEventListener('click', onClick);
  root.classList.remove('night');
  renderer.dispose();
};
}
