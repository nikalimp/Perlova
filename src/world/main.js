// @ts-nocheck — мир-пространство на весь сайт (spec v0.3). Запускается компонентом World в layout и живёт между страницами.
import { THREE, cloud, smoothen } from './core.js';
import { buildKuvshinki } from './kuvshinki.js';
import { buildDub } from './dub.js';
import { buildFandango } from './fandango.js';
import { buildAsfodel } from './asfodel.js';
import { buildHome } from './home.js';
import { addHeroes } from './heroes.js';
import { buildAuthor } from './author.js';
import { createPainter } from './paint.js';
import { addLife } from './life.js';
import { bakeStatic } from './bake.js';
import { addSpace } from './space.js';
import { xylo, fx, setScene } from '../lib/sound';

// Два режима камеры:
//   скролл (главная) — камера идёт по ключам KEYS, прогресс берётся из секций .world-sec[data-p];
//   вид (любая другая страница) — на странице есть [data-world-view], камера летит к месту этой страницы.
// Таблички — HTML-элементы [data-anchor], их позицию каждый кадр считает этот модуль.
export function startWorld(canvas, opts = {}) {
const nav = opts.nav || ((href) => { location.href = href; });
const slugs = opts.slugs || {};
const reduce = false; // при prefers-reduced-motion мир не запускается вовсе — показывается статичная страница
const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
let pr = Math.min(devicePixelRatio, mobile ? 1.1 : 1.25); // качество кадра; снижается само, если кадры идут медленно
renderer.setPixelRatio(pr);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// тени — каждый кадр (spec v0.9): после склейки сцены это дёшево, а тень больше не отстаёт от автора рывками

const painter = createPainter(renderer, mobile);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf9dcd4, 70, 230);
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);

// ---------- свет ----------
const hemi = new THREE.HemisphereLight(0xffe6ef, 0x8a6a55, 1.15); scene.add(hemi);
const moonLight = new THREE.DirectionalLight(0xc9d4ff, 0); scene.add(moonLight, moonLight.target);
const starGeo = new THREE.BufferGeometry(); const starPos = [];
for (let i = 0; i < 900; i++) { const u = Math.random() * Math.PI * 2, v = Math.random() * 0.45 + 0.05, r = 260; starPos.push(70 + Math.cos(u) * Math.cos(v) * r, Math.sin(v) * r, -60 + Math.sin(u) * Math.cos(v) * r); }
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
scene.add(stars);
const sun = new THREE.DirectionalLight(0xfff0dd, 2.4);
sun.castShadow = true; sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 13, bottom: -9, near: 1, far: 70 });
sun.shadow.radius = 6; sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);
const rim = new THREE.DirectionalLight(0xffb7c8, 0.9); scene.add(rim, rim.target);

// ---------- планеты и Дом автора ----------
const P = { kuv: buildKuvshinki(), dub: buildDub(), fan: buildFandango(), asf: buildAsfodel(scene), home: buildHome() };
const POS = { kuv: [0, 0, 0], dub: [34, 3, -30], fan: [68, -2, -62], asf: [104, 4, -96], home: [140, 1, -128] };
Object.entries(P).forEach(([k, p]) => { p.root.position.set(...POS[k]); scene.add(p.root); }); // теней под планетами нет: в космосе им не на что падать (Ник 2026-10-31)
P.dub.root.rotation.y = -0.4; P.fan.root.rotation.y = -0.2; P.asf.root.rotation.y = -0.3; P.home.root.rotation.y = -0.35;
const heroes = addHeroes(P);
const ANCH = { ...heroes.anchors, ...P.home.anchors };
const clouds = [
  cloud(scene, -11, 4, -6, 1.6), cloud(scene, 10, 2, 4, 1.2), cloud(scene, 18, -5, -24, 1.6), cloud(scene, 46, 0, -40, 1.4),
  cloud(scene, 56, 9, -50, 2.0), cloud(scene, 80, 4, -76, 1.5), cloud(scene, 90, -2, -84, 1.3), cloud(scene, 124, 6, -110, 1.6), cloud(scene, 150, -3, -118, 1.2),
];

