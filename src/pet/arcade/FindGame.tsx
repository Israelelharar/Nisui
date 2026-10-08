import { useCallback, useRef, useState } from 'react';
import { tap } from '../../lib/haptics';
import { bonk, squeak, tada } from '../sound';
import { skins } from '../catalog';
import { FX, Stage, drawPig, rand, useCanvasLoop, usePigSprite, type GameProps } from './kit';
import { FRUITS, balloon, coinSprite } from './sprites';
import { p } from '../../lib/he';

interface Thing {
  x: number;
  y: number;
  r: number;
  kind: number; // 0..5 fruit, 6 balloon, 7 coin, 8 decoy pig (a, b, c by `alt`)
  alt: number;
  rot: number;
  front: boolean;
}
const ROUNDS = 3;
const BALLOONS = ['#FF8FB0', '#7EC8F2', '#FFD45C', '#B48CF0'];

/**
 * מצאי אותו: a picnic blanket full of things, and somewhere in there, him (his
 * skin, his hat). Three finds make a level. Higher levels: more stuff, smaller,
 * he hides behind things, and other guinea pigs that look like him show up.
 */
export function FindGame({ look, level, onEnd, onClose }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const decoySkins = skins.filter((s) => s.id !== look.skin && !s.legend && s.price < 400).map((s) => s.id);
  const pickSkin = (i: number) => decoySkins[(i * 7 + level * 3) % decoySkins.length] ?? 'classic';
  const [me, meNode] = usePigSprite(look, 'happy', 120);
  // decoys wear no hat, so his hat is a clue; from level 6 some wear his hat too
  const [d1, d1Node] = usePigSprite({ skin: pickSkin(1), head: level >= 6 ? look.head : undefined }, 'happy', 120);
  const [d2, d2Node] = usePigSprite({ skin: pickSkin(2) }, 'smile', 120);
  const [d3, d3Node] = usePigSprite({ skin: pickSkin(3), head: level >= 8 ? look.head : undefined }, 'normal', 120);
  const [round, setRound] = useState(0);
  const [misses, setMisses] = useState(0);
  const g = useRef({ things: [] as Thing[], pig: { x: 0, y: 0, r: 30 }, made: -1, found: 0, t: 0, fx: new FX(), hint: 0, w: 0, h: 0 });

  const build = useCallback(
    (w: number, h: number) => {
      const s = g.current;
      const count = Math.min(90, 16 + level * 7);
      const size = Math.max(16, 34 - level * 1.6);
      const decoys = level >= 2 ? Math.min(10, (level - 1) * 2) : 0;
      const things: Thing[] = [];
      for (let i = 0; i < count; i++)
        things.push({ x: rand(20, w - 20), y: rand(30, h - 30), r: size * rand(0.85, 1.25), kind: Math.floor(Math.random() * 8), alt: Math.floor(Math.random() * 4), rot: rand(-0.8, 0.8), front: false });
      for (let i = 0; i < decoys; i++) things.push({ x: rand(30, w - 30), y: rand(40, h - 40), r: size * 1.5, kind: 8, alt: i % 3, rot: rand(-0.3, 0.3), front: false });
      const pr = size * 1.5;
      // never under the hint button at the bottom (it sits ~70px tall, centered)
      let px = rand(pr + 10, w - pr - 10);
      let py = rand(pr + 20, h - pr - 20);
      for (let k = 0; k < 30 && py + pr > h - 80 && Math.abs(px - w / 2) < 90 + pr; k++) {
        px = rand(pr + 10, w - pr - 10);
        py = rand(pr + 20, h - pr - 20);
      }
      if (py + pr > h - 80 && Math.abs(px - w / 2) < 90 + pr) py = h - 80 - pr;
      s.pig = { x: px, y: py, r: pr };
      // a few things sit in front of him so he's peeking from behind
      const cover = Math.min(4, Math.floor(level / 2));
      for (let i = 0; i < cover; i++) {
        const a = rand(0, Math.PI * 2);
        things.push({ x: s.pig.x + Math.cos(a) * pr * 0.75, y: s.pig.y + Math.sin(a) * pr * 0.6, r: size, kind: Math.floor(Math.random() * 6), alt: 0, rot: rand(-1, 1), front: true });
      }
      things.sort((a, b) => a.y - b.y);
      s.things = things;
      s.found = 0;
      s.hint = 0;
    },
    [level],
  );

  useCanvasLoop(canvas, (ctx, w, h, dt) => {
    const s = g.current;
    s.t += dt;
    if (s.made !== round || s.w !== w || s.h !== h) {
      s.made = round;
      s.w = w;
      s.h = h;
      build(w, h);
    }
    // a gingham picnic blanket
    ctx.fillStyle = '#FFF4EA';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(232,90,110,0.16)';
    for (let x = 0; x < w; x += 36) ctx.fillRect(x, 0, 18, h);
    for (let y = 0; y < h; y += 36) ctx.fillRect(0, y, w, 18);
    const decoys = [d1, d2, d3];
    const drawThing = (o: Thing) => {
      if (o.kind < 6) FRUITS[o.kind](ctx, o.x, o.y, o.r, o.rot);
      else if (o.kind === 6) balloon(ctx, o.x, o.y, o.r * 0.8, BALLOONS[o.alt % BALLOONS.length]);
      else if (o.kind === 7) coinSprite(ctx, o.x, o.y, o.r * 0.6, o.rot);
      else drawPig(ctx, decoys[o.alt], o.x, o.y, o.r * 2, o.rot);
    };
    for (const o of s.things) if (!o.front) drawThing(o);
    const p = s.pig;
    const found = s.found > 0;
    if (found) {
      s.found += dt;
      ctx.save();
      ctx.strokeStyle = '#E53950';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -s.t * 40;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1.3 + Math.sin(s.t * 8) * 0.06), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    drawPig(ctx, me, p.x, p.y - (found ? Math.abs(Math.sin(s.t * 10)) * 8 : 0), p.r * 2, found ? Math.sin(s.t * 10) * 0.15 : 0.05);
    for (const o of s.things) if (o.front && !found) drawThing(o);
    if (s.hint > 0) {
      s.hint -= dt;
      // a soft glow over the quarter he's in
      const qx = p.x < w / 2 ? 0 : w / 2;
      const qy = p.y < h / 2 ? 0 : h / 2;
      ctx.fillStyle = `rgba(255,214,90,${Math.min(0.35, s.hint * 0.2)})`;
      ctx.fillRect(qx, qy, w / 2, h / 2);
    }
    s.fx.draw(ctx, dt);
  });

  const poke = (e: React.PointerEvent) => {
    const s = g.current;
    if (s.found) return;
    const r = canvas.current!.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (Math.hypot(x - s.pig.x, y - s.pig.y) < s.pig.r * 1.05) {
      s.found = 0.01;
      squeak();
      tap(10);
      s.fx.burst(s.pig.x, s.pig.y, ['#E53950', '#FF9AB0', '#FFE38A'], 18, 220, 'heart');
      s.fx.text(s.pig.x, s.pig.y - s.pig.r - 12, 'מצאת אותי!', '#C2385A');
      window.setTimeout(() => {
        if (round + 1 >= ROUNDS) {
          tada();
          onEnd({ score: level, coins: Math.max(10, 18 + level * 6 - misses * 2), level: level + 1 });
        } else setRound((n) => n + 1);
      }, 1300);
      return;
    }
    const decoy = s.things.find((o) => o.kind === 8 && Math.hypot(x - o.x, y - o.y) < o.r);
    bonk();
    tap(18);
    setMisses((m) => m + 1);
    s.fx.text(x, y - 18, decoy ? 'זה לא אני!' : 'לא פה…', '#7A5F63');
  };

  return (
    <Stage title={p('מצא אותו', 'מצאי אותו')} level={level} score={`${round + 1}/${ROUNDS}`} onClose={onClose} bg="#FFF4EA">
      {meNode}
      {d1Node}
      {d2Node}
      {d3Node}
      <canvas ref={canvas} dir="ltr" className="absolute inset-0 size-full touch-none" onPointerDown={poke} />
      <button
        type="button"
        onClick={() => {
          g.current.hint = 2;
          tap(4);
        }}
        className="absolute bottom-[max(14px,env(safe-area-inset-bottom))] left-1/2 h-10 -translate-x-1/2 rounded-full bg-paper/95 px-5 text-[14px] font-bold shadow-soft"
      >
        רמז קטן
      </button>
    </Stage>
  );
}
