/**
 * Tiny synthesized sounds (no audio files): the guinea pig's "wheek" and game tones.
 * Everything goes through one soft master bus (a gentle compressor and a little
 * room reverb) and every sound is pitched a hair differently each time, so the
 * same tap never sounds machine-repeated.
 */
let ctx: AudioContext | null = null;
let bus: AudioNode | null = null;
let enabled = true;

export const setSoundOn = (on: boolean) => {
  enabled = on;
};

function audio() {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    bus ??= master(ctx);
    return ctx;
  } catch {
    return null;
  }
}

/** Compressor + a short, warm, synthetic room (decaying noise as the impulse). */
function master(a: AudioContext) {
  const comp = a.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  comp.attack.value = 0.004;
  comp.release.value = 0.2;
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 7000;
  comp.connect(lp).connect(a.destination);

  const len = Math.floor(a.sampleRate * 1.1);
  const ir = a.createBuffer(2, len, a.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3.2;
  }
  const verb = a.createConvolver();
  verb.buffer = ir;
  const wet = a.createGain();
  wet.gain.value = 0.16;
  const tone = a.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 3200;

  const input = a.createGain();
  input.connect(comp);
  input.connect(tone).connect(verb).connect(wet).connect(comp);
  return input;
}
const out = () => bus!;
/** For the music box: the shared context and bus (null while muted). */
export const audioBus = () => {
  const a = audio();
  return a ? { ctx: a, bus: bus! } : null;
};
/** ±3% so repeats feel organic. */
const jitter = () => 1 + (Math.random() - 0.5) * 0.06;

function sweep(from: number, to: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, exact = false) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  const j = exact ? 1 : jitter();
  o.type = type;
  o.frequency.setValueAtTime(from * j, t);
  o.frequency.exponentialRampToValueAtTime(to * j, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out());
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** Wheek wheek! */
export const squeak = () => {
  sweep(900, 1700, 0, 0.13);
  sweep(1000, 1900, 0.16, 0.14);
};
export const chirp = () => sweep(1200, 1500, 0, 0.08);
export const tone = (freq: number, dur = 0.25) => sweep(freq, freq, 0, dur, 'triangle', 0.16, true);

/** A struck bell: a pure tone plus its inharmonic shimmer, ringing out. */
export function bell(freq: number, start = 0, vol = 0.09, ring = 0.9, dest?: AudioNode, at?: number) {
  const a = audio();
  if (!a) return;
  const t = at ?? a.currentTime + start;
  for (const [mult, v, d] of [
    [1, 1, 1],
    [2.76, 0.35, 0.45],
    [5.4, 0.12, 0.25],
  ] as const) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.value = freq * mult;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * v, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ring * d);
    o.connect(g).connect(dest ?? out());
    o.start(t);
    o.stop(t + ring * d + 0.05);
  }
}

// Coins collected close together climb a pentatonic scale, like a combo.
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
let combo = 0;
let lastCoin = 0;
export const coin = () => {
  const now = performance.now();
  combo = now - lastCoin < 1400 ? Math.min(SCALE.length - 1, combo + 1) : 0;
  lastCoin = now;
  const f = 1046.5 * 2 ** (SCALE[combo] / 12);
  bell(f, 0, 0.07, 0.7);
  bell(f * 1.5, 0.06, 0.05, 0.8);
};
/** A soft, short tick for every button. */
export const tick = () => bell(1760 * jitter(), 0, 0.025, 0.18);

/**
 * He "says" his line in animalese: one soft blip per syllable, the pitch
 * following a little melody. Hebrew letters give the rhythm.
 */