// ---------- камера ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const at = (k, x, y, z) => V(...POS[k]).add(V(x, y, z));
const atL = (k, x, y, z) => { P[k].root.updateMatrixWorld(); return P[k].root.localToWorld(V(x, y, z)); };
const toW = (k, v) => v.clone().applyEuler(P[k].root.rotation).add(V(...POS[k]));
const focus = (k) => toW(k, P[k].focus);
// камера выше и смотрит сверху — мир читается как макет на столе (эффект миниатюры, spec v0.13)
const DIVE = { kuv: [2.7, 4.6, 6.4], dub: [4.2, 6.8, 9.0], fan: [3.4, 5.8, 7.8], home: [5.2, 8.6, 13.0] };
const dive = (k) => focus(k).add(V(...DIVE[k]).applyEuler(P[k].root.rotation));
// вид страницы книги: между обзором планеты и «нырком» — видна вся планета с героями
const wide = (k) => dive(k).lerp(at(k, 9, 11, 15), 0.45);
const KEYS = [
  [0.00, () => V(10, 34, 64), () => V(40, 0, -30)],
  [0.08, () => at('kuv', 9, 11, 15), () => at('kuv', 0, 0, 0)],
  [0.16, () => dive('kuv'), () => focus('kuv')],
  [0.27, () => at('kuv', 18, 14, -6), () => at('dub', 0, 0, 0)],
  [0.33, () => at('dub', 9, 11, 15), () => at('dub', 0, 0.5, 0)],
  [0.39, () => dive('dub'), () => focus('dub')],
  [0.49, () => at('dub', 18, 14, -6), () => at('fan', 0, 0, 0)],
  [0.55, () => at('fan', 9, 11, 15), () => at('fan', 0, 0, 0)],
  [0.61, () => dive('fan'), () => focus('fan')],
  [0.72, () => at('asf', 22, 16, 34), () => at('asf', 0, 5, 0)],
  [0.80, () => atL('asf', 7, 3.4, 13), () => atL('asf', 0, 2.8, 0)], // герои и автор внизу целиком в кадре, лестница видна
  [0.88, () => atL('asf', 7, 15, 10), () => atL('asf', 1.2, 10.2, -1.6)],
  [0.94, () => at('home', 16, 13, 20), () => at('home', 0, 0, 0)],
  [1.00, () => dive('home'), () => focus('home')],
];
// Виды страниц: камера и точка взгляда, и «время суток» (прогресс неба)
const VIEWS = {
  overview: [KEYS[0][1], KEYS[0][2], 0],
  kuv: [() => wide('kuv'), () => focus('kuv'), 0.16],
  dub: [() => wide('dub'), () => focus('dub'), 0.39],
  fan: [() => wide('fan'), () => focus('fan'), 0.61],
  asf: [KEYS[10][1], KEYS[10][2], 0.8],
  home: [() => dive('home'), () => focus('home'), 1],
  desk: [() => toW('home', P.home.desk).add(V(4.2, 3.6, 6.4).applyEuler(P.home.root.rotation)), () => toW('home', P.home.desk), 1],
  shelf: [() => toW('home', P.home.shelf).add(V(3.6, 2.4, 6.8).applyEuler(P.home.root.rotation)), () => toW('home', P.home.shelf), 1],
};
// ---------- автор-проводник: станции маршрута (spec v0.4). p совпадает с data-p секций главной ----------
// точка на планете; координаты в .v — их меняет панель настройки (?tune)
const local3 = (k, x, y, z) => { const f = () => atL(k, ...f.v); f.v = [x, y, z]; f.k = k; return f; };
const seatW = () => { const v = new THREE.Vector3(); P.home.seat.getWorldPosition(v); return v; };
const STATIONS = [
  // приветствие: автор близко и по центру кадра, лицом к гостю (spec v0.6)
  { p: 0.00, say: 'intro', wave: true, onCloud: true, pos: () => { const c = V(10, 34, 64); return c.clone().add(V(40, 0, -30).sub(c).normalize().multiplyScalar(9)).add(V(0, -2.5, 0)); } },
  { p: 0.16, say: 'kuv', pos: local3('kuv', 1.7, 0.27, 0.1), planet: 'kuv' }, // край большого листа: твёрдо под ногами (луч сверху), над автором есть место для реплики
  { p: 0.39, say: 'dub', pos: local3('dub', 3.8, 0.06, 0.0), planet: 'dub' }, // трава справа от площадки, дальше от камеры (v0.13: камера выше): не за щитом (проверено лучом сверху)
  { p: 0.61, say: 'fan', pos: local3('fan', 3.6, 0.06, -1.6), planet: 'fan' }, // лужайка справа, ближе к центру кадра (v0.13): не в речке и не за скамейкой (проверено лучом сверху)
  { p: 0.80, say: 'asf', pos: local3('asf', 2.8, 0.06, 0.4), planet: 'asf' }, // дальше от камеры: целиком в кадре, над головой нет ступеней (луч сверху)
  { p: 1.00, say: 'home', sit: true, pos: seatW, seatQuat: (q) => P.home.seat.getWorldQuaternion(q) },
];
const author = buildAuthor(scene, STATIONS);
ANCH.author = author.anchor;
P.home.setCovers(opts.covers || []); // книги автора на полке (spec v0.13)
const life = addLife(scene);
const space = addSpace(scene, Object.values(POS)); // бумажные звёзды и далёкие луны (spec v0.13)
// облегчение (spec v0.8): неподвижные предметы склеиваются; подвижные находим, прогнав анимации вхолостую
const SIM = [0.31, 1.73, 3.37, 6.11];
// гладкие формы до склейки (spec v0.13): иначе склеятся старые гранёные
smoothen([...Object.values(P).map((p) => p.root), ...clouds, author.root], mobile);
const TUNE = location.search.includes('tune'); // панель настройки: склейку выключаем, иначе предметы не сдвинуть
const bakeInfo = TUNE ? { rest: [] } : bakeStatic([...Object.values(P).flatMap((p) => p.root.children), ...clouds, author.fig], Object.values(P).flatMap((p) => p.hit || []), (i) => {
  const t = i < 0 ? 0 : SIM[i], k = i < 0 ? 0 : i % 2;
  P.kuv.update(t, false); P.dub.update(t, false, k); P.fan.update(t, false); P.asf.update(t, false, k); P.home.update(t, false, k);
  heroes.update(t, false); life.update(t, k);
  const pose = author.fig.userData.pose; pose.sit = pose.write = !!k; pose.wave = !k; author.fig.userData.update(t);
});
// издалека герои в несколько пикселей — их не рисуем (облегчение, spec v0.8)
const figs = []; Object.values(P).forEach((pl) => pl.root.traverse((o) => { if (o.userData.pose) figs.push(o); }));
const figW = new THREE.Vector3();
if (TUNE) import('./tune.js').then((m) => m.startTune({ P, DIVE, STATIONS, camera, canvas, renderer }));
if (location.search.includes('debug')) window.__w = { P, scene, STATIONS, THREE, renderer, camera, bakeInfo }; // проверка перекрытий (scripts, Playwright)
// подсказки у сюрпризов (spec v0.7): точка над каждым интерактивным объектом, к ней привязан ярлык из HTML (.tag-act)
{
  const box = new THREE.Box3(), top = new THREE.Vector3();
  const tagOn = (id, o, dy = 0.3) => {
    o.updateWorldMatrix(true, true); box.setFromObject(o); box.getCenter(top); top.y = box.max.y + dy;
    const a = new THREE.Object3D(); o.add(a); a.position.copy(o.worldToLocal(top.clone())); ANCH[id] = a;
  };
  tagOn('kuv.act.lily', P.kuv.hit[0]);
  ['oak', 'nut', 'sponge'].forEach((id) => tagOn(`dub.act.${id}`, P.dub.anchorOf(id)));
  ['well', 'river', 'milk', 'stone', 'fan'].forEach((id) => tagOn(`fan.act.${id}`, P.fan.anchorOf(id), id === 'river' ? -0.2 : 0.3));
}
const dented = new Set(), dentW = new THREE.Vector3();

