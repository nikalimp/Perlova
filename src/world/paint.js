// @ts-nocheck — постобработка мира. ЛАБОРАТОРИЯ СТИЛЕЙ: ветка lab/styles, не для main.
// Стиль берётся из ?style=… (см. core.js). У каждого стиля свой фрагментный шейдер.
import * as THREE from 'three';
import { STYLE, LVL } from './core.js';

const head = /* glsl */ `
#include <packing>
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 res;
uniform float px;
uniform float near;
uniform float far;
uniform float night;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
float depthAt(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, near, far); }
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
// линейный HDR -> экранный sRGB вручную (стили работают с «видимым» цветом)
vec3 disp(vec3 c) { return sRGBTransferOETF(vec4(toneMapping(c), 1.0)).rgb; }
vec4 S(vec2 uv) { vec4 b = texture2D(tColor, uv); return vec4(disp(b.rgb), b.a); }
float edgeD(vec2 uv, vec2 e) {
  float d = depthAt(uv);
  float s = depthAt(uv - vec2(e.x, 0.0)) + depthAt(uv + vec2(e.x, 0.0)) + depthAt(uv + vec2(0.0, e.y)) + depthAt(uv - vec2(0.0, e.y));
  return abs(s - 4.0 * d) / max(d, 0.001);
}
float edgeC(vec2 uv, vec2 e) {
  float cl = lum(S(uv - vec2(e.x, 0.0)).rgb), cr = lum(S(uv + vec2(e.x, 0.0)).rgb);
  float cu = lum(S(uv + vec2(0.0, e.y)).rgb), cd = lum(S(uv - vec2(0.0, e.y)).rgb);
  return length(vec2(cr - cl, cu - cd));
}
#define OUT(c, a) gl_FragColor = vec4((c) * (a), (a))
`;

