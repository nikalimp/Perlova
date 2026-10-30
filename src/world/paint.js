// @ts-nocheck — «акварель и карандаш» поверх 3D (spec v0.4, задача A4)
// Сцена рисуется в текстуру с глубиной, затем один полноэкранный проход:
//   1. дрожание краёв — линии «от руки»;
//   2. растекание пигмента — цвет смешивается с соседями, у границ темнеет;
//   3. зерно и пятна бумаги;
//   4. карандашный контур по скачкам глубины и цвета;
//   5. штриховка в тенях.
// Тон-маппинг и перевод в sRGB — здесь же (рендер в текстуру их не делает).
import * as THREE from 'three';

const frag = /* glsl */ `
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

void main() {
  vec2 fc = vUv * res;
  vec2 e = vec2(px) / res;
  // 1. дрожание: линии и края чуть «плывут», как у руки
  vec2 wob = (vec2(fbm(fc / (70.0 * px)), fbm(fc / (70.0 * px) + 17.3)) - 0.5) * e * 3.0;
  vec2 uv = vUv + wob;

  vec4 base = texture2D(tColor, uv);
  float a = base.a;
  vec3 col = base.rgb;

  // 2. пигмент: размытие по кругу 3px и подтёк у границ
  vec3 blur = (texture2D(tColor, uv + vec2(3.0, 0.0) * e).rgb + texture2D(tColor, uv - vec2(3.0, 0.0) * e).rgb
             + texture2D(tColor, uv + vec2(0.0, 3.0) * e).rgb + texture2D(tColor, uv - vec2(0.0, 3.0) * e).rgb) * 0.25;
  col = mix(col, blur, 0.35);
  float bleed = clamp(length(col - blur) * 3.0, 0.0, 1.0);
  col *= 1.0 - bleed * 0.18;

  // 3. бумага: крупные пятна размыва и мелкое зерно; акварель прозрачная — цвета чуть светлее
  float wash = fbm(fc / (220.0 * px));
  float grain = fbm(fc / (2.2 * px));
  col *= 0.9 + 0.2 * wash;
  col *= 0.94 + 0.12 * grain;
  float L = lum(col);
  col = mix(col, vec3(L), 0.06) * 0.92 + 0.035;

  // 4. карандаш: скачки глубины (силуэты) и цвета (внутренние линии)
  float d = depthAt(uv);
  float dl = depthAt(uv - vec2(e.x, 0.0)), dr = depthAt(uv + vec2(e.x, 0.0)), du = depthAt(uv + vec2(0.0, e.y)), dd = depthAt(uv - vec2(0.0, e.y));
  float edgeD = smoothstep(0.01, 0.045, abs(dl + dr + du + dd - 4.0 * d) / max(d, 0.001));
  float cl = lum(texture2D(tColor, uv - vec2(e.x, 0.0)).rgb), cr = lum(texture2D(tColor, uv + vec2(e.x, 0.0)).rgb);
  float cu = lum(texture2D(tColor, uv + vec2(0.0, e.y)).rgb), cd = lum(texture2D(tColor, uv - vec2(0.0, e.y)).rgb);
  float edgeC = smoothstep(0.04, 0.16, length(vec2(cr - cl, cu - cd)));
  float stroke = 0.55 + 0.45 * noise(fc / (2.5 * px));            // штрих неровный, с разрывами
  float edge = max(edgeD, edgeC * 0.55) * stroke;
  vec3 pencil = mix(vec3(0.24, 0.19, 0.27), vec3(0.12, 0.13, 0.26), night);
  col = mix(col, pencil, edge * 0.85);

  // 5. штриховка в тенях — диагональ, гуще, где темнее
  float hatch = step(0.55, fract((gl_FragCoord.x + gl_FragCoord.y) / (5.0 * px)));
  float shade = smoothstep(0.32, 0.08, L) * (0.6 + 0.4 * noise(fc / (8.0 * px)));
  col *= 1.0 - hatch * shade * 0.22 * (1.0 - night * 0.6);

  // силуэтная линия видна и на фоне (прозрачная часть холста — небо из CSS)
  float alpha = max(a, edgeD * stroke * 0.7);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor = vec4(gl_FragColor.rgb * alpha, alpha);
}`;

export function createPainter(renderer, mobile) {
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: mobile ? 0 : 4 });
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
