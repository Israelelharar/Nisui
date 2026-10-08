import { useRef, useState } from 'react';
import { tap } from '../../lib/haptics';
import { bell, bonk } from '../sound';
import { FX, Hint, Stage, TapToStart, announceLevel, useBanner, useCanvasLoop, type GameProps } from './kit';

// Notes as semitones from middle C. Folk tunes everyone knows, all old enough to be public domain.
const C = 0, D = 2, E = 4, F = 5, G = 7, A = 9;
const SONGS: { name: string; notes: number[] }[] = [
  { name: 'יונתן הקטן', notes: [G, E, E, F, D, D, C, D, E, F, G, G, G, G, E, E, F, D, D, C, E, G, G, C] },
  { name: 'כוכב קטן', notes: [C, C, G, G, A, A, G, F, F, E, E, D, D, C, G, G, F, F, E, E, D, G, G, F, F, E, E, D, C, C, G, G, A, A, G, F, F, E, E, D, D, C] },
  { name: 'שיר השמחה', notes: [E, E, F, G, G, F, E, D, C, C, D, E, E, D, D, E, E, F, G, G, F, E, D, C, C, D, E, D, C, C] },
  { name: 'יום הולדת שמח', notes: [G - 12, G - 12, A - 12, G - 12, C, 11 - 12, G - 12, G - 12, A - 12, G - 12, D, C, G - 12, G - 12, G, E, C, 11 - 12, A - 12, F, F, E, C, D, C] },
  { name: 'פעמונים', notes: [E, E, E, E, E, E, E, G, C, D, E, F, F, F, F, F, E, E, E, E, D, D, E, D, G] },
];
const freq = (semi: number) => 261.63 * 2 ** (semi / 12);

interface Tile {
  lane: number;
  y: number;
  note: number;
  hit: number;
  /** The last note of its song. */
  last: boolean;
  song: number;
}

/**
 * פסנתר: dark tiles stream down four lanes; tapping each plays the next note of
 * a song she knows. A tile that slips past costs a heart. It keeps speeding up,
 * and each finished song is a level.
 */