const bodies = {
  // как сейчас на сайте
  watercolor: `
  vec2 fc = vUv * res; vec2 e = vec2(px) / res;
  vec2 wob = (vec2(fbm(fc / (70.0 * px)), fbm(fc / (70.0 * px) + 17.3)) - 0.5) * e * 3.0;
  vec2 uv = vUv + wob;
  vec4 base = texture2D(tColor, uv); float a = base.a; vec3 col = base.rgb;
  vec3 blur = (texture2D(tColor, uv + vec2(3.0, 0.0) * e).rgb + texture2D(tColor, uv - vec2(3.0, 0.0) * e).rgb
             + texture2D(tColor, uv + vec2(0.0, 3.0) * e).rgb + texture2D(tColor, uv - vec2(0.0, 3.0) * e).rgb) * 0.25;
  col = mix(col, blur, 0.35);
  col *= 1.0 - clamp(length(col - blur) * 3.0, 0.0, 1.0) * 0.18;
  col *= 0.9 + 0.2 * fbm(fc / (220.0 * px)); col *= 0.94 + 0.12 * fbm(fc / (2.2 * px));
  float L = lum(col); col = mix(col, vec3(L), 0.06) * 0.92 + 0.035;
  float ed = smoothstep(0.01, 0.045, edgeD(uv, e));
  float cl = lum(texture2D(tColor, uv - vec2(e.x, 0.0)).rgb), cr = lum(texture2D(tColor, uv + vec2(e.x, 0.0)).rgb);
  float cu = lum(texture2D(tColor, uv + vec2(0.0, e.y)).rgb), cd = lum(texture2D(tColor, uv - vec2(0.0, e.y)).rgb);
  float ec = smoothstep(0.04, 0.16, length(vec2(cr - cl, cu - cd)));
  float stroke = 0.55 + 0.45 * noise(fc / (2.5 * px));
  float edge = max(ed, ec * 0.55) * stroke;
  col = mix(col, mix(vec3(0.24, 0.19, 0.27), vec3(0.12, 0.13, 0.26), night), edge * 0.85);
  float hatch = step(0.55, fract((gl_FragCoord.x + gl_FragCoord.y) / (5.0 * px)));
  col *= 1.0 - hatch * smoothstep(0.32, 0.08, L) * (0.6 + 0.4 * noise(fc / (8.0 * px))) * 0.22 * (1.0 - night * 0.6);
  float alpha = max(a, ed * stroke * 0.7);
  vec3 o = disp(col); OUT(o, alpha);`,

  // чистый 3D-пластилин, без постобработки (как было до акварели)
  clay: `vec4 b = S(vUv); OUT(b.rgb, b.a);`,

  clay2: `
  // «Пластилин 2.0»: мягкое затенение в щелях (AO), макро-объектив (размытие вне фокуса), цвет фотографии
  vec2 fc = vUv * res; vec2 e = vec2(px) / res;
  float d = depthAt(vUv);
  vec4 b = texture2D(tColor, vUv);
  vec3 col = b.rgb; float a = b.a;
#if LVL >= 4
  // AO по глубине: 12 точек по спирали, радиус меньше для далёких предметов
  float occ = 0.0; float rr = clamp(70.0 / d, 3.0, 26.0);
  for (int i = 0; i < 12; i++) {
    float fi = float(i); float ang = fi * 2.39996; float rad = rr * sqrt((fi + 0.5) / 12.0);
    float ds = depthAt(vUv + vec2(cos(ang), sin(ang)) * rad * e);
    float diff = d - ds;
    occ += clamp(diff / (0.08 + 0.015 * d), 0.0, 1.0) * (1.0 - smoothstep(0.4 + 0.03 * d, 1.5 + 0.08 * d, diff));
  }
  col *= 1.0 - 0.55 * occ / 12.0;
#endif
#if LVL >= 5
  // макро: резко в середине кадра, мягко сверху, снизу и вдали — как фото миниатюры
  float fd = min(depthAt(vec2(0.5, 0.46)), 80.0);
  float coc = clamp(abs(d - fd) / fd * 1.6, 0.0, 1.0);
  coc = max(coc * 0.8, smoothstep(0.32, 0.5, abs(vUv.y - 0.48)) * 0.7);
  if (a < 0.01) coc = max(coc, 0.6);
  vec4 acc = vec4(col * a, a); float wsum = 1.0;
  for (int i = 0; i < 16; i++) {
    float fi = float(i); float ang = fi * 2.39996; float rad = 6.5 * coc * sqrt((fi + 0.5) / 16.0);
    vec4 sm = texture2D(tColor, vUv + vec2(cos(ang), sin(ang)) * rad * e);
    acc += vec4(sm.rgb * sm.a, sm.a); wsum += 1.0;
  }
  acc /= wsum; a = acc.a; col = a > 0.001 ? acc.rgb / a : col;
#endif
  vec3 o = disp(col);
#if LVL >= 5
  o *= vec3(1.035, 1.0, 0.955);                       // тёплая плёнка
  o = mix(o, smoothstep(0.0, 1.0, o), 0.25);            // мягкий контраст
  o += (hash(fc + 0.37) - 0.5) * 0.045;                 // зерно плёнки
  vec2 q = vUv - 0.5; float v = smoothstep(0.35, 0.85, length(q * vec2(1.0, 1.25))) * 0.32;
  gl_FragColor = vec4(o * a * (1.0 - v), a + (1.0 - a) * v);
#else
  OUT(o, a);
#endif`,

  // плоские пастельные грани — «Monument Valley»
  lowpoly: `vec4 b = S(vUv); OUT(b.rgb, b.a);`,

  // мультфильм: 3 ступени света (материал) + толстый чернильный контур
  toon: `
  vec2 e = vec2(px * 1.6) / res; vec4 b = S(vUv);
  vec3 col = mix(vec3(lum(b.rgb)), b.rgb, 1.15);
  float edge = max(smoothstep(0.015, 0.04, edgeD(vUv, e)), smoothstep(0.12, 0.3, edgeC(vUv, e)));
  col = mix(col, vec3(0.16, 0.11, 0.2), edge);
  OUT(col, max(b.a, edge));`,

  // гуашь / масло: фильтр Кувахары — мазки плоскими пятнами, холст
  gouache: `
  vec2 fc = vUv * res; vec2 e = vec2(px * 1.4) / res;
  vec3 m[4]; vec3 s[4];
  for (int k = 0; k < 4; k++) { m[k] = vec3(0.0); s[k] = vec3(0.0); }
  for (int j = 0; j <= 4; j++) for (int i = 0; i <= 4; i++) {
    vec3 c;
    c = S(vUv + vec2(-i, -j) * e).rgb; m[0] += c; s[0] += c * c;
    c = S(vUv + vec2( i, -j) * e).rgb; m[1] += c; s[1] += c * c;
    c = S(vUv + vec2(-i,  j) * e).rgb; m[2] += c; s[2] += c * c;
    c = S(vUv + vec2( i,  j) * e).rgb; m[3] += c; s[3] += c * c;
  }
  vec3 col = vec3(0.0); float best = 1e9;
  for (int k = 0; k < 4; k++) { vec3 mu = m[k] / 25.0; vec3 v = abs(s[k] / 25.0 - mu * mu); float sv = v.r + v.g + v.b; if (sv < best) { best = sv; col = mu; } }
  float canvas = 0.5 + 0.25 * sin(fc.x / px * 1.9) * sin(fc.y / px * 1.9) + 0.25 * fbm(fc / (3.0 * px));
  col *= 0.93 + 0.12 * canvas;
  col = mix(vec3(lum(col)), col, 1.12);
  float a = S(vUv).a; float a2 = 0.0;
  for (int k = 0; k < 4; k++) a2 += S(vUv + vec2(k == 0 ? 2.0 : k == 1 ? -2.0 : 0.0, k == 2 ? 2.0 : k == 3 ? -2.0 : 0.0) * e).a;
  OUT(col, max(a, a2 * 0.25));`,

  // цветные карандаши: штрихи по диагонали, бумага просвечивает, графитовый контур
  pencil: `
  vec2 fc = vUv * res; vec2 e = vec2(px) / res;
  vec2 w = (vec2(noise(fc / (30.0 * px)), noise(fc / (30.0 * px) + 9.1)) - 0.5) * e * 2.0;
  vec4 b = S(vUv + w);
  vec3 paperC = vec3(0.985, 0.965, 0.93);
  float dark = 1.0 - lum(b.rgb);
  // штрих: длинные полосы вдоль диагонали, плотнее где темнее
  float st1 = noise(vec2((fc.x + fc.y) / (1.3 * px), (fc.x - fc.y) / (28.0 * px)));
  float st2 = noise(vec2((fc.x - fc.y * 0.4) / (1.3 * px), (fc.y + fc.x * 0.4) / (28.0 * px)) + 31.0);
  float cover = smoothstep(0.15, 0.75, st1 + dark * 0.55) * 0.75 + smoothstep(0.55, 0.95, st2 + dark * 0.45) * 0.35;
  cover = clamp(cover * (0.75 + 0.35 * fbm(fc / (2.0 * px))), 0.0, 1.0);
  vec3 col = mix(paperC, mix(vec3(lum(b.rgb)), b.rgb, 1.25), cover);
  float edge = max(smoothstep(0.01, 0.05, edgeD(vUv + w, e)), smoothstep(0.08, 0.25, edgeC(vUv + w, e)) * 0.6);
  edge *= 0.5 + 0.5 * noise(fc / (1.5 * px));
  col = mix(col, vec3(0.28, 0.27, 0.3), edge * 0.8);
  OUT(col, max(b.a, edge * 0.8));`,

  // ризограф: три краски точками растра, сдвиг слоёв, зерно
  riso: `
  vec2 fc = vUv * res;
  vec3 paperC = vec3(0.97, 0.95, 0.9);
  vec3 pink = vec3(1.0, 0.28, 0.55), blue = vec3(0.0, 0.47, 0.75), yel = vec3(1.0, 0.86, 0.1);
  vec2 off1 = vec2(1.5, -1.0) * px / res, off2 = vec2(-1.0, 1.5) * px / res;
  vec4 c0 = S(vUv), c1 = S(vUv + off1), c2 = S(vUv + off2);
  float kP = clamp(1.0 - c1.g * 1.05, 0.0, 1.0) * c1.a;
  float kB = clamp(1.0 - c0.r * 1.05, 0.0, 1.0) * c0.a;
  float kY = clamp(1.0 - c2.b * 1.05, 0.0, 1.0) * c2.a;
  float cell = 4.0 * px;
  mat2 r1 = mat2(0.966, -0.259, 0.259, 0.966), r2 = mat2(0.707, -0.707, 0.707, 0.707), r3 = mat2(0.259, -0.966, 0.966, 0.259);
  float g = 0.12 * (hash(fc) - 0.5);
  float dP = step(length(fract(r1 * fc / cell) - 0.5), sqrt(kP) * 0.62 + g);
  float dB = step(length(fract(r2 * fc / cell) - 0.5), sqrt(kB) * 0.62 + g);
  float dY = step(length(fract(r3 * fc / cell) - 0.5), sqrt(kY) * 0.62 + g);
  vec3 col = paperC;
  col *= mix(vec3(1.0), pink, dP * 0.9);
  col *= mix(vec3(1.0), blue, dB * 0.85);
  col *= mix(vec3(1.0), yel, dY * 0.9);
  col *= 0.96 + 0.06 * fbm(fc / (6.0 * px));
  float a = max(c0.a, max(c1.a, c2.a));
  OUT(col, a);`,

  // тушь и сепия: старая книжная иллюстрация — контур пером, размывка, штриховка
  ink: `
  vec2 fc = vUv * res; vec2 e = vec2(px * 1.2) / res;
  vec4 b = S(vUv);
  vec3 paperC = vec3(0.96, 0.92, 0.84), sep = vec3(0.45, 0.32, 0.22), inkC = vec3(0.13, 0.1, 0.09);
  float L = lum(b.rgb) + (fbm(fc / (40.0 * px)) - 0.5) * 0.12;
  float wash = 1.0 - (floor(L * 4.0 + 0.5) / 4.0);
  vec3 col = mix(paperC, mix(paperC, sep, 0.55), wash * 0.8);
  float h1 = step(0.6, fract((fc.x + fc.y) / (4.0 * px))), h2 = step(0.6, fract((fc.x - fc.y) / (4.0 * px)));
  col = mix(col, inkC, h1 * smoothstep(0.45, 0.25, L) * 0.7);
  col = mix(col, inkC, h2 * smoothstep(0.28, 0.12, L) * 0.7);
  float edge = max(smoothstep(0.012, 0.04, edgeD(vUv, e)), smoothstep(0.1, 0.25, edgeC(vUv, e)) * 0.8);
  edge *= 0.6 + 0.4 * noise(fc / (6.0 * px));
  col = mix(col, inkC, edge);
  OUT(col, max(b.a, edge));`,

  // аппликация из бумаги: плоские цвета, тень от слоя ниже, волокна
  cutout: `
  vec2 fc = vUv * res; vec2 e = vec2(px) / res;
  vec2 w = (vec2(noise(fc / (14.0 * px)), noise(fc / (14.0 * px) + 4.2)) - 0.5) * e * 2.5;
  vec4 b = S(vUv + w);
  vec3 col = b.rgb;
  float L = lum(col); float Lq = floor(L * 5.0 + 0.5) / 5.0;
  col = clamp(col * (Lq / max(L, 0.001)), 0.0, 1.0);
  col = mix(vec3(lum(col)), col, 1.15);
  // тень: если пиксель чуть выше-левее заметно ближе — на нас падает тень от слоя сверху
  float d = depthAt(vUv + w), dn = depthAt(vUv + w + vec2(-5.0, 6.0) * e);
  float sh = smoothstep(0.03, 0.08, (d - dn) / d);
  float bgShadow = texture2D(tColor, vUv + w + vec2(-5.0, 6.0) * e).a * (1.0 - b.a);
  col *= 1.0 - sh * 0.28;
  col *= 0.95 + 0.08 * fbm(fc / (1.5 * px)) + 0.04 * noise(vec2(fc.x / (0.6 * px), fc.y / (12.0 * px)));
  float rim = smoothstep(0.02, 0.06, edgeD(vUv + w, e));
  col = mix(col, vec3(1.0, 0.99, 0.96), rim * 0.6);
  float a = max(b.a, bgShadow * 0.3);
  vec3 o = b.a > 0.5 ? col : vec3(0.25, 0.15, 0.2);
  OUT(o, a);`,

  // пиксель-арт: крупные пиксели, ограниченная палитра, дизеринг
  pixel: `
  float blk = 5.0 * px;
  vec2 fc = vUv * res;
  vec2 cellC = (floor(fc / blk) + 0.5) * blk;
  vec4 b = S(cellC / res);
  mat4 bayer = mat4(0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  vec2 bc = mod(floor(fc / blk), 4.0);
  float th = bayer[int(bc.x)][int(bc.y)] / 16.0 - 0.5;
  vec3 col = floor(b.rgb * 5.0 + th + 0.5) / 5.0;
  col = mix(vec3(lum(col)), col, 1.1);
  OUT(col, step(0.5, b.a));`,

  // вышивка крестиком: каждая клетка — стежок «X» нитками, канва между клетками
  stitch: `
  float blk = 7.0 * px;
  vec2 fc = vUv * res;
  vec2 id = floor(fc / blk); vec2 f = fract(fc / blk) - 0.5;
  vec4 b = S((id + 0.5) * blk / res);
  vec3 thread = floor(b.rgb * 6.0 + 0.5) / 6.0;
  thread = mix(vec3(lum(thread)), thread, 1.3);
  float w = 0.21;
  float d1 = abs(f.x - f.y) / 1.414, d2 = abs(f.x + f.y) / 1.414;
  float inBox = step(max(abs(f.x), abs(f.y)), 0.46);
  float s2 = smoothstep(w, w * 0.5, d2) * inBox, s1 = smoothstep(w, w * 0.5, d1) * inBox;
  float twist = 0.82 + 0.18 * sin((f.x + f.y) * 38.0);
  float twist2 = 0.82 + 0.18 * sin((f.x - f.y) * 38.0);
  vec3 fabric = vec3(0.95, 0.93, 0.87);
  vec3 col = mix(fabric, thread, 0.3) * (0.9 + 0.1 * step(0.5, fract(fc.x / (blk / 3.0))));
  col = mix(col, thread * twist * 0.8, s1);
  col = mix(col, thread * twist2, s2);
  float a = step(0.5, b.a);
  OUT(col, a);`,
};

