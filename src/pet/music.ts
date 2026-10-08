import { audioBus, bell } from './sound';

/**
 * A little music box that plays in his room. The tunes are written here as
 * note lists (original, made for him): a sunny one for the day and a slow
 * lullaby for the night. Each note is placed a few milliseconds off and a
 * little softer or louder, the way a real music box comb never plays twice
 * the same.
 */
type Tune = { bpm: number; notes: [number | null, number][]; bass: [number, number][] };

// MIDI note numbers, [note, beats]. null = rest.
const DAY: Tune = {
  bpm: 92,
  notes: [
    [72, 1], [76, 1], [79, 1], [76, 1], [74, 1], [72, 0.5], [74, 0.5], [76, 2],
    [79, 1], [81, 1], [79, 1], [76, 1], [74, 2], [null, 1], [72, 1],
    [72, 1], [76, 1], [79, 1], [84, 1], [81, 1], [79, 0.5], [76, 0.5], [74, 2],
    [76, 1], [74, 1], [72, 0.5], [74, 0.5], [76, 1], [72, 3], [null, 1],
  ],
  bass: [[48, 4], [53, 4], [55, 4], [48, 4], [48, 4], [53, 4], [55, 4], [48, 4]],
};
const NIGHT: Tune = {
  bpm: 66,
  notes: [
    [69, 1.5], [72, 0.5], [76, 2], [74, 1], [72, 1], [71, 2],
    [69, 1], [71, 1], [72, 1.5], [71, 0.5], [67, 3], [null, 1],
    [69, 1.5], [72, 0.5], [76, 2], [77, 1], [76, 1], [74, 2],
    [72, 1], [71, 1], [69, 3], [null, 1],
  ],
  bass: [[45, 4], [41, 4], [43, 4], [40, 4], [45, 4], [41, 4], [43, 4], [45, 4]],
};

const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);
const human = () => (Math.random() - 0.5) * 0.018;

export class MusicBox {
  private gain: GainNode | null = null;
  private timer = 0;
  private tune: Tune = DAY;
  private next = 0;
  private i = 0;
  private bi = 0;
  private nextBass = 0;
  playing = false;

  start(night: boolean) {
    const io = audioBus();
    if (!io) return;
    const { ctx, bus } = io;
    this.tune = night ? NIGHT : DAY;
    if (this.playing) return;
    this.playing = true;
    this.gain = ctx.createGain();
    this.gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.gain.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 2.5);
    this.gain.connect(bus);
    this.next = this.nextBass = ctx.currentTime + 0.3;
    this.i = this.bi = 0;
    const schedule = () => {
      const io2 = audioBus();
      if (!io2 || !this.gain) return this.stop();
      const beat = 60 / this.tune.bpm;
      while (this.next < io2.ctx.currentTime + 0.4) {
        const [n, len] = this.tune.notes[this.i % this.tune.notes.length];
        if (n !== null) bell(hz(n), 0, 0.06 * (0.8 + Math.random() * 0.35), 1.6, this.gain, this.next + human());
        this.next += len * beat;
        this.i++;
        // A breath between the verses.
        if (this.i % this.tune.notes.length === 0) this.next += beat * 2;
      }
      while (this.nextBass < this.next) {
        const [b, len] = this.tune.bass[this.bi % this.tune.bass.length];
        bell(hz(b), 0, 0.035, 2.4, this.gain, this.nextBass + human());
        bell(hz(b + 7), 0, 0.018, 1.8, this.gain, this.nextBass + beat * 2 + human());
        this.nextBass += len * beat;
        this.bi++;
      }
    };
    schedule();
    this.timer = window.setInterval(schedule, 120);
  }

  stop() {
    window.clearInterval(this.timer);
    const g = this.gain;
    this.gain = null;
    this.playing = false;
    const io = audioBus();
    if (g && io) {
      g.gain.cancelScheduledValues(io.ctx.currentTime);
      g.gain.setTargetAtTime(0.0001, io.ctx.currentTime, 0.25);
      window.setTimeout(() => g.disconnect(), 1500);
    }
  }
}
