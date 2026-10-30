// @ts-nocheck — мир-пространство на весь сайт (spec v0.3). Запускается компонентом World в layout и живёт между страницами.
import { THREE, cloud, contactShadow } from './core.js';
import { buildKuvshinki } from './kuvshinki.js';
import { buildDub } from './dub.js';
import { buildFandango } from './fandango.js';
import { buildAsfodel } from './asfodel.js';
import { buildHome } from './home.js';
import { addHeroes } from './heroes.js';
import { buildAuthor } from './author.js';
import { createPainter } from './paint.js';

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
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
Object.entries(P).forEach(([k, p]) => { p.root.position.set(...POS[k]); p.root.add(contactShadow(6)); scene.add(p.root); });
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
const DIVE = { kuv: [2.7, 3.4, 6.7], dub: [4.2, 5.2, 9.5], fan: [3.4, 4.4, 8.2], home: [5.2, 7.6, 13.5] };
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
  [0.80, () => atL('asf', 7, 2.5, 13), () => atL('asf', 0, 4.5, 0)],
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
const local3 = (k, x, y, z) => () => atL(k, x, y, z);
const seatW = () => { const v = new THREE.Vector3(); P.home.seat.getWorldPosition(v); return v; };
const STATIONS = [
  { p: 0.00, say: 'intro', wave: true, pos: () => V(10, 34, 64).lerp(V(40, 0, -30), 0.2).add(V(-2.2, -4.2, 0)) },
  { p: 0.16, say: 'kuv', pos: local3('kuv', 2.2, 0.25, 0.6) },
  { p: 0.39, say: 'dub', pos: local3('dub', 2.0, 0.18, -0.6) },
  { p: 0.61, say: 'fan', pos: local3('fan', 2.8, 0.12, 1.1) },
  { p: 0.72, say: 'gate', hover: true, pos: () => at('asf', 22, 16, 34).lerp(at('asf', 0, 5, 0), 0.35).add(V(-3, -2.5, 0)) },
  { p: 0.80, say: 'asf', pos: local3('asf', 2.4, 0.12, 2.1) },
  { p: 0.88, say: 'asf', pos: local3('asf', 2.4, 10.45, 0.2) },
  { p: 1.00, say: 'home', sit: true, pos: seatW, seatQuat: (q) => P.home.seat.getWorldQuaternion(q) },
];
const author = buildAuthor(scene, STATIONS);
ANCH.author = author.anchor;

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
  if (!had && sections.length && location.hash.length > 1) { const el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) requestAnimationFrame(() => { el.scrollIntoView({ behavior: 'instant' }); target = progress(); }); }
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
const camPos = V(10, 60, 90), camLook = V(40, 0, -30); let skyP = 0, first = true;
const onScroll = () => { target = progress(); };
window.__snap = () => { target = progress(); cur = target; first = true; ready = 1; return target; }; // для съёмки постеров: без плавного появления
addEventListener('scroll', onScroll, { passive: true });
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
  bubble.textContent = text; bubble.classList.add('on'); bubbleAnchor = anchor; bubbleUntil = performance.now() + 2600;
}
function lily(force) {
  const open = P.kuv.toggle(force);
  const line = open ? '«Тебе кувшинок корабли / Закатных сказок привезли»' : '';
  const v = document.getElementById('verse'); if (v) { v.textContent = line; v.classList.toggle('on', open); }
  const inline = document.getElementById('verseInline'); if (inline) inline.textContent = line; // телефон: строка в виджете
  document.getElementById('lilyBtn')?.setAttribute('aria-pressed', String(open));
}
const onClick = (e) => {
  const t = e.target.closest('[data-dub],[data-smell],#lilyBtn,#skip16'); if (!t) return;
  if (t.id === 'lilyBtn') lily();
  else if (t.id === 'skip16') { e.preventDefault(); document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }); }
  else if (t.dataset.dub) say(P.dub.press(t.dataset.dub), P.dub.anchorOf(t.dataset.dub));
  else if (t.dataset.smell) say(P.fan.press(t.dataset.smell), P.fan.anchorOf(t.dataset.smell));
};
document.addEventListener('click', onClick);