const frag = '#define LVL ' + LVL + '\n' + head + 'void main() {\n' + (bodies[STYLE] || bodies.watercolor) + '\n}';

export function createPainter(renderer, mobile) {
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: STYLE === 'clay2' ? 4 : mobile || STYLE === 'pixel' || STYLE === 'stitch' ? 0 : 4 });
  rt.depthTexture = new THREE.DepthTexture(1, 1);
  rt.depthTexture.type = THREE.UnsignedIntType;
  const mat = new THREE.ShaderMaterial({
    uniforms: { tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, res: { value: new THREE.Vector2(1, 1) }, px: { value: 1 }, near: { value: 0.1 }, far: { value: 400 }, night: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: frag,
    transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false, toneMapped: true,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false;
  const qs = new THREE.Scene(); qs.add(quad);
  const qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  renderer.setClearColor(0x000000, 0);
  return {
    setSize(w, h, pr) { rt.setSize(Math.round(w * pr), Math.round(h * pr)); mat.uniforms.res.value.set(Math.round(w * pr), Math.round(h * pr)); mat.uniforms.px.value = pr; },
    render(scene, camera, night) {
      mat.uniforms.near.value = camera.near; mat.uniforms.far.value = camera.far; mat.uniforms.night.value = night;
      renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.clear(); renderer.render(qs, qc);
    },
    dispose() { rt.dispose(); mat.dispose(); },
  };
}
