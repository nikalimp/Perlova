// Фоновая музыка сайта (spec v0.8): своя колыбельная «музыкальная шкатулка», синтез в браузере (Web Audio).
// Файла нет, прав третьих лиц нет. Включается только по нажатию (браузеры не дают звуку играть самому).
// Гармония: C — Am — F — G (I–vi–IV–V), 72 удара в минуту; мелодия — из пентатоники по аккорду, повтор каждые 8 тактов.

type Listener = (on: boolean) => void;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer = 0;
let playing = false;
let started = false; // музыку уже включали — в углу виден переключатель звука
let nextT = 0;
let step = 0;
const listeners = new Set<Listener>();

const BPM = 72, BEAT = 60 / BPM, EIGHTH = BEAT / 2;
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
// аккорды по тактам (корень, терция, квинта) и ноты мелодии для каждого такта — 8 восьмых, null — пауза
const CHORDS = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50], [48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]];
const MELODY: (number | null)[][] = [
  [76, null, 79, null, 81, 79, 76, null], [72, null, 76, null, 74, 72, 69, null],
  [72, null, 74, 76, 77, null, 76, 74], [74, null, 71, null, 74, 76, 79, null],
  [79, null, 81, 79, 76, null, 79, null], [76, 74, 72, null, 69, null, 72, null],
  [77, null, 76, 74, 72, null, 74, null], [71, null, 74, null, 72, null, null, null],
];

function bell(t: number, n: number, v: number) {
  if (!ctx || !master) return;
  const f = midi(n), g = ctx.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0008, t + 2.4);
  // шкатулка: основной тон + звонкие обертоны
  ([[1, 1], [2.76, 0.35], [5.4, 0.12]] as const).forEach(([k, a]) => {
    const o = ctx!.createOscillator(), og = ctx!.createGain();
    o.type = "sine"; o.frequency.value = f * k; og.gain.value = a;
    o.connect(og).connect(g); o.start(t); o.stop(t + 2.5);
  });
  g.connect(master);
}
function pad(t: number, notes: number[], dur: number) {
  if (!ctx || !master) return;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.8); g.gain.setValueAtTime(0.05, t + dur - 0.8); g.gain.linearRampToValueAtTime(0, t + dur + 0.4);
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
  notes.forEach((n, i) => [-4, 4].forEach((det) => {
    const o = ctx!.createOscillator(); o.type = i ? "sine" : "triangle"; o.frequency.value = midi(n); o.detune.value = det;
    o.connect(lp); o.start(t); o.stop(t + dur + 0.5);
  }));
  lp.connect(g).connect(master);
}
// планировщик: заранее ставит ноты на 0,6 с вперёд
function schedule() {
  if (!ctx) return;
  while (nextT < ctx.currentTime + 0.6) {
    const bar = Math.floor(step / 8) % 8, e = step % 8;
    if (e === 0) pad(nextT, CHORDS[bar], BEAT * 4);
    const n = MELODY[bar][e];
    if (n !== null) bell(nextT, n, e % 2 ? 0.07 : 0.1);
    if (e === 4) bell(nextT, CHORDS[bar][0] + 24, 0.035); // тихий отзвук аккорда
    nextT += EIGHTH; step++;
  }
}

export function isMusicOn() { return playing; }
export function wasMusicStarted() { return started; }
export function onMusic(fn: Listener) { listeners.add(fn); return () => { listeners.delete(fn); }; }
const emit = () => listeners.forEach((fn) => fn(playing));

export async function setMusic(on: boolean) {
  if (on === playing) return;
  if (on) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination); }
    await ctx.resume();
    master!.gain.cancelScheduledValues(ctx.currentTime); master!.gain.setValueAtTime(master!.gain.value, ctx.currentTime);
    master!.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 2.5); // мягкое появление
    nextT = ctx.currentTime + 0.1; step = 0;
    schedule(); timer = window.setInterval(schedule, 200);
    playing = true; started = true;
  } else if (ctx && master) {
    const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(0, t + 1);
    window.clearInterval(timer); playing = false;
    setTimeout(() => { if (!playing) ctx?.suspend(); }, 1200);
  }
  emit();
}