const smooth = (t) => t * t * (3 - 2 * t);
function camAt(p) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
  const [p0, c0, l0] = KEYS[i], [p1, c1, l1] = KEYS[i + 1];
  const t = smooth(THREE.MathUtils.clamp((p - p0) / (p1 - p0), 0, 1));
  return [c0().lerp(c1(), t), l0().lerp(l1(), t)];
}
const active = (p) => (p < 0.27 ? 'kuv' : p < 0.49 ? 'dub' : p < 0.68 ? 'fan' : p < 0.91 ? 'asf' : 'home');
const zoneOf = (p) => (p < 0.07 ? 'intro' : p > 0.66 && p < 0.76 ? 'gate' : active(p));

// ---------- день → ночь ----------
const SKY = [ // p, верх, низ, туман, hemi-небо, hemi-земля, солнце, интенсивность солнца
  [0.00, '#f6b3c3', '#fbeee2', '#f9dcd4', '#ffe6ef', '#8a6a55', '#fff0dd', 2.4],
  [0.33, '#b9dcf2', '#fdf3e3', '#e7eef2', '#f2f6ff', '#7a6a55', '#fff6e8', 2.6],
  [0.55, '#ffd59a', '#fff4dc', '#fbe8c8', '#fff3d6', '#8a6a45', '#ffe6b8', 2.6],
  [0.68, '#7a6aa8', '#f2a48a', '#b99aa8', '#e9c9e0', '#5a4a60', '#ffb88a', 1.6],
  [0.78, '#0e1433', '#2b2a55', '#1b1d3d', '#5a6aa8', '#1d1a2c', '#b9c8ff', 0.9],
  [1.00, '#1a1d48', '#4a3f6e', '#2a2850', '#6f7fc0', '#2a2238', '#c9d4ff', 1.0],
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
let sections = [], anchors = [[0, 0]];
function measure() {
  const had = sections.length;
  sections = [...document.querySelectorAll('.world-sec[data-p]')];
  // вернулись на главную из попапа (/#planet-dub): прокрутить к месту, когда секции уже в DOM
  if (!had && sections.length && location.hash.length > 1 && homeY === null) { const el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) requestAnimationFrame(() => { el.scrollIntoView({ behavior: 'instant' }); target = progress(); }); }
  anchors = sections.length ? sections.map((s) => [Math.max(0, s.offsetTop + s.offsetHeight - innerHeight), +s.dataset.p]) : [[0, 0]];
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
let fpsAt = 0, lastLit = 0;
// цветовая «погода» планет (spec v0.13, арт-директор): утро у пруда, полдень во дворе, золотой вечер в деревне, синяя ночь, тёплая лампа
const TINT = { kuv: new THREE.Color(0.97, 1.02, 1.04), dub: new THREE.Color(1.03, 1.01, 0.96), fan: new THREE.Color(1.07, 1.0, 0.88), asf: new THREE.Color(0.92, 0.96, 1.08), home: new THREE.Color(1.05, 0.97, 1.0) };
const gradeTint = new THREE.Color(1, 1, 1), hazeC = new THREE.Color(); const fpsEl = location.search.includes('fps') ? Object.assign(document.body.appendChild(document.createElement('div')), { style: 'position:fixed;left:10px;top:10px;z-index:99;font:12px/1 monospace;background:#000a;color:#fff;padding:6px 8px;border-radius:6px;pointer-events:none' }) : null;
let homeP = null, homeY = null, backUntil = 0; // где была главная, когда открыли страницу (spec v0.8)
const camPos = V(10, 60, 90), camLook = V(40, 0, -30); let skyP = 0, first = true;
let xyStep = -1, xyAt = 0;
const onScroll = () => {
  target = progress(); if (!snapping) armSnap();
  // ксилофон (spec v0.12): 42 ноты на весь путь — листаешь, как ведёшь палочкой по ксилофону (мажорная гамма, две октавы)
  const st = Math.floor(target * 42), now = performance.now();
  if (st !== xyStep && now - xyAt > 70) { if (xyStep >= 0) xylo(((st % 14) + 14) % 14, 0.08); xyStep = st; xyAt = now; }
};
// Доводка скролла (spec v0.11, дизайнер): человек перестал листать между сценами — плавно доводим до ближайшей остановки.
// Остановки — точки, где автор говорит: приветствие и планеты. Любое касание, колесо или клавиша доводку отменяют.
const STOPS = [0, 0.16, 0.39, 0.61, 0.80, 0.88, 1]; // 0.88 — Город Снегов наверху лестницы
let snapTimer = 0, snapping = false, snapRaf = 0;
const yOf = (pv) => { // обратная к progress(): прокрутка, при которой прогресс = pv
  for (let i = 0; i < anchors.length - 1; i++) { const [y0, p0] = anchors[i], [y1, p1] = anchors[i + 1]; if (pv <= p1) return y0 + (y1 - y0) * ((pv - p0) / Math.max(1e-6, p1 - p0)); }
  return anchors[anchors.length - 1][0];
};
const stopSnap = () => { snapping = false; cancelAnimationFrame(snapRaf); clearTimeout(snapTimer); };
function armSnap() {
  clearTimeout(snapTimer);
  snapTimer = setTimeout(() => {
    if (document.querySelector('[data-world-view]') || document.querySelector(':popover-open') || anchors.length < 2) return;
    const ys = STOPS.map(yOf), y = scrollY; let best = ys[0]; ys.forEach((v) => { if (Math.abs(v - y) < Math.abs(best - y)) best = v; });
    if (Math.abs(best - y) < 4 || Math.abs(best - y) > innerHeight * 1.6) return; // уже на месте или далеко — не тянем
    const from = y, t0 = performance.now(), dur = Math.min(900, 350 + Math.abs(best - y) * 0.6); snapping = true;
    let last = from;
    const step = (now) => {
      if (Math.abs(scrollY - last) > 3) { snapping = false; return; } // страницу прокрутил кто-то другой (меню, ссылка) — не спорим
      const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      last = Math.round(from + (best - from) * e); scrollTo({ top: last, behavior: 'instant' }); last = scrollY;
      if (k < 1 && snapping) snapRaf = requestAnimationFrame(step); else snapping = false;
    };
    snapRaf = requestAnimationFrame(step);
  }, 220);
}
['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, stopSnap, { passive: true }));
window.__snap = () => { target = progress(); cur = target; first = true; ready = 1; return target; }; // для съёмки постеров: без плавного появления
addEventListener('scroll', onScroll, { passive: true });
// Попап закрылся — браузер возвращает фокус на кнопку-табличку, а она висит над 3D (position: fixed).
// Некоторые браузеры при этом прокручивают страницу в начало. Запоминаем скролл при открытии и возвращаем после закрытия.
// Защита в два слоя: 1) перед закрытием снимаем фокус внутри попапа — браузеру некуда «возвращать» фокус со скроллом;
// фокус возвращаем на кнопку сами, без прокрутки; 2) ещё 0,9 с держим прежнюю позицию, если страница всё же уехала.
const popY = new WeakMap(); let invoker = null;
const onPopClick = (e) => { const b = e.target instanceof Element && e.target.closest('[popovertarget]'); if (b && !b.closest('[popover]')) invoker = b; };
const keepY = (y) => { const until = performance.now() + 900; const go = () => { if (Math.abs(scrollY - y) > 2) scrollTo({ top: y, behavior: 'instant' }); if (performance.now() < until) requestAnimationFrame(go); }; go(); };
const isPop = (el) => el instanceof HTMLElement && el.hasAttribute('popover');
const onPopBefore = (e) => { if (isPop(e.target) && e.newState === 'closed' && e.target.contains(document.activeElement)) document.activeElement.blur(); };
const onPopToggle = (e) => {
  const el = e.target; if (!isPop(el)) return;
  if (e.newState === 'open') { popY.set(el, scrollY); fx('paper'); return; }
  if (popY.has(el) && el.id !== 'site-menu') keepY(popY.get(el)); // из меню уходят в другое место — позицию не держим
  if (invoker && invoker.isConnected) invoker.focus({ preventScroll: true });
};
document.addEventListener('click', onPopClick, true);
document.addEventListener('beforetoggle', onPopBefore, true);
document.addEventListener('toggle', onPopToggle, true);
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  painter.setSize(innerWidth, innerHeight, renderer.getPixelRatio());
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
  if (!text || !bubble) return;
  // вторая строка — цитата из книги, курсивом (spec v0.12)
  const [main, quote] = String(text).split('\n');
  const b = document.createElement('b'); b.textContent = main; bubble.replaceChildren(b);
  if (quote) { const q = document.createElement('i'); q.textContent = quote; bubble.append(q); }
  bubble.classList.add('on'); bubbleAnchor = anchor; bubbleUntil = performance.now() + (quote ? 5200 : 2600);
}
function lily(force) {
  const open = P.kuv.toggle(force);
  const line = open ? '«Тебе кувшинок корабли / Закатных сказок привезли»' : '';
  const v = document.getElementById('verse'); if (v) { v.textContent = line; v.classList.toggle('on', open); }
  const inline = document.getElementById('verseInline'); if (inline) inline.textContent = line; // телефон: строка в виджете
  document.getElementById('lilyBtn')?.setAttribute('aria-pressed', String(open));
}
const onClick = (e) => {
  const t = e.target.closest('[data-dub],[data-smell],#lilyBtn'); if (!t) return;
  if (t.id === 'lilyBtn') lily();
  else if (t.dataset.dub) say(P.dub.press(t.dataset.dub), P.dub.anchorOf(t.dataset.dub));
  else if (t.dataset.smell) say(P.fan.press(t.dataset.smell), ANCH[`fan.act.${t.dataset.smell}`] || P.fan.anchorOf(t.dataset.smell)); // подпись — над самим предметом
};
document.addEventListener('click', onClick);

const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
const PLANETS = ['kuv', 'dub', 'fan', 'asf', 'home'];
function hitTest(e) {
  ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  for (const k of ['kuv', 'dub', 'fan']) { const h = ray.intersectObjects(P[k].hit, true)[0]; if (h) return ['act', k, h.object]; }
  let best = null;
  for (const k of PLANETS) { const h = ray.intersectObject(P[k].root, true)[0]; if (h && (!best || h.distance < best[3])) best = ['planet', k, h.object, h.distance, h.point]; }
  return best;
}
// Клик по планете — перелёт к ней (решение Ника 2026-10-29): на главной — скроллом, на других страницах — на её адрес
function flyTo(k) {
  const view = document.querySelector('[data-world-view]');
  if (!view) { document.getElementById(k === 'home' ? 'home' : `planet-${k}`)?.scrollIntoView({ behavior: 'smooth' }); return; }
  nav(k === 'home' ? '/about/' : `/books/${slugs[k]}/`);
}
// фигурка героя → его карточка (тот же попап, что у ярлыка)
const heroOf = new Map(); Object.entries(ANCH).forEach(([id, a]) => { if (!id.includes('.hero.')) return; let f = a; while (f && !f.userData.pose) f = f.parent; if (f) heroOf.set(f, id); });
const figOf = (o) => { for (let x = o; x; x = x.parent) if (x.userData.pose) return x; return null; };
canvas.addEventListener('click', (e) => {
  const h = hitTest(e); if (!h) return;
  const [kind, k, obj, , point] = h;
  if (obj.userData.slug) { fx('paper'); nav(`/books/${obj.userData.slug}/`); return; } // книга на полке → её страница
  if (kind === 'planet') {
    if (k !== curZone) { flyTo(k); return; }
    // своя планета: герой — карточка; предмет — «мнётся»; земля и вода — рябь (spec v0.12, дизайнер)
    const fig = figOf(obj);
    if (fig) { life.squish(fig); fx('squish'); const id = heroOf.get(fig); if (id) document.getElementById(`hero-${id}`)?.showPopover(); return; }
    if (point) { life.ripple(P[k].island, point); fx('plop'); }
    let top = obj; while (top.parent && top.parent !== P[k].island) top = top.parent;
    if (top !== P[k].island && top.name !== 'baked' && obj.name !== 'baked') { life.squish(top); fx('squish'); }
    return;
  }
  { let top = obj; while (top.parent && top.parent !== P[k].island) top = top.parent; life.squish(top); }
  fx(k === 'dub' ? 'bounce' : k === 'fan' ? 'chime' : 'plop');
  if (k === 'kuv') lily();
  else { const id = P[k].pick(obj); if (id) say(P[k].press(id), ANCH[`${k}.act.${id}`] || P[k].anchorOf(id)); }
});
let lastMove = 0;
canvas.addEventListener('pointermove', (e) => { const n = performance.now(); if (n - lastMove < 120) return; lastMove = n; const h = hitTest(e); canvas.style.cursor = h && (h[0] === 'act' || h[1] !== curZone || h[2].userData.slug) ? 'pointer' : ''; });

// ---------- таблички над 3D ----------
let tags = [], sizes = new Map(), tagFrame = 0;
const v = new THREE.Vector3(), cw = new THREE.Vector3();
const clamp = THREE.MathUtils.clamp;
function placeTags() {
  if (tagFrame++ % 20 === 0) {
    // реплики автора — первыми: остальные ярлыки уступают им место
    tags = [...document.querySelectorAll('[data-anchor]')].sort((x, y) => y.classList.contains('say') - x.classList.contains('say'));
    tags.forEach((el) => sizes.set(el, [el.offsetWidth, el.offsetHeight]));
  }
  camera.getWorldPosition(cw);
  const placed = []; // занятые прямоугольники экрана: [лево, верх, право, низ]
  for (const el of tags) {
    const a = ANCH[el.dataset.anchor];
    let on = false;
    if (a) {
      a.getWorldPosition(v);
      const d = v.distanceTo(cw);
      v.project(camera);
      // реплика держится у края экрана, если автор чуть за кадром; ярлыки — только в кадре
      const lim = el.classList.contains('sign') || el.classList.contains('say') ? 1.6 : 1.02;
      on = v.z < 1 && Math.abs(v.x) < lim && Math.abs(v.y) < lim && d < +(el.dataset.near || 30);
      if (on) {
        const [w, h] = sizes.get(el) || [0, 0];
        const x = clamp((v.x * 0.5 + 0.5) * innerWidth, w / 2 + 8, innerWidth - w / 2 - 8);
        let y = clamp((-v.y * 0.5 + 0.5) * innerHeight, h + 12, innerHeight - 40); // меню сверху нет — отступ от края небольшой
        const isSay = el.classList.contains('say');
        if (isSay && innerWidth <= 640) { const r = el.getBoundingClientRect(); if (r.height && root.dataset.say === el.dataset.say) placed.push([r.left, r.top, r.right, r.bottom]); }
        else {
          // ярлык наезжает на уже поставленный (реплику или другой ярлык) — поднимаем его выше
          const clash = (yy) => placed.find((q) => x - w / 2 < q[2] + 4 && x + w / 2 > q[0] - 4 && yy - h < q[3] + 4 && yy > q[1] - 4);
          if (!isSay && clash(y)) {
            // сначала пробуем выше, потом ниже того, на что наехали
            let up = y; for (let i = 0; i < 6; i++) { const q = clash(up); if (!q) break; up = q[1] - 6; }
            let dn = y; for (let i = 0; i < 6; i++) { const q = clash(dn); if (!q) break; dn = q[3] + h + 6; }
            y = up - h > 8 && (y - up <= dn - y || dn > innerHeight - 20) ? up : dn;
          }
          const shown = !isSay || root.dataset.say === el.dataset.say; // реплика видна только у своей станции
          if (isSay || (y - h > 8 && y < innerHeight - 20)) { if (shown) placed.push([x - w / 2, y - h, x + w / 2, y]); el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`; }
          else on = false; // места нет — ярлык прячется, пока камера не повернётся
        }
      }
    }
    if (el.classList.contains('on') !== on) el.classList.toggle('on', on);
  }
}

// ---------- сдвиг сцены под панель: объект страницы виден рядом с попапом ----------
let offX = 0, offY = 0;
function panelOffset() {
  const pn = document.querySelector('[data-world-panel]');
  let tx = 0, ty = 0;
  // лист по центру (spec v0.8): сцену не сдвигаем; сдвиг остаётся только для прямого захода на страницу
  if (pn && homeP === null) { const r = pn.getBoundingClientRect(); if (innerWidth >= 900) tx = (innerWidth - r.left) / 2; else ty = Math.max(0, innerHeight - r.top) / 2; }
  offX += (tx - offX) * 0.08; offY += (ty - offY) * 0.08;
  if (Math.abs(offX) + Math.abs(offY) < 0.5) camera.clearViewOffset();
  else camera.setViewOffset(innerWidth, innerHeight, offX, offY, innerWidth, innerHeight);
}

// ---------- цикл ----------
const clock = new THREE.Clock();
function local(p, a, b) { return THREE.MathUtils.clamp((p - a) / (b - a), 0, 1); }
let curZone = '';
resize();
function tick() {
  const t = clock.getElapsedTime();
  const viewEl = document.querySelector('[data-world-view]');
  const view = viewEl && VIEWS[viewEl.dataset.worldView];
  let cp, lp, p;
  // Пришли на страницу с главной — камера не летит к столу или полке, а стоит на месте; страница — лист по центру (spec v0.8)
  const frozen = !!view && homeP !== null;
  if (frozen) { p = homeP; [cp, lp] = camAt(p); }
  else if (view) { cp = view[0](); lp = view[1](); p = view[2]; }
  else { cur += (target - cur) * 0.07; p = cur; [cp, lp] = camAt(p); }
  // закрыли страницу: главная снова в DOM — возвращаем ровно ту прокрутку, что была до открытия (без скачка камеры)
  if (wasView && !view) {
    measure();
    if (homeY !== null) { backUntil = performance.now() + 400; target = cur = p = homeP; [cp, lp] = camAt(p); }
    else if (location.hash.length > 1) { const el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) { el.scrollIntoView({ behavior: 'instant' }); target = progress(); } }
  }
  if (!view && performance.now() < backUntil) { if (Math.abs(scrollY - homeY) > 2) scrollTo({ top: homeY, behavior: 'instant' }); target = cur = homeP; }
  else if (!view) { homeP = cur; homeY = scrollY; }
  wasView = !!view;
  // телефон (вертикальный экран, spec v0.13): камера ближе, взгляд ниже — внизу экрана реплика, мир виден над ней
  if (innerWidth < innerHeight && !view) { lp.y -= 2.2; cp.lerp(lp, 0.12); }
  const k = first ? 1 : view ? 0.045 : 0.3; first = false;
  camPos.lerp(cp, k); camLook.lerp(lp, k); skyP += (p - skyP) * (view ? 0.045 : 1);
  camera.position.copy(camPos); camera.lookAt(camLook);
  panelOffset();

  // небо и свет
  const s = skyAt(skyP);
  root.style.setProperty('--sky-top', '#' + s.top.getHexString());
  root.style.setProperty('--sky-bottom', '#' + s.bottom.getHexString());
  ready = Math.min(1, ready + 0.03); // плавное появление сцены
  canvas.style.opacity = String(ready);
  const night = Math.min(1, Math.max(0, (skyP - 0.68) / 0.12));
  moonLight.intensity = night * 1.4; hemi.intensity = 1.15 + night * 0.6; stars.material.opacity = night * 0.9;
  scene.fog.color.copy(s.fog);
  hemi.color.copy(s.hs); hemi.groundColor.copy(s.hg);
  sun.color.copy(s.sun); sun.intensity = s.si;
  root.classList.toggle('night', skyP > 0.7);

  // зона: какие виджеты показывать (CSS по html[data-zone])
  const zone = view ? 'view' : zoneOf(p);
  const near = view ? viewEl.dataset.worldView : active(p);
  curZone = ['desk', 'shelf'].includes(near) ? 'home' : near;
  if (root.dataset.zone !== zone) root.dataset.zone = zone;
  if (root.dataset.planet !== curZone) root.dataset.planet = curZone;

  // солнце следует за ближайшей планетой — тени всегда рядом
  const pv = V(...POS[PLANETS.includes(curZone) ? curZone : 'kuv']);
  sun.target.position.copy(pv); sun.position.copy(pv).add(V(-8, 18, 10));
  rim.target.position.copy(pv); rim.position.copy(pv).add(V(10, 6, -10));
  moonLight.target.position.copy(pv); moonLight.position.copy(pv).add(V(-20, 30, 15));

  if (curZone !== 'kuv' && P.kuv.open) lily(0);
  // покадровая анимация (spec v0.5): герои и предметы живут на 12 кадрах в секунду, камера и полёт автора — плавно
  // Плавная анимация (spec v0.9): текущая планета, герои, автор и деревья — каждый кадр;
  // дальние планеты и проверка детализации — 12 раз в секунду (их почти не видно, а работа процессору меньше)
  const t12 = Math.floor(t * 12), slow = t12 !== lastTs || curZone !== lastZone; lastTs = t12; lastZone = curZone;
  const upd = (k) => slow || k === curZone;
  if (upd('kuv')) P.kuv.update(t, reduce);
  if (upd('dub')) P.dub.update(t, reduce, view ? (curZone === 'dub' ? 1 : 0) : local(p, 0.3, 0.39));
  if (upd('fan')) P.fan.update(t, reduce);
  if (upd('asf')) P.asf.update(t, reduce, view ? (curZone === 'asf' ? 0.5 : 0) : local(p, 0.74, 0.88));
  if (upd('home')) P.home.update(t, reduce, night);
  heroes.update(t, reduce);
  life.update(t, night);
  space.update(t);
  setScene(view ? (curZone || 'home') : zone); // фон сцены: свой у каждой планеты (spec v0.12)
  const lit = P.asf.stepsLit.n ?? 0; if (lit !== lastLit) { if (lit > lastLit) xylo(lit, 0.11); lastLit = lit; } // поющая лестница
  if (slow) {
    figs.forEach((f) => { f.getWorldPosition(figW); f.visible = figW.distanceTo(camPos) < 42; });
    // детализация: отдельная мелочь, которая на экране меньше ~6 px, уходит на слой 1 (не рисуется)
    bakeInfo.rest.forEach(({ o, r }) => { o.getWorldPosition(figW); o.layers.set(r / figW.distanceTo(camPos) > 0.0025 ? 0 : 1); });
  }
  const say = author.update(t, p, camPos, reduce);
  // след облачка: вмятина в траве остаётся там, где автор приземлялся
  const la = author.landedAt;
  if (la && la.planet && !dented.has(la)) {
    dented.add(la); author.cloud.getWorldPosition(dentW); dentW.y = la.pos().y - 0.04; life.dent(P[la.planet].island, dentW);
  }
  const sayNow = view ? '' : say;
  if (root.dataset.say !== sayNow) root.dataset.say = sayNow;

  Object.values(P).forEach((pl, i) => { pl.island.position.y = Math.sin(t * 0.6 + i) * 0.12; });
  clouds.forEach((cl, i) => { cl.position.x += Math.sin(t * 0.2 + i) * 0.002; });

  placeTags();
  if (bubbleAnchor && bubble) {
    bubbleAnchor.getWorldPosition(v); v.y += 1.1; v.project(camera);
    bubble.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px, ${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, -100%)`;
    if (performance.now() > bubbleUntil) { bubble.classList.remove('on'); bubbleAnchor = null; }
  }

  // фокус объектива: на авторе, пока она говорит, иначе — на точке взгляда камеры
  // само снижает чёткость кадра, если видеокарта не успевает (средний кадр дольше 24 мс)
  const now = performance.now(); if (lastNow) frameMs += (Math.min(100, now - lastNow) - frameMs) * 0.05; lastNow = now;
  // ?fps в адресе — счётчик кадров в углу: проверить скорость на своём устройстве
  if (fpsEl && now - fpsAt > 500) { fpsAt = now; fpsEl.textContent = `${Math.round(1000 / frameMs)} fps · ${frameMs.toFixed(1)} мс · ×${pr.toFixed(2)}`; }
  if (++perfN > 90) { perfN = 0; if (frameMs > 21 && pr > 0.8) { pr = Math.max(0.75, pr - 0.25); renderer.setPixelRatio(pr); resize(); } }
  // палитра планеты — плавно к цвету текущей зоны; дымка — цвет тумана в экранных цветах
  gradeTint.lerp(TINT[curZone] || TINT.kuv, 0.04); hazeC.copy(scene.fog.color).convertLinearToSRGB();
  painter.render(scene, camera, night, sayNow ? camPos.distanceTo(author.root.position) : camPos.distanceTo(camLook), gradeTint, hazeC);
  if (++frames === 3) opts.onReady?.(); // первые кадры готовы — прелоадер можно снять
  raf = document.hidden ? 0 : requestAnimationFrame(tick); // вкладка скрыта — цикл стоит
}
let raf = 0, ready = 0, lastRail = '', frames = 0, lastTs = -1, lastZone = '', lastNow = 0, frameMs = 16, perfN = 0, wasView = false;
const onVis = () => { if (!document.hidden && !raf) raf = requestAnimationFrame(tick); };
document.addEventListener('visibilitychange', onVis);
lily(0);
tick();
return () => {
  cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVis);
  removeEventListener('scroll', onScroll); stopSnap(); ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => removeEventListener(ev, stopSnap)); removeEventListener('resize', resize); ro.disconnect();
  document.removeEventListener('click', onClick); document.removeEventListener('toggle', onPopToggle, true); document.removeEventListener('beforetoggle', onPopBefore, true); document.removeEventListener('click', onPopClick, true);
  root.classList.remove('night'); delete root.dataset.zone; delete root.dataset.planet; delete root.dataset.say;
  painter.dispose();
  renderer.dispose();
};
}
