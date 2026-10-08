/**
 * "He repeats after me": the pig listens on the microphone, and when she
 * stops talking he says it back in a squeaky guinea-pig voice (played faster,
 * so higher). `onLevel` drives his mouth while he talks. Nothing is recorded
 * or sent anywhere: the sound lives only in memory until he has said it.
 */
export type VoiceState = 'off' | 'listening' | 'hearing' | 'speaking';

const PITCH = 1.45;
const SILENCE_MS = 1000;
const MAX_MS = 30_000;

export class Repeater {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private proc: ScriptProcessorNode | null = null;
  private state: VoiceState = 'off';
  private noise = 0.01;
  private preroll: Float32Array[] = [];
  private chunks: Float32Array[] = [];
  private voiced = 0;
  private lastVoice = 0;
  private started = 0;
  private raf = 0;
  /** Right after he speaks, ignore the room for a moment (his own echo). */
  private quietUntil = 0;

  constructor(
    private onState: (s: VoiceState) => void,
    private onLevel: (level: number) => void,
  ) {}

  private set(s: VoiceState) {
    this.state = s;
    this.onState(s);
  }

  /** Must be called from a tap (browsers only open the mic and audio after one). */
  async start() {
    if (this.state !== 'off') return;
    this.ctx = new AudioContext();
    await this.ctx.resume();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.proc = this.ctx.createScriptProcessor(2048, 1, 1);
    src.connect(this.proc);
    this.proc.connect(this.ctx.destination);
    this.proc.onaudioprocess = (e) => {
      e.outputBuffer.getChannelData(0).fill(0);
      if (this.state === 'speaking' || this.state === 'off') return;
      const data = new Float32Array(e.inputBuffer.getChannelData(0));
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length);
      const voice = rms > Math.max(0.018, this.noise * 3);
      const now = performance.now();
      if (now < this.quietUntil) return;
      if (this.state === 'listening') {
        if (!voice) this.noise = this.noise * 0.95 + rms * 0.05;
        this.preroll.push(data);
        if (this.preroll.length > 6) this.preroll.shift();
        if (voice) {
          this.chunks = [...this.preroll];
          this.voiced = 0;
          this.started = now;
          this.lastVoice = now;
          this.set('hearing');
        }
        return;
      }
      // hearing
      this.chunks.push(data);
      if (voice) {
        this.lastVoice = now;
        this.voiced += (data.length / this.ctx!.sampleRate) * 1000;
      }
      if (now - this.lastVoice > SILENCE_MS || now - this.started > MAX_MS) this.sayBack();
    };
    this.set('listening');
  }

  private sayBack() {
    const ctx = this.ctx!;
    const chunks = this.chunks;
    this.chunks = [];
    this.preroll = [];
    if (this.voiced < 220) return this.set('listening');
    const len = chunks.reduce((a, c) => a + c.length, 0);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const out = buf.getChannelData(0);
    let o = 0;
    for (const c of chunks) {
      out.set(c, o);
      o += c.length;
    }
    // Loudness per slice, for his mouth.
    const SLICE = 512;
    const env: number[] = [];
    let peak = 0.0001;
    for (let i = 0; i < len; i += SLICE) {
      let s = 0;
      const end = Math.min(len, i + SLICE);
      for (let j = i; j < end; j++) s += out[j] * out[j];
      const v = Math.sqrt(s / (end - i));
      env.push(v);
      peak = Math.max(peak, v);
    }
    const node = ctx.createBufferSource();
    node.buffer = buf;
    node.playbackRate.value = PITCH;
    const gain = ctx.createGain();
    gain.gain.value = Math.min(4, 0.35 / peak);
    node.connect(gain).connect(ctx.destination);
    this.set('speaking');
    const t0 = ctx.currentTime;
    const mouth = () => {
      const idx = Math.floor(((ctx.currentTime - t0) * PITCH * ctx.sampleRate) / SLICE);
      this.onLevel(idx < env.length ? Math.min(1, (env[idx] / peak) * 1.2) : 0);
      this.raf = requestAnimationFrame(mouth);
    };
    mouth();
    node.onended = () => {
      cancelAnimationFrame(this.raf);
      this.onLevel(0);
      this.quietUntil = performance.now() + 600;
      if (this.state === 'speaking') this.set('listening');
    };
    node.start();
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.onLevel(0);
    this.proc?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.stream = null;
    this.proc = null;
    this.chunks = [];
    this.preroll = [];
    this.set('off');
  }
}
