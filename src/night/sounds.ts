/**
 * Five sleep sounds, all synthesized (no audio files, nothing to download):
 * the sea, rain on the window, a crackling fire, crickets on a summer night,
 * and the admin's heartbeat. Research behind the picks: rain and the sea are
 * natural pink noise and top every "what helps you sleep" survey; a hearth's
 * crackle lowers blood pressure; a slow heartbeat (~58 bpm) invites yours to
 * follow it down.
 */
import { A } from '../lib/he';

export type SoundId = 'sea' | 'rain' | 'fire' | 'crickets' | 'heart';

export const SOUNDS: { id: SoundId; name: string; line: string }[] = [
  { id: 'sea', name: 'הים בלילה', line: 'גלים שבאים והולכים' },
  { id: 'rain', name: 'גשם על החלון', line: 'טיפות, ובפנים חם' },
  { id: 'fire', name: 'אח בוערת', line: 'עצים שמתפצפצים לאט' },
  { id: 'crickets', name: 'לילה של קיץ', line: 'צרצרים ורוח קלה' },
  { id: 'heart', name: `הלב של ${A}`, line: 'לשים את הראש עליו' },
];

type Ctx = AudioContext;

function noiseBuffer(a: Ctx, kind: 'white' | 'brown' | 'pink', seconds = 4) {
  const len = Math.floor(a.sampleRate * seconds);
  const buf = a.createBuffer(2, len, a.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let last = 0;
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'white') d[i] = w * 0.5;
      else if (kind === 'brown') {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else {
        b0 = 0.99765 * b0 + w * 0.099046;
        b1 = 0.963 * b1 + w * 0.2965164;
        b2 = 0.57 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11;
      }
    }
  }
  return buf;
}

function loop(a: Ctx, buf: AudioBuffer) {
  const s = a.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  s.loopStart = Math.random();
  s.start(0, Math.random() * buf.duration);
  return s;
}

function filter(a: Ctx, type: BiquadFilterType, freq: number, q = 0.7) {
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function gain(a: Ctx, v: number) {
  const g = a.createGain();
  g.gain.value = v;
  return g;
}

/** A slow wobble on some AudioParam. */
function lfo(a: Ctx, hz: number, depth: number, target: AudioParam) {
  const o = a.createOscillator();
  o.frequency.value = hz;
  const d = gain(a, depth);
  o.connect(d).connect(target);
  o.start();
  return o;
}

/** A one-shot noise burst through a bandpass: a raindrop, a crackle, a twig. */
function burst(a: Ctx, out: AudioNode, white: AudioBuffer, t: number, freq: number, dur: number, vol: number, pan = 0) {
  const s = a.createBufferSource();
  s.buffer = white;
  const f = filter(a, 'bandpass', freq, 1.4);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const p = a.createStereoPanner();
  p.pan.value = pan;
  s.connect(f).connect(g).connect(p).connect(out);
  s.start(t, Math.random() * 3, dur + 0.02);
}

type Scheduler = (a: Ctx, until: number) => void;

/** Builds the steady bed of a sound and returns a scheduler for its little events. */
function build(id: SoundId, a: Ctx, out: AudioNode): Scheduler | null {
  const white = noiseBuffer(a, 'white', 4);
  switch (id) {
    case 'sea': {
      const lp = filter(a, 'lowpass', 700);
      const swell = gain(a, 0.55);
      lfo(a, 1 / 9, 0.4, swell.gain);
      lfo(a, 1 / 9, 380, lp.frequency);
      loop(a, noiseBuffer(a, 'brown')).connect(lp).connect(swell).connect(out);
      // a little foam on top of each wave
      const hiss = filter(a, 'highpass', 2500);
      const foam = gain(a, 0.02);
      lfo(a, 1 / 9, 0.02, foam.gain);
      loop(a, white).connect(hiss).connect(foam).connect(out);
      return null;
    }
    case 'rain': {
      const bed = filter(a, 'lowpass', 5200);
      const hp = filter(a, 'highpass', 350);
      loop(a, noiseBuffer(a, 'pink')).connect(hp).connect(bed).connect(gain(a, 0.9)).connect(out);
      const rumble = filter(a, 'lowpass', 220);
      loop(a, noiseBuffer(a, 'brown')).connect(rumble).connect(gain(a, 0.25)).connect(out);
      let next = a.currentTime;
      return (ctx, until) => {
        while (next < until) {
          // drops on the glass: a soft patter, now and then a fat one
          const fat = Math.random() < 0.08;
          burst(ctx, out, white, next, fat ? 1800 + Math.random() * 900 : 3000 + Math.random() * 3500, fat ? 0.05 : 0.018, fat ? 0.12 : 0.04 + Math.random() * 0.05, Math.random() * 1.6 - 0.8);
          next += 0.012 + Math.random() * 0.05;
        }
      };
    }
    case 'fire': {
      const roar = filter(a, 'lowpass', 380);
      const breathe = gain(a, 0.5);
      lfo(a, 0.13, 0.18, breathe.gain);
      loop(a, noiseBuffer(a, 'brown')).connect(roar).connect(breathe).connect(out);
      const hissF = filter(a, 'bandpass', 3200, 0.5);
      loop(a, white).connect(hissF).connect(gain(a, 0.012)).connect(out);
      let next = a.currentTime;
      return (ctx, until) => {
        while (next < until) {
          // crackles come in little clusters, with the odd loud pop of a knot
          const pop = Math.random() < 0.06;
          const n = pop ? 1 : 1 + Math.floor(Math.random() * 4);
          for (let i = 0; i < n; i++) {
            const t = next + i * (0.008 + Math.random() * 0.03);
            burst(ctx, out, white, t, pop ? 700 + Math.random() * 400 : 1800 + Math.random() * 4000, pop ? 0.06 : 0.006 + Math.random() * 0.012, pop ? 0.5 : 0.12 + Math.random() * 0.25, Math.random() * 0.8 - 0.4);
          }
          next += pop ? 0.6 + Math.random() * 1.2 : 0.05 + Math.random() ** 2 * 0.7;
        }
      };
    }
    case 'crickets': {
      const wind = filter(a, 'bandpass', 420, 0.6);
      const gust = gain(a, 0.18);
      lfo(a, 0.07, 0.12, gust.gain);
      lfo(a, 0.05, 160, wind.frequency);
      loop(a, noiseBuffer(a, 'pink')).connect(wind).connect(gust).connect(out);
      const crickets = [
        { f: 4400, pan: -0.6, period: 0.9, next: a.currentTime + 0.3 },
        { f: 4750, pan: 0.55, period: 1.15, next: a.currentTime + 0.8 },
        { f: 4100, pan: 0.1, period: 1.6, next: a.currentTime + 1.7 },
      ];
      return (ctx, until) => {
        for (const c of crickets) {
          while (c.next < until) {
            const pulses = 3 + Math.floor(Math.random() * 2);
            const far = c.pan === 0.1 ? 0.35 : 1;
            for (let i = 0; i < pulses; i++) {
              const t = c.next + i * 0.045;
              const o = ctx.createOscillator();
              o.type = 'sine';
              o.frequency.value = c.f + Math.random() * 40;
              const g = ctx.createGain();
              g.gain.setValueAtTime(0.0001, t);
              g.gain.exponentialRampToValueAtTime(0.022 * far, t + 0.006);
              g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
              const p = ctx.createStereoPanner();
              p.pan.value = c.pan;
              o.connect(g).connect(p).connect(out);
              o.start(t);
              o.stop(t + 0.04);
            }
            // sometimes a cricket takes a breath
            c.next += c.period * (0.85 + Math.random() * 0.3) + (Math.random() < 0.1 ? 2 + Math.random() * 3 : 0);
          }
        }
      };
    }
    case 'heart': {
      // the hush you hear with your ear on someone's chest
      const hush = filter(a, 'lowpass', 300);
      const breath = gain(a, 0.22);
      lfo(a, 1 / 5.5, 0.12, breath.gain);
      loop(a, noiseBuffer(a, 'brown')).connect(hush).connect(breath).connect(out);
      const beat = 60 / 58;
      let next = a.currentTime + 0.4;
      const thump = (ctx: Ctx, t: number, vol: number, f: number) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, t);
        o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.12);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        const lp = filter(ctx, 'lowpass', 160);
        o.connect(g).connect(lp).connect(out);
        o.start(t);
        o.stop(t + 0.25);
      };
      return (ctx, until) => {
        while (next < until) {
          thump(ctx, next, 0.9, 70);
          thump(ctx, next + 0.17, 0.55, 62);
          next += beat * (0.98 + Math.random() * 0.04);
        }
      };
    }
  }
}

