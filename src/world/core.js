// @ts-nocheck — модули мира перенесены из прототипа (specs/prototypes/world-src), типизация не нужна
import * as THREE from 'three';

export { THREE };

const matCache = new Map();
export const clay = (color, rough = 0.82, extra = {}) => {
  const key = color + '|' + rough + '|' + JSON.stringify(extra);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, ...extra }));
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
export function islandBase({ R = 6, soil = 0xb98a64, band = 0x8e6448, cream = 0xf3e3cf, rim = 0x86b85a, top = 0x86b85a, stripes = null }) {
  const g = new THREE.Group();
  const prof = [[0, -2.6], [R * 0.55, -2.6], [R * 0.86, -2.2], [R * 0.95, -1.5], [R * 0.98, -0.9], [R, -0.35], [R, 0], [R * 0.99, 0.12]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  g.add(mesh(new THREE.LatheGeometry(prof, 72), clay(soil)));
  const b = mesh(new THREE.CylinderGeometry(R * 1.005, R * 0.99, 0.35, 72, 1, true), clay(band)); b.position.y = -1.1; g.add(b);
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
  return g;
}

export function cone(color = 0x3f7a4a, h = 3, size = 1) {
  const g = new THREE.Group();
  const tr = mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.6, 8), clay(0x7a5338)); tr.position.y = 0.3; g.add(tr);
  for (let i = 0; i < 4; i++) {
    const c = mesh(new THREE.ConeGeometry(1.1 - i * 0.22, 1.1, 10), clay(color)); c.position.y = 0.9 + i * 0.6; g.add(c);
  }
  g.scale.setScalar(size * h / 3);
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
