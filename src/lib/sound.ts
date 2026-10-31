// Звуки мира (spec v0.12, по замечаниям дизайнера): всё синтезируется в браузере (Web Audio), файлов и чужих прав нет.
// Играют, только пока звук включён (кнопка ▶ в первой реплике, переключатель слева внизу).
//  • ксилофон по мажорной гамме — при прокрутке и на поющей лестнице «Асфодели»;
//  • фон сцены — свой у каждой планеты, плавно сменяется при перелёте;
//  • звуки действий — всплеск, «чпок» пластилина, шелест бумаги, звон запаха, мяч.
import { audioBus } from "./music";

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
let noiseBuf: AudioBuffer | null = null;
function noise(ctx: AudioContext) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
function env(ctx: AudioContext, out: AudioNode, t: number, a: number, d: number, v: number) {
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0005, t + a + d); g.connect(out); return g;
}
function osc(ctx: AudioContext, type: OscillatorType, f: number, t: number, dur: number, to: AudioNode, f2?: number) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  o.connect(to); o.start(t); o.stop(t + dur + 0.05); return o;
}
function burst(ctx: AudioContext, to: AudioNode, t: number, dur: number, type: BiquadFilterType, f: number, q = 1) {
  const s = ctx.createBufferSource(); s.buffer = noise(ctx); const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  s.connect(fl).connect(to); s.start(t, Math.random()); s.stop(t + dur); return fl;
}

// ксилофон: деревянный удар — основной тон + 4-я гармоника, быстрый спад
export function xylo(step: number, v = 0.12) {
  const b = audioBus(); if (!b) return; const { ctx, out } = b, t = ctx.currentTime;
  const oct = Math.floor(step / 7), n = 72 + oct * 12 + MAJOR[((step % 7) + 7) % 7];
  const g = env(ctx, out, t, 0.004, 0.5, v); osc(ctx, "sine", midi(n), t, 0.5, g);
  const g2 = env(ctx, out, t, 0.002, 0.12, v * 0.4); osc(ctx, "sine", midi(n) * 4, t, 0.12, g2);
}

export type Fx = "plop" | "squish" | "paper" | "chime" | "bounce";
export function fx(name: Fx) {
  const b = audioBus(); if (!b) return; const { ctx, out } = b, t = ctx.currentTime;
  if (name === "plop") { const g = env(ctx, out, t, 0.005, 0.25, 0.22); osc(ctx, "sine", 900, t, 0.22, g, 240); }
  if (name === "squish") { const g = env(ctx, out, t, 0.01, 0.22, 0.18); osc(ctx, "triangle", 260, t, 0.2, g, 140); burst(ctx, env(ctx, out, t, 0.005, 0.12, 0.05), t, 0.15, "lowpass", 700); }
  if (name === "paper") { burst(ctx, env(ctx, out, t, 0.02, 0.28, 0.12), t, 0.32, "bandpass", 3200, 0.8); burst(ctx, env(ctx, out, t + 0.08, 0.02, 0.2, 0.08), t + 0.08, 0.25, "highpass", 5000); }
  if (name === "chime") [0, 4, 7].forEach((k, i) => { const g = env(ctx, out, t + i * 0.07, 0.005, 1.2, 0.07); osc(ctx, "sine", midi(84 + k), t + i * 0.07, 1.2, g); });
  if (name === "bounce") [0, 0.28, 0.48].forEach((d, i) => { const g = env(ctx, out, t + d, 0.003, 0.15, 0.2 / (i + 1)); osc(ctx, "sine", 120, t + d, 0.15, g, 70); });
}

// ---------- фон сцен ----------
type Bed = { gain: GainNode; stop: () => void };
const beds = new Map<string, Bed>();
let zone = "", timers: number[] = [];
const every = (ms: number, jitter: number, fn: () => void) => { const tick = () => { fn(); timers.push(window.setTimeout(tick, ms + Math.random() * jitter)); }; timers.push(window.setTimeout(tick, Math.random() * ms)); };

