// @ts-nocheck — модули мира перенесены из прототипа (specs/prototypes/world-src), типизация не нужна
import * as THREE from 'three';

export { THREE };

// «Пластилин 2.0» (spec v0.5): матовый материал с отпечатками пальцев, неровные формы, резьба на островах,
// тёплый просвет по краю. Текстуры рисуются на canvas при запуске, файлов нет.
function heightToNormal(c, k) {
  const N = c.width, g = c.getContext('2d'), src = g.getImageData(0, 0, N, N).data;
  const out = g.createImageData(N, N), d = out.data, h = (x, y) => src[(((y + N) % N) * N + ((x + N) % N)) * 4] / 255;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = (h(x + 1, y) - h(x - 1, y)) * k, dy = (h(x, y + 1) - h(x, y - 1)) * k, l = Math.hypot(dx, dy, 1), i = (y * N + x) * 4;
    d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  const o = document.createElement('canvas'); o.width = o.height = N; o.getContext('2d').putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(o); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
function canvasN(N, draw) { const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, N, N); draw(g, N); return c; }
const wrapDraw = (N, x, y, f) => { for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) f(x + dx, y + dy); };
let thumbN;
// отпечатки пальцев, вмятины от большого пальца, следы стека, мелкое зерно
function thumbs() {
  if (thumbN) return thumbN;
  let seed = 11; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const c = canvasN(512, (g, N) => {
    for (let i = 0; i < 70; i++) { const x = r() * N, y = r() * N, R = 18 + r() * 50, a = 0.10 + r() * 0.12;
      wrapDraw(N, x, y, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, R); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.7, `rgba(0,0,0,${a * 0.5})`); gr.addColorStop(0.92, `rgba(255,255,255,${a * 0.5})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(X, Y, R, 0, 7); g.fill(); }); }
    g.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) { const x = r() * N, y = r() * N, rot = r() * 3, n = 9 + (r() * 6) | 0;
      wrapDraw(N, x, y, (X, Y) => { for (let k = 1; k <= n; k++) { g.strokeStyle = `rgba(${k % 2 ? 0 : 255},${k % 2 ? 0 : 255},${k % 2 ? 0 : 255},0.10)`; g.beginPath(); g.ellipse(X, Y, k * 2.2, k * 1.6, rot, r() * 0.8, Math.PI + 1.6 + r()); g.stroke(); } }); }
    for (let i = 0; i < 30; i++) { const x = r() * N, y = r() * N, a = r() * 6.3, L = 10 + r() * 40;
      wrapDraw(N, x, y, (X, Y) => { g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 0.8 + r(); g.beginPath(); g.moveTo(X, Y); g.quadraticCurveTo(X + Math.cos(a) * L * 0.5 + 4, Y + Math.sin(a) * L * 0.5, X + Math.cos(a) * L, Y + Math.sin(a) * L); g.stroke(); }); }
    const img = g.getImageData(0, 0, N, N), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = (r() - 0.5) * 10; d[i] += v; d[i + 1] += v; d[i + 2] += v; }
    g.putImageData(img, 0, 0);
  });
  thumbN = heightToNormal(c, 3.5); thumbN.repeat.set(2, 2);
  return thumbN;
}
// резьба по боку острова: узор штампом, тайлится по окружности
const carveCache = {};
export function carved(color, kind) {
  const key = color + kind; if (carveCache[key]) return carveCache[key];
  const c = canvasN(256, (g, N) => {
    g.fillStyle = '#000'; g.strokeStyle = '#000';
    if (kind === 'dots') for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) { const gr = g.createRadialGradient(i * 32 + 16 + (j % 2) * 16, 50 + j * 78, 0, i * 32 + 16 + (j % 2) * 16, 50 + j * 78, 11); gr.addColorStop(0, '#202020'); gr.addColorStop(1, '#808080'); g.fillStyle = gr; g.beginPath(); g.arc(i * 32 + 16 + (j % 2) * 16, 50 + j * 78, 11, 0, 7); g.fill(); }
    if (kind === 'zigzag') { g.lineWidth = 9; g.strokeStyle = '#303030'; for (const y of [70, 186]) { g.beginPath(); for (let x = -32; x <= N + 32; x += 32) g.lineTo(x, y + ((x / 32) % 2 ? -26 : 26)); g.stroke(); } }
    if (kind === 'leaves') for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const x = i * 64 + 32 + j * 32, y = 64 + j * 128; g.save(); g.translate(x, y); g.rotate(j ? 0.6 : -0.6); g.fillStyle = '#2a2a2a'; g.beginPath(); g.ellipse(0, 0, 26, 11, 0, 0, 7); g.fill(); g.strokeStyle = '#a8a8a8'; g.lineWidth = 3; g.beginPath(); g.moveTo(-24, 0); g.lineTo(24, 0); for (let k = -16; k <= 16; k += 8) { g.moveTo(k, 0); g.lineTo(k + 6, -8); g.moveTo(k, 0); g.lineTo(k + 6, 8); } g.stroke(); g.restore(); }
    if (kind === 'scallop') { g.lineWidth = 8; g.strokeStyle = '#2c2c2c'; for (let j = 0; j < 4; j++) for (let i = -1; i < 9; i++) { g.beginPath(); g.arc(i * 32 + (j % 2) * 16, j * 64 + 20, 18, 0, Math.PI); g.stroke(); } }
    if (kind === 'rings') { for (let y = 0; y < N; y += 16) { const gr = g.createLinearGradient(0, y, 0, y + 16); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(0.5, '#606060'); gr.addColorStop(1, '#9a9a9a'); g.fillStyle = gr; g.fillRect(0, y, N, 16); } }
    g.filter = 'blur(2px)'; g.drawImage(g.canvas, 0, 0); g.filter = 'none';
  });
  const nm = heightToNormal(c, 5); nm.repeat.set(kind === 'rings' ? 1 : 12, 1);
  // в бороздках темнее — пыль и тень
  const ao = new THREE.CanvasTexture(c); ao.wrapS = ao.wrapT = THREE.RepeatWrapping; ao.repeat.copy(nm.repeat);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, normalMap: nm, normalScale: new THREE.Vector2(1, 1), aoMap: ao, aoMapIntensity: 0.9 });
  patchClay(m); carveCache[key] = m; return m;
}
// неровные «вылепленные» формы + тёплый подсвет по краю (свет проходит сквозь пластилин)
function patchClay(m) {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z); }`);
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
transformed += normal * (n3(position * 2.3) - 0.5) * 0.014 * min(length(position), 5.0);`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float fr = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.2);
totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.75, 0.62) * fr * 0.35;`);
  };
  m.customProgramCacheKey = () => 'clay2';
  return m;
}