export function PianoGame({ onEnd, onClose }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ score: 0, hearts: 3, level: 1 });
  const [started, setStarted] = useState(false);
  const [banner, show] = useBanner();
  const g = useRef({
    tiles: [] as Tile[],
    song: 0,
    idx: 0,
    lastLane: -1,
    speed: 260,
    score: 0,
    hearts: 3,
    level: 1,
    over: false,
    t: 0,
    fx: new FX(),
    flash: { lane: -1, life: 0 },
    h: 600,
    w: 400,
  });

  useCanvasLoop(canvas, (ctx, w, h, dt) => {
    const s = g.current;
    s.t += dt;
    s.w = w;
    s.h = h;
    const th = h / 4.4;
    const lw = w / 4;
    if (!s.tiles.length) {
      for (let k = 0; k < 6; k++) push(-th * k + h - th * 2.2);
    }
    // ivory keys, thin gold lines between lanes
    ctx.fillStyle = '#FFFBF3';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(185,150,90,0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * lw, 0);
      ctx.lineTo(i * lw, h);
      ctx.stroke();
    }
    ctx.save();
    s.fx.pre(ctx, dt);
    if (s.flash.life > 0) {
      s.flash.life -= dt;
      ctx.fillStyle = `rgba(229,57,80,${s.flash.life * 1.2})`;
      ctx.fillRect(s.flash.lane * lw, 0, lw, h);
    }
    const play = started && !s.over;
    if (play) {
      for (const t of s.tiles) t.y += s.speed * dt;
      const top = Math.min(...s.tiles.map((t) => t.y));
      if (top > -th) push(top - th);
    }
    for (let i = s.tiles.length - 1; i >= 0; i--) {
      const t = s.tiles[i];
      if (t.hit) {
        t.hit += dt;
        if (t.hit > 0.35) {
          s.tiles.splice(i, 1);
          continue;
        }
      }
      const x = t.lane * lw;
      ctx.save();
      if (t.hit) ctx.globalAlpha = Math.max(0, 1 - t.hit * 3);
      const gr = ctx.createLinearGradient(0, t.y, 0, t.y + th);
      gr.addColorStop(0, t.hit ? '#F7B9C8' : '#3A2A33');
      gr.addColorStop(1, t.hit ? '#FFE3EC' : '#1C1218');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.roundRect(x + 3, t.y + 3, lw - 6, th - 6, 10);
      ctx.fill();
      ctx.restore();
      if (!t.hit && t.y > h) {
        s.tiles.splice(i, 1);
        if (play) {
          s.flash = { lane: t.lane, life: 0.5 };
          hurt();
        }
      }
    }
    // the first tile waits for her, with a gentle "כאן"
    if (!started) {
      const first = s.tiles.reduce((a, b) => (b.y > a.y ? b : a), s.tiles[0]);
      if (first) {
        ctx.fillStyle = '#FFE3EC';
        ctx.font = "700 18px 'Playpen Sans Hebrew', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('כאן', first.lane * lw + lw / 2, first.y + th / 2);
      }
    }
    s.fx.draw(ctx, dt);
    ctx.restore();
  });

  function push(y: number) {
    const s = g.current;
    // the notes stream on from song to song
    let song = SONGS[s.song % SONGS.length];
    if (s.idx >= song.notes.length) {
      s.song += 1;
      s.idx = 0;
      song = SONGS[s.song % SONGS.length];
    }
    const note = song.notes[s.idx];
    const last = s.idx === song.notes.length - 1;
    s.idx += 1;
    let lane = Math.floor(Math.random() * 4);
    if (lane === s.lastLane) lane = (lane + 1 + Math.floor(Math.random() * 3)) % 4;
    s.lastLane = lane;
    s.tiles.push({ lane, y, note, hit: 0, last, song: s.song });
  }

  const hurt = () => {
    const s = g.current;
    if (s.over) return;
    s.hearts -= 1;
    bonk();
    tap(40);
    s.fx.kick(10);
    setHud((v) => ({ ...v, hearts: s.hearts }));
    if (s.hearts <= 0) {
      s.over = true;
      window.setTimeout(() => onEnd({ score: s.score, coins: Math.min(160, Math.round(s.score / 2)), level: s.level }), 900);
    }
  };

  const press = (e: React.PointerEvent) => {
    const s = g.current;
    if (s.over) return;
    const r = canvas.current!.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const lane = Math.floor((x / r.width) * 4);
    const th = s.h / 4.4;
    // the lowest unplayed tile must be played first, like a real song
    const open = s.tiles.filter((t) => !t.hit).sort((a, b) => b.y - a.y);
    const next = open[0];
    if (!next) return;
    if (next.lane === lane && y > next.y - 30 && y < next.y + th + 30) {
      if (!started) setStarted(true);
      next.hit = 0.001;
      bell(freq(next.note), 0, 0.09, 1.1);
      bell(freq(next.note) * 2, 0, 0.025, 0.5);
      tap(5);
      s.score += 1;
      s.speed += 2.2;
      s.fx.burst(lane * (s.w / 4) + s.w / 8, next.y + th / 2, ['#F7B9C8', '#FFE38A', '#fff'], 8, 140, 'star', 200);
      if (next.last) {
        // she finished the song: the next one, a bit faster
        s.level += 1;
        s.speed += 25;
        announceLevel(show, s.level, SONGS[(next.song + 1) % SONGS.length].name);
      }
      setHud({ score: s.score, hearts: s.hearts, level: s.level });
    } else if (started) {
      s.flash = { lane, life: 0.35 };
      bonk();
      tap(20);
    }
  };

  return (
    <Stage title="פסנתר" score={hud.score} hearts={hud.hearts} level={hud.level} onClose={onClose} banner={banner} bg="#FFFBF3">
      <canvas ref={canvas} dir="ltr" className="absolute inset-0 size-full touch-none" onPointerDown={press} />
      <TapToStart show={!started} text={`השיר: ${SONGS[0].name}`} />
      <Hint show={started && hud.score < 5} className="top-4 text-ink/55">
        נוגעים באריחים הכהים, מהתחתון למעלה
      </Hint>
    </Stage>
  );
}
