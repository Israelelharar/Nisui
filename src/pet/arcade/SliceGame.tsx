import { useRef, useState } from 'react';
import { tap } from '../../lib/haptics';
import { boom, bonk, coin, slice as sliceSound, whoosh } from '../sound';
import { FX, Hint, Stage, announceLevel, rand, useBanner, useCanvasLoop, type GameProps } from './kit';
import { FRUITS, FRUIT_JUICE, bomb } from './sprites';

interface Fruit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  spin: number;
  kind: number;
  bomb: boolean;
  r: number;
  cut: boolean;
}
interface Half {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  spin: number;
  kind: number;
  side: 1 | -1;
  r: number;
  life: number;
}
interface Splat {
  x: number;
  y: number;
  r: number;
  color: string;
  life: number;
}

/**
 * חותכים פירות: fruit is tossed up; she swipes to slice. Several in one swipe
 * is a combo. A bomb costs a heart, and every three fruits that fall uncut cost
 * one too. Each level throws more at once, faster, with more bombs.
 */
export function SliceGame({ onEnd, onClose }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ score: 0, hearts: 3, level: 1, missed: 0 });
  const [banner, show] = useBanner();
  const g = useRef({
    fruits: [] as Fruit[],
    halves: [] as Half[],
    splats: [] as Splat[],
    trail: [] as { x: number; y: number; t: number }[],
    down: false,
    wave: 1,
    score: 0,
    hearts: 3,
    missed: 0,
    level: 1,
    over: false,
    t: 0,
    fx: new FX(),
    swipeCut: 0,
    w: 400,
    h: 700,
  });

  const toss = () => {
    const s = g.current;
    const n = Math.min(6, 1 + Math.floor(Math.random() * (1 + s.level * 0.7)));
    for (let i = 0; i < n; i++) {
      const isBomb = Math.random() < Math.min(0.28, 0.06 + s.level * 0.03);
      const x = rand(0.15, 0.85) * s.w;
      s.fruits.push({
        x,
        y: s.h + 30,
        vx: (s.w / 2 - x) * rand(0.25, 0.6) + rand(-40, 40),
        vy: -rand(0.95, 1.18) * Math.sqrt(2 * 900 * s.h * 0.72) * (1 + s.level * 0.015),
        rot: rand(0, 6),
        spin: rand(-4, 4),
        kind: Math.floor(Math.random() * FRUITS.length),
        bomb: isBomb,
        r: isBomb ? 26 : 30,
        cut: false,
      });
    }
    whoosh();
  };

  useCanvasLoop(canvas, (ctx, w, h, dt) => {
    const s = g.current;
    s.t += dt;
    s.w = w;
    s.h = h;
    const gravity = 900 * (1 + s.level * 0.04);
    // a wooden chopping board
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#C98C58');
    bg.addColorStop(1, '#A86E3E');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(70,40,15,0.18)';
    ctx.lineWidth = 2;
    for (let y = 30; y < h; y += 46) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.02 + y) * 4);
      ctx.stroke();
    }
    ctx.save();
    s.fx.pre(ctx, dt);
    // juice stains that slowly fade
    for (let i = s.splats.length - 1; i >= 0; i--) {
      const p = s.splats[i];
      p.life -= dt * 0.25;
      if (p.life <= 0) {
        s.splats.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.life * 0.5;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (!s.over && !s.fruits.length) {
      s.wave -= dt;
      if (s.wave <= 0) {
        s.wave = Math.max(0.35, 1.1 - s.level * 0.08);
        toss();
      }
    }
    for (let i = s.fruits.length - 1; i >= 0; i--) {
      const f = s.fruits[i];
      f.vy += gravity * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.spin * dt;
      if (f.bomb) bomb(ctx, f.x, f.y, f.r, s.t);
      else FRUITS[f.kind](ctx, f.x, f.y, f.r, f.rot);
      if (f.y > h + 60 && f.vy > 0) {
        s.fruits.splice(i, 1);
        if (!f.bomb && !s.over) {
          s.missed += 1;
          if (s.missed >= 3) {
            s.missed = 0;
            hurt();
          }
          setHud((v) => ({ ...v, missed: s.missed }));
        }
      }
    }
    for (let i = s.halves.length - 1; i >= 0; i--) {
      const p = s.halves[i];
      p.life -= dt;
      p.vy += gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      if (p.life <= 0 || p.y > h + 60) {
        s.halves.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.beginPath();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.rect(p.side === 1 ? 0 : -p.r * 1.4, -p.r * 1.4, p.r * 1.4, p.r * 2.8);
      ctx.clip();
      FRUITS[p.kind](ctx, 0, 0, p.r, 0);
      ctx.restore();
    }

    // her blade: a bright tapering ribbon that fades behind the finger
    const now = performance.now();
    s.trail = s.trail.filter((p) => now - p.t < 140);
    if (s.trail.length > 1) {
      for (let i = 1; i < s.trail.length; i++) {
        const a = s.trail[i - 1];
        const b = s.trail[i];
        const k = i / s.trail.length;
        ctx.strokeStyle = `rgba(255,255,255,${0.35 + k * 0.6})`;
        ctx.lineWidth = 2 + k * 9;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#FFF4C2';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }
    s.fx.draw(ctx, dt);
    ctx.restore();
  });

  const hurt = () => {
    const s = g.current;
    if (s.over) return;
    s.hearts -= 1;
    bonk();
    tap(40);
    s.fx.kick(16);
    setHud((v) => ({ ...v, hearts: s.hearts }));
    if (s.hearts <= 0) {
      s.over = true;
      window.setTimeout(() => onEnd({ score: s.score, coins: Math.min(160, Math.round(s.score / 2)), level: s.level }), 900);
    }
  };

  const cutAlong = (ax: number, ay: number, bx: number, by: number) => {
    const s = g.current;
    for (let i = s.fruits.length - 1; i >= 0; i--) {
      const f = s.fruits[i];
      // distance from the fruit's center to the swipe segment
      const vx = bx - ax;
      const vy = by - ay;
      const len = vx * vx + vy * vy || 1;
      const t = Math.max(0, Math.min(1, ((f.x - ax) * vx + (f.y - ay) * vy) / len));
      const d = Math.hypot(ax + vx * t - f.x, ay + vy * t - f.y);
      if (d > f.r) continue;
      s.fruits.splice(i, 1);
      if (f.bomb) {
        boom();
        s.fx.burst(f.x, f.y, ['#FFD45C', '#FF8A3D', '#5A5060', '#fff'], 30, 320);
        s.fx.text(f.x, f.y - 20, 'בום!', '#9E1F35');
        hurt();
        continue;
      }
      s.swipeCut += 1;
      const ang = Math.atan2(vy, vx);
      for (const side of [1, -1] as const)
        s.halves.push({ x: f.x, y: f.y, vx: f.vx + Math.cos(ang + (side * Math.PI) / 2) * 90, vy: f.vy * 0.4 - 80, rot: ang + Math.PI / 2, spin: side * 3, kind: f.kind, side, r: f.r, life: 2 });
      const juice = FRUIT_JUICE[f.kind];
      s.fx.burst(f.x, f.y, [juice, '#fff'], 14, 240);
      s.splats.push({ x: f.x, y: f.y, r: rand(16, 28), color: juice, life: 1 });
      s.score += 1;
      sliceSound();
      tap(6);
    }
  };

  const point = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <Stage title="חותכים פירות" score={hud.score} hearts={hud.hearts} level={hud.level} onClose={onClose} banner={banner} bg="#B67A47" dark>
      <canvas
        ref={canvas}
        dir="ltr"
        className="absolute inset-0 size-full touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const s = g.current;
          s.down = true;
          s.swipeCut = 0;
          const p = point(e);
          s.trail = [{ ...p, t: performance.now() }];
        }}
        onPointerMove={(e) => {
          const s = g.current;
          if (!s.down || s.over) return;
          const p = point(e);
          const last = s.trail[s.trail.length - 1];
          if (last) cutAlong(last.x, last.y, p.x, p.y);
          s.trail.push({ ...p, t: performance.now() });
        }}
        onPointerUp={() => {
          const s = g.current;
          s.down = false;
          if (s.swipeCut >= 3) {
            const bonus = s.swipeCut * 2;
            s.score += bonus;
            coin();
            show(`קומבו ${s.swipeCut}! +${bonus}`);
          }
          const nl = 1 + Math.floor(s.score / 30);
          if (nl > s.level) {
            s.level = nl;
            announceLevel(show, nl);
          }
          setHud((v) => ({ ...v, score: s.score, level: s.level }));
          s.swipeCut = 0;
        }}
      />
      <div className="pointer-events-none absolute top-2 left-3 flex gap-1" aria-label="פירות שנפלו">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`font-hand text-[18px] font-bold ${i < hud.missed ? 'text-[#FFD45C]' : 'text-white/20'}`}>
            ✕
          </span>
        ))}
      </div>
      <Hint show={hud.score === 0} className="top-[30%] text-white/85">
        מחליקים את האצבע דרך הפירות. לא בפצצות!
      </Hint>
    </Stage>
  );
}