const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
const PLANETS = ['kuv', 'dub', 'fan', 'asf', 'home'];
function hitTest(e) {
  ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  for (const k of ['kuv', 'dub', 'fan']) { const h = ray.intersectObjects(P[k].hit, true)[0]; if (h) return ['act', k, h.object]; }
  let best = null;
  for (const k of PLANETS) { const h = ray.intersectObject(P[k].root, true)[0]; if (h && (!best || h.distance < best[3])) best = ['planet', k, h.object, h.distance]; }
  return best;
}
// Клик по планете — перелёт к ней (решение Ника 2026-10-29): на главной — скроллом, на других страницах — на её адрес
function flyTo(k) {
  const view = document.querySelector('[data-world-view]');
  if (!view) { document.getElementById(k === 'home' ? 'home' : `planet-${k}`)?.scrollIntoView({ behavior: 'smooth' }); return; }
  nav(k === 'home' ? '/about/' : `/books/${slugs[k]}/`);
}
canvas.addEventListener('click', (e) => {
  const h = hitTest(e); if (!h) return;
  const [kind, k, obj] = h;
  if (kind === 'planet') { if (k !== curZone) flyTo(k); return; }
  if (k === 'kuv') lily();
  else { const id = P[k].pick(obj); if (id) say(P[k].press(id), P[k].anchorOf(id)); }
});
let lastMove = 0;
canvas.addEventListener('pointermove', (e) => { const n = performance.now(); if (n - lastMove < 120) return; lastMove = n; const h = hitTest(e); canvas.style.cursor = h && (h[0] === 'act' || h[1] !== curZone) ? 'pointer' : ''; });

// ---------- таблички над 3D ----------
let tags = [], sizes = new Map(), tagFrame = 0;
const v = new THREE.Vector3(), cw = new THREE.Vector3();
const clamp = THREE.MathUtils.clamp;
function placeTags() {
  if (tagFrame++ % 20 === 0) { tags = [...document.querySelectorAll('[data-anchor]')]; tags.forEach((el) => sizes.set(el, [el.offsetWidth, el.offsetHeight])); }
  camera.getWorldPosition(cw);
  for (const el of tags) {
    const a = ANCH[el.dataset.anchor];
    let on = false;
    if (a) {
      a.getWorldPosition(v);
      const d = v.distanceTo(cw);
      v.project(camera);
      // табличка книги держится у края экрана, если столбик чуть за кадром; имена героев — только в кадре
      const lim = el.classList.contains('sign') || el.classList.contains('say') ? 1.6 : 1.02;
      on = v.z < 1 && Math.abs(v.x) < lim && Math.abs(v.y) < lim && d < +(el.dataset.near || 30);
      if (on) {
        const [w, h] = sizes.get(el) || [0, 0];
        const x = clamp((v.x * 0.5 + 0.5) * innerWidth, w / 2 + 8, innerWidth - w / 2 - 8);
        const y = clamp((-v.y * 0.5 + 0.5) * innerHeight, h + 70, innerHeight - 70);
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
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
  if (pn) { const r = pn.getBoundingClientRect(); if (innerWidth >= 900) tx = (innerWidth - r.left) / 2; else ty = Math.max(0, innerHeight - r.top) / 2; }
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
  if (view) { cp = view[0](); lp = view[1](); p = view[2]; }
  else { cur += (target - cur) * 0.07; p = cur; [cp, lp] = camAt(p); }
  if (innerWidth < innerHeight && !view) lp.y -= 2.2;
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
  P.kuv.update(t, reduce);
  P.dub.update(t, reduce, view ? (curZone === 'dub' ? 1 : 0) : local(p, 0.3, 0.39));
  P.fan.update(t, reduce);
  const stairs = view ? (curZone === 'asf' ? 0.5 : 0) : local(p, 0.74, 0.88);
  P.asf.update(t, reduce, stairs);
  P.home.update(t, reduce, night);
  heroes.update(t, reduce);
  const say = author.update(t, p, camPos, reduce);
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

  painter.render(scene, camera, night);
  raf = document.hidden ? 0 : requestAnimationFrame(tick); // вкладка скрыта — цикл стоит
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
  root.classList.remove('night'); delete root.dataset.zone; delete root.dataset.planet; delete root.dataset.say;
  painter.dispose();
  renderer.dispose();
};
}