const matCache = new Map();
export const clay = (color, rough = 0.82, extra = {}) => {
  const key = color + '|' + rough + '|' + JSON.stringify(extra);
  if (!matCache.has(key)) matCache.set(key, extra.wireframe
    ? new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, ...extra })
    : patchClay(new THREE.MeshStandardMaterial({ color, roughness: Math.max(rough, 0.72), metalness: 0, normalMap: thumbs(), normalScale: new THREE.Vector2(1.1, 1.1), ...extra })));
  return matCache.get(key);
};
export const glow = (color, intensity = 1.6) => clay(color, 0.5, { emissive: color, emissiveIntensity: intensity });

export const mesh = (g, m) => {
  const x = new THREE.Mesh(g, m);
  x.castShadow = true; x.receiveShadow = true;
  return x;
};
export const sphere = (r, m, ws = 20, hs = 14) => mesh(new THREE.SphereGeometry(r, ws, hs), m);

// Остров-«пирог»: тело, полосы, травяной бортик, верх
let carveI = 0;
const PATTERNS = ['leaves', 'dots', 'zigzag', 'scallop'];
export function islandBase({ R = 6, soil = 0xb98a64, band = 0x8e6448, cream = 0xf3e3cf, rim = 0x86b85a, top = 0x86b85a, stripes = null }) {
  const g = new THREE.Group();
  const prof = [[0, -2.6], [R * 0.55, -2.6], [R * 0.86, -2.2], [R * 0.95, -1.5], [R * 0.98, -0.9], [R, -0.35], [R, 0], [R * 0.99, 0.12]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  // резьба: у каждого острова свой штамп по боку, на земле — кольца гончарного круга
  const pat = PATTERNS[carveI++ % PATTERNS.length];
  g.add(mesh(new THREE.LatheGeometry(prof, 72), carved(soil, 'rings')));
  const b = mesh(new THREE.CylinderGeometry(R * 1.005, R * 0.99, 0.7, 72, 1, true), carved(band, pat)); b.position.y = -1.1; g.add(b);
  const c = mesh(new THREE.CylinderGeometry(R * 0.965, R * 0.9, 0.28, 72, 1, true), clay(cream)); c.position.y = -1.85; g.add(c);
  if (stripes) {
    // швы баскетбольного мяча по боку острова
    for (let i = 0; i < 6; i++) {
      const s = mesh(new THREE.CylinderGeometry(R * 1.01, R * 0.9, 2.5, 72, 1, true, (i / 6) * Math.PI * 2, 0.05), clay(stripes));
      s.position.y = -1.25; g.add(s);
    }
  }
  const t = mesh(new THREE.TorusGeometry(R * 0.93, 0.48, 18, 96), clay(rim)); t.rotation.x = Math.PI / 2; t.position.y = 0.18; g.add(t);
  const tp = mesh(new THREE.CircleGeometry(R * 0.95, 72), clay(top)); tp.rotation.x = -Math.PI / 2; tp.position.y = 0.05; g.add(tp);
  return g;
}

export function tree(crown = 0x5f9a46, bark = 0x8a6247, h = 2.2, size = 1) {
  const g = new THREE.Group();
  const tr = mesh(new THREE.CylinderGeometry(0.16, 0.26, h, 10), clay(bark)); tr.position.y = h / 2; g.add(tr);
  for (let i = 0; i < 5; i++) {
    const c = mesh(new THREE.IcosahedronGeometry(0.7 + (i % 2) * 0.2, 1), clay(crown));
    const a = (i / 5) * Math.PI * 2;
    c.position.set(Math.cos(a) * 0.45, h + 0.3 + (i % 3) * 0.25, Math.sin(a) * 0.45);
    g.add(c);
  }
  g.scale.setScalar(size);
  g.userData.sway = Math.random() * 6.3; // качание кроны (life.js)
  return g;
}

export function cone(color = 0x3f7a4a, h = 3, size = 1) {
  const g = new THREE.Group();
  const tr = mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.6, 8), clay(0x7a5338)); tr.position.y = 0.3; g.add(tr);
  for (let i = 0; i < 4; i++) {
    const c = mesh(new THREE.ConeGeometry(1.1 - i * 0.22, 1.1, 10), clay(color)); c.position.y = 0.9 + i * 0.6; g.add(c);
  }
  g.scale.setScalar(size * h / 3);
  g.userData.sway = Math.random() * 6.3;
  return g;
}

export function cloud(scene, x, y, z, s, color = 0xfff7f2) {
  const c = new THREE.Group();
  [[0, 0, 0, 1], [0.9, -0.1, 0.2, 0.75], [-0.9, -0.15, 0, 0.7], [0.3, 0.35, -0.1, 0.65], [-0.4, 0.3, 0.2, 0.55]]
    .forEach(([a, b, d, r]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), clay(color, 0.95)); m.position.set(a, b, d); m.scale.y = 0.8; c.add(m); });
  c.position.set(x, y, z); c.scale.setScalar(s); scene.add(c);
  return c;
}

let shadowTex;
export function contactShadow(R = 7) {
  if (!shadowTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(90,50,60,.4)'); gr.addColorStop(1, 'rgba(90,50,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); shadowTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(R * 2.3, R * 2.3), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = -4.2;
  return m;
}

// Подпись в 3D: HTML-пузырь над точкой (позиция считается в main.js)
export function bubbleAnchor(obj, offsetY = 1) {
  const a = new THREE.Object3D(); a.position.y = offsetY; obj.add(a); return a;
}