/** One sound playing at a time, with a sleep timer that fades it out. */
class Soundscape {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private tick = 0;
  private timer = 0;
  private stopAt = 0;
  current: SoundId | null = null;
  private listeners = new Set<() => void>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }
  private emit() {
    this.listeners.forEach((f) => f());
  }

  play(id: SoundId, minutes: number) {
    this.stop(true);
    try {
      const a = new AudioContext();
      const out = a.createGain();
      out.gain.setValueAtTime(0.0001, a.currentTime);
      out.gain.exponentialRampToValueAtTime(0.65, a.currentTime + 2.5);
      const comp = a.createDynamicsCompressor();
      comp.threshold.value = -14;
      out.connect(comp).connect(a.destination);
      const schedule = build(id, a, out);
      if (schedule) {
        schedule(a, a.currentTime + 0.3);
        this.tick = window.setInterval(() => schedule(a, a.currentTime + 0.3), 100);
      }
      this.ctx = a;
      this.out = out;
      this.current = id;
      this.stopAt = Date.now() + minutes * 60_000;
      this.timer = window.setTimeout(() => this.stop(), Math.max(0, minutes * 60_000 - 40_000));
    } catch {
      this.ctx = null;
      this.current = null;
    }
    this.emit();
  }

  /** Minutes left, rounded up. */
  left() {
    return this.ctx ? Math.max(0, Math.ceil((this.stopAt - Date.now()) / 60_000)) : 0;
  }

  stop(now = false) {
    window.clearTimeout(this.timer);
    const a = this.ctx;
    const g = this.out;
    const tick = this.tick;
    this.ctx = null;
    this.out = null;
    this.current = null;
    if (a && g) {
      const fade = now ? 0.5 : 40;
      g.gain.cancelScheduledValues(a.currentTime);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + fade);
      window.setTimeout(() => {
        window.clearInterval(tick);
        void a.close();
      }, fade * 1000 + 200);
    }
    this.emit();
  }
}

export const soundscape = new Soundscape();