let babbling = 0;
export const babble = (text: string) => {
  const a = audio();
  // Before her first tap the audio is still locked; don't queue a late surprise.
  if (!a || a.state !== 'running') return;
  const now = performance.now();
  if (now - babbling < 900) return;
  babbling = now;
  const letters = text.replace(/[^\p{L}]/gu, '');
  const n = Math.max(3, Math.min(14, Math.round(letters.length / 2)));
  const base = 620 + Math.random() * 120;
  const asking = /\?/.test(text);
  for (let i = 0; i < n; i++) {
    const t = a.currentTime + i * 0.075;
    const lift = asking && i > n - 3 ? 1.25 : 1;
    const f = base * (1 + Math.sin(i * 1.7 + (letters.charCodeAt(i % (letters.length || 1)) || 7)) * 0.12) * lift;
    const o = a.createOscillator();
    const bp = a.createBiquadFilter();
    const g = a.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 1.08, t + 0.05);
    bp.type = 'bandpass';
    bp.frequency.value = 1400 + (i % 3) * 400;
    bp.Q.value = 1.4;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(bp).connect(g).connect(out());
    o.start(t);
    o.stop(t + 0.07);
  }
};

/** Level up / big moments: a rising arpeggio of bells with a warm pad under it. */
export const ceremony = () => {
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => bell(f, i * 0.09, 0.08, 1.4));
  [261.6, 329.6, 392].forEach((f) => sweep(f, f, 0.05, 1.6, 'sine', 0.035, true));
};
export const bonk = () => sweep(220, 110, 0, 0.2, 'sawtooth', 0.06);
export const fanfare = () => [523, 659, 784, 1047].forEach((f, i) => sweep(f, f, i * 0.11, 0.18, 'triangle', 0.12, true));

let noiseBuf: AudioBuffer | null = null;
/** A burst of filtered noise: crunches, splashes, shutters. */
function noise(start: number, dur: number, freq: number, q = 1, vol = 0.2, type: BiquadFilterType = 'bandpass', toFreq?: number) {
  const a = audio();
  if (!a) return;
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = a.currentTime + start;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  const f = a.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  if (toFreq) f.frequency.exponentialRampToValueAtTime(toFreq, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out());
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

/** Munch munch: three crunchy bites. */
export const crunch = () => [0, 0.42, 0.84, 1.2].forEach((t) => noise(t, 0.09, 2400, 0.8, 0.22));
/** The happy rumble of a petted guinea pig. */
export const purr = () => {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const lfo = a.createOscillator();
  const lg = a.createGain();
  const g = a.createGain();
  o.type = 'sawtooth';
  o.frequency.value = 70;
  lfo.frequency.value = 22;
  lg.gain.value = 0.05;
  lfo.connect(lg).connect(g.gain);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.05, t + 0.08);
  g.gain.linearRampToValueAtTime(0.0001, t + 0.7);
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 300;
  o.connect(lp).connect(g).connect(out());
  o.start(t);
  lfo.start(t);
  o.stop(t + 0.75);
  lfo.stop(t + 0.75);
};
export const boing = () => {
  sweep(300, 900, 0, 0.18, 'sine', 0.14);
  sweep(900, 500, 0.18, 0.2, 'sine', 0.08);
};
export const splash = () => {
  noise(0, 0.5, 1800, 0.7, 0.25, 'bandpass', 500);
  [0.15, 0.3, 0.42].forEach((t) => sweep(600 + Math.random() * 400, 1400, t, 0.06, 'sine', 0.06));
};
export const pop = () => sweep(500 + Math.random() * 500, 1500, 0, 0.05, 'sine', 0.08);
export const shutter = () => {
  noise(0, 0.05, 3000, 0.5, 0.35, 'highpass');
  noise(0.09, 0.07, 2000, 0.5, 0.25, 'highpass');
};
export const yawnSound = () => sweep(520, 260, 0, 0.9, 'triangle', 0.07);
export const snore = () => noise(0, 1.1, 300, 2, 0.06, 'lowpass', 160);
export const click = () => sweep(1800, 1200, 0, 0.03, 'square', 0.03);
export const sparkle = () => [1568, 2093, 2637].forEach((f, i) => bell(f, i * 0.07, 0.04, 0.6));

/* ───── Tricks (PigActor) ───── */

