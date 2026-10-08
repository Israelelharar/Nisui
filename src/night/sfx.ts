/** Little synthesized sounds for the night games: bleats, hops, the gate. Soft, never loud. */
let ctx: AudioContext | null = null;
let out: GainNode | null = null;

function audio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    if (!out) {
      out = ctx.createGain();
      out.gain.value = 0.5;
      out.connect(ctx.destination);
    }
    return ctx;
  } catch {
    return null;
  }
}

/** "מֵההה": a buzzy voice with a goat-like wobble, pitched per sheep. */
export function bleat(pitch = 1, vol = 0.12) {
  const a = audio();
  if (!a || !out) return;
  const t = a.currentTime;
  const dur = 0.45 + Math.random() * 0.2;
  const o = a.createOscillator();
  o.type = 'sawtooth';
  const f = 330 * pitch * (0.95 + Math.random() * 0.1);
  o.frequency.setValueAtTime(f * 1.1, t);
  o.frequency.linearRampToValueAtTime(f, t + 0.08);
  o.frequency.linearRampToValueAtTime(f * 0.92, t + dur);
  const vib = a.createOscillator();
  vib.frequency.value = 17;
  const vd = a.createGain();
  vd.gain.value = f * 0.06;
  vib.connect(vd).connect(o.frequency);
  // two formants make it a voice instead of a buzzer
  const f1 = a.createBiquadFilter();
  f1.type = 'bandpass';
  f1.frequency.value = 900;
  f1.Q.value = 5;
  const f2 = a.createBiquadFilter();
  f2.type = 'bandpass';
  f2.frequency.value = 2200;
  f2.Q.value = 7;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
  g.gain.setValueAtTime(vol, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f1).connect(g);
  o.connect(f2).connect(g);
  g.connect(out);
  o.start(t);
  vib.start(t);
  o.stop(t + dur + 0.05);
  vib.stop(t + dur + 0.05);
}

/** A soft thump on grass. */
export function thud(vol = 0.25) {
  const a = audio();
  if (!a || !out) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(55, t + 0.12);
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.2);
}

/** A rising whoosh as a sheep takes off. */
export function hop() {
  const a = audio();
  if (!a || !out) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(320, t);
  o.frequency.exponentialRampToValueAtTime(760, t + 0.18);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.25);
}

/** Wooden gate swinging shut, then the latch. */
export function gate() {
  const a = audio();
  if (!a || !out) return;
  const t = a.currentTime;
  // creak
  const c = a.createOscillator();
  c.type = 'sawtooth';
  c.frequency.setValueAtTime(180, t);
  c.frequency.linearRampToValueAtTime(240, t + 0.35);
  const cf = a.createBiquadFilter();
  cf.type = 'bandpass';
  cf.frequency.value = 1200;
  cf.Q.value = 9;
  const cg = a.createGain();
  cg.gain.setValueAtTime(0.0001, t);
  cg.gain.exponentialRampToValueAtTime(0.04, t + 0.05);
  cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
  c.connect(cf).connect(cg).connect(out);
  c.start(t);
  c.stop(t + 0.4);
  // knock + latch
  for (const [dt, f, v] of [
    [0.4, 120, 0.35],
    [0.52, 1800, 0.08],
  ] as const) {
    const o = a.createOscillator();
    o.type = f > 1000 ? 'square' : 'sine';
    o.frequency.setValueAtTime(f, t + dt);
    o.frequency.exponentialRampToValueAtTime(f * 0.5, t + dt + 0.08);
    const g = a.createGain();
    g.gain.setValueAtTime(v, t + dt);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.1);
    o.connect(g).connect(out);
    o.start(t + dt);
    o.stop(t + dt + 0.12);
  }
}

/** A few bells going up: right answer, round won. */
export function chime(notes = [784, 988, 1175, 1568]) {
  const a = audio();
  if (!a || !out) return;
  notes.forEach((f, i) => {
    const t = a.currentTime + i * 0.11;
    for (const [m, v] of [
      [1, 0.07],
      [2.76, 0.02],
    ] as const) {
      const o = a.createOscillator();
      o.frequency.value = f * m;
      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      o.connect(g).connect(out!);
      o.start(t);
      o.stop(t + 1.3);
    }
  });
}

/** A soft low "not quite". */
export function oops() {
  const a = audio();
  if (!a || !out) return;
  const t = a.currentTime;
  [392, 330].forEach((f, i) => {
    const o = a.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t + i * 0.16);
    g.gain.exponentialRampToValueAtTime(0.06, t + i * 0.16 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.16 + 0.4);
    o.connect(g).connect(out!);
    o.start(t + i * 0.16);
    o.stop(t + i * 0.16 + 0.45);
  });
}

function noise(a: AudioContext, seconds: number) {
  const b = a.createBuffer(1, Math.floor(a.sampleRate * seconds), a.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource();
  s.buffer = b;
  return s;
}

/** Tyres screaming on asphalt: noise through a resonant band that slides down. */
export function screech() {
  const a = audio();
  if (!a || !out) return;
  const t = a.currentTime;
  const n = noise(a, 0.7);
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 14;
  f.frequency.setValueAtTime(2600, t);
  f.frequency.exponentialRampToValueAtTime(1500, t + 0.6);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
  n.connect(f).connect(g).connect(out);
  n.start(t);
}

/** An old car's two-tone horn. */
export function honk() {
  const a = audio();
  if (!a || !out) return;
  const t = a.currentTime + 0.55;
  for (const [f, dt] of [
    [349, 0],
    [415, 0],
    [349, 0.28],
    [415, 0.28],
  ] as const) {
    const o = a.createOscillator();
    o.type = 'square';
    o.frequency.value = f;
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t + dt);
    g.gain.exponentialRampToValueAtTime(0.035, t + dt + 0.02);
    g.gain.setValueAtTime(0.035, t + dt + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.24);
    o.connect(lp).connect(g).connect(out);
    o.start(t + dt);
    o.stop(t + dt + 0.26);
  }
}

/** Plop into the river. */
export function splash() {
  const a = audio();
  if (!a || !out) return;
  const t = a.currentTime;
  const n = noise(a, 0.6);
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(3000, t);
  f.frequency.exponentialRampToValueAtTime(300, t + 0.5);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  n.connect(f).connect(g).connect(out);
  n.start(t);
  const o = a.createOscillator();
  o.frequency.setValueAtTime(600, t);
  o.frequency.exponentialRampToValueAtTime(140, t + 0.15);
  const og = a.createGain();
  og.gain.setValueAtTime(0.12, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(og).connect(out);
  o.start(t);
  o.stop(t + 0.2);
}

/** A soft "tk" for each hop, pitched a hair differently every time. */
export function step() {
  const a = audio();
  if (!a || !out) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  o.type = 'triangle';
  const f = 520 + Math.random() * 120;
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.06);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.04, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.1);
}

/** Bumping a tree. */
export function boing() {
  const a = audio();
  if (!a || !out) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(320, t + 0.08);
  o.frequency.exponentialRampToValueAtTime(140, t + 0.25);
  const g = a.createGain();
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.3);
}

/** Picking up a pouch: two quick bright notes. */
export function pouch() {
  chime([1175, 1568]);
}