function makeBed(z: string): Bed | null {
  const b = audioBus(); if (!b) return null; const { ctx, out } = b;
  const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(out);
  const nodes: AudioScheduledSourceNode[] = [];
  const loopNoise = (type: BiquadFilterType, f: number, v: number, q = 0.7, lfo = 0) => {
    const s = ctx.createBufferSource(); s.buffer = noise(ctx); s.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = ctx.createGain(); g.gain.value = v; s.connect(fl).connect(g).connect(gain); s.start(); nodes.push(s);
    if (lfo) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = lfo; lg.gain.value = v * 0.6; l.connect(lg).connect(g.gain); l.start(); nodes.push(l); }
  };
  const chirp = () => { const t = ctx.currentTime; const f = 2600 + Math.random() * 1600; for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) { const g = env(ctx, gain, t + i * 0.11, 0.01, 0.08, 0.05); osc(ctx, "sine", f, t + i * 0.11, 0.08, g, f * 1.25); } };
  const gull = () => { const t = ctx.currentTime; for (let i = 0; i < 2; i++) { const g = env(ctx, gain, t + i * 0.32, 0.03, 0.26, 0.05); const o = osc(ctx, "triangle", 1500, t + i * 0.32, 0.28, g, 900); const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = 28; vg.gain.value = 60; v.connect(vg).connect(o.frequency); v.start(t); v.stop(t + 0.7); } };
  const frog = () => { const t = ctx.currentTime; for (let i = 0; i < 3; i++) { const g = env(ctx, gain, t + i * 0.13, 0.01, 0.09, 0.06); osc(ctx, "square", 140, t + i * 0.13, 0.09, g, 110); } };
  const tick = () => { const t = ctx.currentTime; const g = env(ctx, gain, t, 0.001, 0.03, 0.05); osc(ctx, "square", 2400, t, 0.03, g); };
  const pencil = () => { const t = ctx.currentTime; burst(ctx, env(ctx, gain, t, 0.05, 0.5, 0.04), t, 0.6, "bandpass", 4200, 3); };
  const bell = () => { const t = ctx.currentTime; const n = [84, 88, 91, 95][Math.floor(Math.random() * 4)]; const g = env(ctx, gain, t, 0.005, 1.6, 0.04); osc(ctx, "sine", midi(n), t, 1.6, g); };
  const ball = () => fx("bounce");
  if (z === "intro") { loopNoise("lowpass", 500, 0.05, 0.5, 0.08); every(5200, 4000, gull); }                         // небо: ветер и чайки
  if (z === "kuv") { loopNoise("bandpass", 700, 0.08, 0.6, 0.3); every(3800, 3000, frog); every(7000, 5000, gull); }  // пруд: вода, лягушки, чайки
  if (z === "dub") { loopNoise("lowpass", 260, 0.12, 0.4); every(6000, 5000, chirp); every(9000, 6000, ball); }       // двор: гул улицы, воробьи, мяч
  if (z === "fan") { loopNoise("bandpass", 1500, 0.07, 0.5, 0.5); every(2200, 2500, chirp); }                         // деревня: речка и птицы
  if (z === "asf" || z === "gate") { loopNoise("lowpass", 380, 0.08, 0.5, 0.06); every(3000, 3500, bell); }           // ночь: ветер, колокольчики
  if (z === "home") { loopNoise("lowpass", 180, 0.04, 0.4); every(1000, 0, tick); every(6000, 5000, pencil); }        // дом: тишина, часы, карандаш
  return { gain, stop: () => { nodes.forEach((n) => { try { n.stop(); } catch { /* уже остановлен */ } }); gain.disconnect(); } };
}

// сменить фон: старый плавно гаснет, новый плавно появляется
export function setScene(z: string) {
  const b = audioBus();
  if (!b) { if (beds.size) { timers.forEach(clearTimeout); timers = []; beds.forEach((x) => x.stop()); beds.clear(); } zone = ""; return; }
  if (z === zone) return; zone = z;
  const { ctx } = b, t = ctx.currentTime;
  timers.forEach(clearTimeout); timers = [];
  beds.forEach((x, k) => { x.gain.gain.cancelScheduledValues(t); x.gain.gain.setValueAtTime(x.gain.gain.value, t); x.gain.gain.linearRampToValueAtTime(0, t + 1.2); setTimeout(() => { x.stop(); beds.delete(k); }, 1400); });
  const nb = makeBed(z); if (!nb) return;
  nb.gain.gain.linearRampToValueAtTime(0.9, t + 1.5); beds.set(z + ":" + t, nb);
}