/** A cartoon slap: a sharp crack and a little sting. */
export const slapSound = () => {
  noise(0, 0.07, 2600, 0.6, 0.5, 'highpass');
  noise(0.01, 0.14, 900, 1.2, 0.3);
};
/** Little sobs, for three seconds, then a sniffle. */
export const sob = () => {
  [0.15, 0.55, 0.95, 1.5, 1.9, 2.4].forEach((t, i) => sweep(820 - i * 25, 520, t, 0.26, 'triangle', 0.08));
  noise(2.85, 0.25, 1800, 2, 0.08, 'bandpass', 3200);
};
export const sneeze = () => {
  sweep(500, 900, 0, 0.35, 'triangle', 0.06);
  noise(0.42, 0.18, 2200, 0.6, 0.35, 'bandpass', 900);
};
/** Tee-hee-hee. */
export const giggle = () => [0, 0.12, 0.24, 0.36, 0.5].forEach((t, i) => sweep(1300 + i * 60, 1700 + i * 60, t, 0.08, 'sine', 0.08));
export const whoosh = () => noise(0, 0.45, 600, 0.8, 0.22, 'bandpass', 2600);
/** Wobbly, dizzy warble. */
export const dizzySound = () => [0, 0.3, 0.6, 0.9].forEach((t, i) => sweep(700 - i * 60, 480 - i * 40, t, 0.28, 'sine', 0.07));
export const flop = () => {
  sweep(260, 90, 0, 0.18, 'sine', 0.2);
  noise(0, 0.12, 500, 1, 0.2, 'lowpass');
};
export const tada = () => [523, 659, 784, 1047].forEach((f, i) => bell(f, i * 0.09, 0.06, 0.7));

/* ───── arcade ───── */
/** A soft "pew": a quick falling sine, never a harsh square. */
export const pew = () => sweep(1500, 520, 0, 0.09, 'sine', 0.05);
/** Something bursts far away: low filtered noise plus a falling thump. */
export const boom = () => {
  noise(0, 0.45, 900, 0.7, 0.22, 'lowpass', 120);
  sweep(160, 50, 0, 0.3, 'sine', 0.14);
};
/** A wing flap / jump: short upward whoosh. */
export const flap = () => sweep(380, 760, 0, 0.1, 'triangle', 0.06);
/** A wrong answer: two soft descending notes. */
export const wrong = () => {
  sweep(392, 370, 0, 0.16, 'triangle', 0.08, true);
  sweep(311, 294, 0.15, 0.24, 'triangle', 0.08, true);
};
/** A right answer: a bright rising pair of bells. */
export const right = () => {
  bell(1046.5 * jitter(), 0, 0.06, 0.6);
  bell(1568 * jitter(), 0.08, 0.06, 0.8);
};
/** A level went up: a small rising arpeggio of bells. */
export const levelUp = () => [784, 988, 1175, 1568].forEach((f, i) => bell(f, i * 0.08, 0.055, 0.8));
/** A swipe through fruit. */
export const slice = () => noise(0, 0.14, 3200, 1.2, 0.16, 'bandpass', 6000);
/** A note of a (pentatonic) instrument, for the piano and the paint brush. */
export const note = (i: number, vol = 0.06) => bell(523.25 * 2 ** (SCALE[((i % SCALE.length) + SCALE.length) % SCALE.length] / 12), 0, vol, 0.7);

/** The hiding pig's tricks (components/HidingPig.tsx). */
/** "אמאאאאא": three squeaks climbing into a long wail. */
export const mama = () => {
  sweep(820, 1250, 0, 0.12, 'triangle', 0.07);
  sweep(900, 1400, 0.14, 0.12, 'triangle', 0.07);
  sweep(1000, 1650, 0.3, 0.7, 'triangle', 0.08);
};
/** A very small, very polite toot. */
export const toot = () => {
  sweep(190, 95, 0, 0.32, 'sawtooth', 0.045);
  noise(0, 0.3, 260, 0.9, 0.07, 'lowpass', 120);
};
/** Meh-eh-eh: a baby goat. */
export const bleat = () => [0, 0.09, 0.18, 0.27].forEach((t, i) => sweep(640 - i * 18, 560 - i * 18, t, 0.11, 'sawtooth', 0.035));
/** The poof of turning into something else. */
export const poof = () => noise(0, 0.4, 900, 0.7, 0.14, 'bandpass', 3800);
