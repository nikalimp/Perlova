// @ts-nocheck — «Пластилин 2.0» поверх 3D (spec v0.5, задача P3)
// Сцена рисуется в текстуру с глубиной, затем один полноэкранный проход:
//   1. мягкая тень в щелях и под предметами (AO по глубине);
//   2. макро-объектив: резко в середине, размыто вне фокуса, сверху и снизу кадра;
//   3. тёплая плёнка, мягкий контраст, зерно, виньетка.
// На телефоне — облегчённый режим (LITE): тень по 6 точкам, размытие без расчёта фокуса.
import * as THREE from 'three';

const head = /* glsl */ `
#include <packing>
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 res;
uniform float px;
uniform float near;
uniform float far;
uniform float night;
uniform float focus;
uniform vec3 tint;   // цветовая «погода» планеты (spec v0.13)
uniform vec3 haze;   // цвет воздушной дымки (туман сцены, экранные цвета)
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


const body = /* glsl */ `
  // «Пластилин 2.0»: мягкое затенение в щелях (AO), макро-объектив (размытие вне фокуса), цвет фотографии
  vec2 fc = vUv * res; vec2 e = vec2(px) / res;
  float d = depthAt(vUv);
  vec4 b = texture2D(tColor, vUv);
  vec3 col = b.rgb; float a = b.a;
  // AO по глубине: точки по спирали (12, на телефоне 6), радиус меньше для далёких предметов
  float occ = 0.0; float rr = clamp(70.0 / d, 3.0, 26.0);
  for (int i = 0; i < AO_N; i++) {
    float fi = float(i); float ang = fi * 2.39996; float rad = rr * sqrt((fi + 0.5) / float(AO_N));
    float ds = depthAt(vUv + vec2(cos(ang), sin(ang)) * rad * e);
    float diff = d - ds;
    occ += clamp(diff / (0.08 + 0.015 * d), 0.0, 1.0) * (1.0 - smoothstep(0.4 + 0.03 * d, 1.5 + 0.08 * d, diff));
  }
  col *= 1.0 - 0.55 * occ / float(AO_N);
  // макро: резко в середине кадра, мягко сверху, снизу и вдали — как фото миниатюры
#ifdef LITE
  float coc = smoothstep(0.14, 0.5, abs(vUv.y - 0.5));   // телефон: только размытие сверху и снизу (миниатюра)
#else
  float fd = focus;                                   // фокус — на точке, куда смотрит камера (текущая планета)
  float coc = clamp(abs(d - fd) / fd * 1.6, 0.0, 1.0);
  // эффект миниатюры (тилт-шифт, spec v0.13): резкая только средняя полоса кадра, верх и низ сильно размыты
  coc = max(coc * 0.7, smoothstep(0.14, 0.5, abs(vUv.y - 0.5)));
#endif
  if (a < 0.01) coc = max(coc, 0.6);
  vec4 acc = vec4(col * a, a); float wsum = 1.0;
  for (int i = 0; i < DOF_N; i++) {
    float fi = float(i); float ang = fi * 2.39996; float rad = 9.0 * coc * sqrt((fi + 0.5) / float(DOF_N));
    vec4 sm = texture2D(tColor, vUv + vec2(cos(ang), sin(ang)) * rad * e);
    acc += vec4(sm.rgb * sm.a, sm.a); wsum += 1.0;
  }
  acc /= wsum; a = acc.a; col = a > 0.001 ? acc.rgb / a : col;
  vec3 o = disp(col);
  o *= vec3(1.035, 1.0, 0.955) * tint;                // тёплая плёнка и палитра планеты
  // воздушная перспектива: дальнее растворяется в цвете неба — глубина читается сильнее
  float far = smoothstep(focus * 1.5, focus * 4.5, d) * step(0.01, b.a);
  o = mix(o, haze, far * 0.38);
  o = mix(o, smoothstep(0.0, 1.0, o), 0.25);            // мягкий контраст
  o = mix(vec3(dot(o, vec3(0.299, 0.587, 0.114))), o, 1.1); // чуть насыщеннее — как фото игрушечного макета
  o += (hash(fc + 0.37) - 0.5) * 0.045;                 // зерно плёнки
  vec2 q = vUv - 0.5; float v = smoothstep(0.35, 0.85, length(q * vec2(1.0, 1.25))) * 0.32;
  gl_FragColor = vec4(o * a * (1.0 - v), a + (1.0 - a) * v);`;

export function createPainter(renderer, mobile) {
  const defs = mobile ? '#define LITE\n#define AO_N 6\n#define DOF_N 8\n' : '#define AO_N 8\n#define DOF_N 12\n';
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: mobile ? 0 : 2 });
  rt.depthTexture = new THREE.DepthTexture(1, 1);
  rt.depthTexture.type = THREE.UnsignedIntType;
  const mat = new THREE.ShaderMaterial({
    uniforms: { tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, res: { value: new THREE.Vector2(1, 1) }, px: { value: 1 }, near: { value: 0.1 }, far: { value: 400 }, night: { value: 0 }, focus: { value: 20 }, tint: { value: new THREE.Color(1, 1, 1) }, haze: { value: new THREE.Color(1, 0.9, 0.9) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: defs + head + 'void main() {' + body + '\n}',
    transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false, toneMapped: true,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false;
  const qs = new THREE.Scene(); qs.add(quad);
  const qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  renderer.setClearColor(0x000000, 0);
  return {
    setSize(w, h, pr) { rt.setSize(Math.round(w * pr), Math.round(h * pr)); mat.uniforms.res.value.set(Math.round(w * pr), Math.round(h * pr)); mat.uniforms.px.value = pr; },
    render(scene, camera, night, focus = 20, tint, haze) {
      if (tint) mat.uniforms.tint.value.copy(tint); if (haze) mat.uniforms.haze.value.copy(haze);
      mat.uniforms.near.value = camera.near; mat.uniforms.far.value = camera.far; mat.uniforms.night.value = night; mat.uniforms.focus.value = focus;
      renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.clear(); renderer.render(qs, qc);
    },
    dispose() { rt.dispose(); mat.dispose(); },
  };
}
