import { useRef, useState } from 'react';
import { tap } from '../../lib/haptics';
import { bonk, chirp, coin, squeak } from '../sound';
import { FX, Hint, Stage, TapToStart, announceLevel, drawPig, useBanner, useCanvasLoop, usePigSprite, type GameProps } from './kit';
import { carrot, strawberry } from './sprites';
import { species } from '../species';

type P = { x: number; y: number };
const COLS = 12;
const DIRS: Record<string, P> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const BABY = ['#F7C6A0', '#FFFFFF', '#E8B48A', '#C9A27E', '#F3DDBD'];

/**
 * רכבת: he leads a little train of babies. Swipe to turn; each
 * carrot adds a baby. Every 5 carrots is a level: the train speeds up, and from
 * level 3 rocks appear. Bumping a wall, a rock or the train costs a heart.
 */
export function SnakeGame({ look, onEnd, onClose }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [sprite, pigNode] = usePigSprite(look, 'happy', 90);
  const [hud, setHud] = useState({ score: 0, hearts: 3, level: 1 });
  const [started, setStarted] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [banner, show] = useBanner();
  const g = useRef({
    body: [] as P[],
    prev: [] as P[],
    dir: DIRS.right,
    queue: [] as P[],
    food: { x: 8, y: 5 } as P,
    gold: null as P | null,
    rocks: [] as P[],
    rows: 16,
    acc: 0,
    eaten: 0,
    score: 0,
    hearts: 3,
    level: 1,
    over: false,
    t: 0,
    hurt: 0,
    fx: new FX(),
    grow: 0,
    ready: false,
    wait: true,
  });

  const free = (): P => {
    const s = g.current;
    for (let k = 0; k < 200; k++) {
      const p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * s.rows) };
      if (![...s.body, ...s.rocks, s.food].some((q) => q.x === p.x && q.y === p.y)) return p;
    }
    return { x: 0, y: 0 };
  };
  const reset = () => {
    const s = g.current;
    const cy = Math.floor(s.rows / 2);
    s.body = [
      { x: 4, y: cy },
      { x: 3, y: cy },
      { x: 2, y: cy },
    ];
    s.prev = s.body.map((p) => ({ ...p }));
    s.dir = DIRS.right;
    s.queue = [];
    // the train waits for her next swipe, so a new start is never an instant crash
    s.wait = true;
  };

  const turn = (d: P) => {
    const s = g.current;
    if (s.over) return;
    if (!started) setStarted(true);
    const last = s.queue[s.queue.length - 1] ?? s.dir;
    if (!s.wait && last.x === -d.x && last.y === -d.y) return;
    if (!s.wait && last.x === d.x && last.y === d.y) return;
    if (s.wait) {
      s.wait = false;
      s.acc = 0;
      // first swipe of a run may turn any way except straight back into the train
      if (!(d.x === -s.dir.x && d.y === -s.dir.y)) s.dir = d;
      setWaiting(false);
      tap(3);
      return;
    }
    if (s.queue.length < 3) s.queue.push(d);
    tap(3);
  };

  useCanvasLoop(canvas, (ctx, w, h, dt) => {
    const s = g.current;
    s.t += dt;
    const cell = w / COLS;
    if (!s.ready) {
      s.ready = true;
      s.rows = Math.max(10, Math.floor(h / cell));
      reset();
      s.food = free();
    }
    const offY = (h - s.rows * cell) / 2;
    // a checkered meadow
    for (let y = 0; y < s.rows; y++)
      for (let x = 0; x < COLS; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#BFE6A6' : '#B2DE96';
        ctx.fillRect(x * cell, offY + y * cell, cell + 0.5, cell + 0.5);
      }
    ctx.fillStyle = '#9CCB80';
    ctx.fillRect(0, 0, w, offY);
    ctx.fillRect(0, offY + s.rows * cell, w, offY + 2);

    ctx.save();
    s.fx.pre(ctx, dt);
    const step = Math.max(0.075, 0.2 - s.level * 0.016);
    const play = started && !s.over && !s.wait;
    if (play) {
      s.acc += dt;
      while (s.acc >= step) {
        s.acc -= step;
        tick();
      }
    }
    const k = play ? s.acc / step : 1;
    const at = (i: number) => {
      const a = s.prev[i] ?? s.body[i];
      const b = s.body[i];
      // no gliding across the board when he wraps or respawns
      if (Math.abs(a.x - b.x) > 1 || Math.abs(a.y - b.y) > 1) return { x: b.x, y: b.y };
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    };

    for (const r of s.rocks) {
      const cx = r.x * cell + cell / 2;
      const cy = offY + r.y * cell + cell / 2;
      ctx.fillStyle = '#A9A3A6';
      ctx.strokeStyle = '#3B2216';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, cell * 0.42, cell * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    carrot(ctx, s.food.x * cell + cell / 2, offY + s.food.y * cell + cell / 2 + Math.sin(s.t * 5) * 2, cell * 0.42, 0.5);
    if (s.gold) strawberry(ctx, s.gold.x * cell + cell / 2, offY + s.gold.y * cell + cell / 2, cell * 0.42, Math.sin(s.t * 4) * 0.3);

    // the babies, back to front, each a round fluffy pig with ears
    s.hurt = Math.max(0, s.hurt - dt);
    const blink = s.hurt > 0 && Math.floor(s.t * 14) % 2;
    for (let i = s.body.length - 1; i >= 1; i--) {
      if (blink) break;
      const p = at(i);
      const cx = p.x * cell + cell / 2;
      const cy = offY + p.y * cell + cell / 2;
      const bob = Math.sin(s.t * 12 + i) * 1.5;
      const r = cell * 0.4;
      ctx.fillStyle = BABY[i % BABY.length];
      ctx.strokeStyle = '#3B2216';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx - r * 0.55, cy - r * 0.7 + bob, r * 0.32, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.55, cy - r * 0.7 + bob, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy + bob, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3B2216';
      ctx.beginPath();
      ctx.arc(cx - r * 0.35, cy - r * 0.1 + bob, 2, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.35, cy - r * 0.1 + bob, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F5A3B5';
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.25 + bob, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!blink) {
      const hd = at(0);
      drawPig(ctx, sprite, hd.x * cell + cell / 2, offY + hd.y * cell + cell / 2 - 4, cell * 1.55, s.dir.x * 0.12);
    }
    s.fx.draw(ctx, dt);
    ctx.restore();
  });

  function tick() {
    const s = g.current;
    if (s.queue.length) s.dir = s.queue.shift()!;
    const head = s.body[0];
    const nx = head.x + s.dir.x;
    const ny = head.y + s.dir.y;
    const hitWall = nx < 0 || ny < 0 || nx >= COLS || ny >= s.rows;
    const hitSelf = s.body.slice(0, -1).some((p) => p.x === nx && p.y === ny);
    const hitRock = s.rocks.some((p) => p.x === nx && p.y === ny);
    if (hitWall || hitSelf || hitRock) {
      s.hearts -= 1;
      s.hurt = 1.4;
      bonk();
      tap(40);
      s.fx.kick(12);
      setHud((v) => ({ ...v, hearts: s.hearts }));
      if (s.hearts <= 0) {
        s.over = true;
        window.setTimeout(() => onEnd({ score: s.score, coins: Math.min(160, s.score * 2), level: s.level }), 800);
        return;
      }
      reset();
      setWaiting(true);
      return;
    }
    s.prev = s.body.map((p) => ({ ...p }));
    s.body.unshift({ x: nx, y: ny });
    // each car slides from where it was (prev[i]) to where the one ahead of it was
    if (s.grow > 0) s.grow -= 1;
    else s.body.pop();
    const cell = { x: nx, y: ny };
    if (cell.x === s.food.x && cell.y === s.food.y) {
      s.grow += 1;
      s.eaten += 1;
      s.score += s.level;
      chirp();
      tap(5);
      s.food = free();
      if (!s.gold && Math.random() < 0.18) s.gold = free();
      if (s.eaten % 5 === 0) {
        s.level += 1;
        announceLevel(show, s.level, s.level >= 3 ? 'נזהרים מהסלעים' : 'יותר מהר');
        if (s.level >= 3) for (let i = 0; i < 2; i++) s.rocks.push(free());
        squeak();
      }
      setHud({ score: s.score, hearts: s.hearts, level: s.level });
    } else if (s.gold && cell.x === s.gold.x && cell.y === s.gold.y) {
      s.gold = null;
      s.score += 5;
      coin();
      setHud((v) => ({ ...v, score: s.score }));
    }
  }

  const start = useRef<P | null>(null);
  return (
    <Stage title={`רכבת ${species.plural}`} score={hud.score} hearts={hud.hearts} level={hud.level} onClose={onClose} banner={banner} bg="#9CCB80">
      {pigNode}
      <canvas
        ref={canvas}
        dir="ltr"
        className="absolute inset-0 size-full touch-none"
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          const a = start.current;
          if (!a) return;
          const dx = e.clientX - a.x;
          const dy = e.clientY - a.y;
          if (Math.hypot(dx, dy) < 24) return;
          turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? DIRS.right : DIRS.left) : dy > 0 ? DIRS.down : DIRS.up);
          start.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => (start.current = null)}
      />
      <TapToStart show={waiting && !g.current.over} text={started ? 'מחליקים כדי להמשיך' : 'מחליקים לכיוון שהוא צריך לפנות'} />
      <Hint show={started && hud.score === 0} className="top-6 text-ink/60">
        מחליקים למעלה, למטה או לצדדים
      </Hint>
    </Stage>
  );
}
