import { useRef, useState } from 'react';
import { tap } from '../../lib/haptics';
import { boom, bonk, coin, pop } from '../sound';
import { FX, Hint, Stage, announceLevel, drawHeart, rand, useBanner, useCanvasLoop, type GameProps } from './kit';
import { balloon, bomb, cloud } from './sprites';

interface B {
  x: number;
  y: number;
  vy: number;
  sway: number;
  r: number;
  kind: 'plain' | 'gold' | 'bomb' | 'heart';
  color: string;
}
const COLORS = ['#FF8FB0', '#7EC8F2', '#FFD45C', '#8FD06A', '#B48CF0', '#FF9A62'];

/**
 * בלונים: balloons float up; tap to pop them before they escape off the top.
 * Gold ones are worth 5, a heart balloon gives a heart back, a bomb balloon
 * costs one. An escaped balloon costs a heart. Every 15 pops is a level: more,
 * faster, smaller.
 */
export function BalloonGame({ onEnd, onClose }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ score: 0, hearts: 3, level: 1 });
  const [banner, show] = useBanner();
  const g = useRef({ bs: [] as B[], next: 0.6, score: 0, popped: 0, hearts: 3, level: 1, over: false, t: 0, fx: new FX(), w: 400, h: 700 });

  const hurt = () => {
    const s = g.current;
    if (s.over) return;
    s.hearts -= 1;
    bonk();
    tap(40);
    s.fx.kick(12);
    setHud((v) => ({ ...v, hearts: s.hearts }));
    if (s.hearts <= 0) {
      s.over = true;
      window.setTimeout(() => onEnd({ score: s.score, coins: Math.min(160, Math.round(s.score * 1.5)), level: s.level }), 800);
    }
  };

  useCanvasLoop(canvas, (ctx, w, h, dt) => {
    const s = g.current;
    s.t += dt;
    s.w = w;
    s.h = h;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#FFE1EC');
    bg.addColorStop(1, '#E3F1FF');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) cloud(ctx, ((i * 160 + s.t * 10) % (w + 160)) - 80, 120 + i * 150, 110, 0.6);
    ctx.save();
    s.fx.pre(ctx, dt);
    const lv = s.level;
    if (!s.over) {
      s.next -= dt;
      if (s.next <= 0) {
        s.next = Math.max(0.32, 1.0 - lv * 0.07) * rand(0.6, 1.2);
        const roll = Math.random();
        const kind: B['kind'] = roll < Math.min(0.2, 0.06 + lv * 0.02) ? 'bomb' : roll > 0.95 ? 'gold' : roll > 0.93 && s.hearts < 3 ? 'heart' : 'plain';
        const r = Math.max(20, 32 - lv * 1.2) * rand(0.9, 1.15);
        s.bs.push({ x: rand(r + 8, w - r - 8), y: h + r * 2.6, vy: rand(60, 90) + lv * 14, sway: rand(0, 6), r, kind, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
      }
    }
    for (let i = s.bs.length - 1; i >= 0; i--) {
      const b = s.bs[i];
      if (!s.over) b.y -= b.vy * dt;
      const x = b.x + Math.sin(s.t * 1.6 + b.sway) * 12;
      if (b.kind === 'bomb') {
        balloon(ctx, x, b.y, b.r, '#5A5060', s.t + b.sway);
        bomb(ctx, x, b.y + b.r * 2.6, b.r * 0.6, s.t);
      } else if (b.kind === 'gold') balloon(ctx, x, b.y, b.r, '#F2C14E', s.t + b.sway);
      else balloon(ctx, x, b.y, b.r, b.kind === 'heart' ? '#E53950' : b.color, s.t + b.sway);
      if (b.kind === 'heart') drawHeart(ctx, x, b.y, b.r * 0.45, '#fff');
      if (b.kind === 'gold') {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = `800 ${b.r * 0.6}px 'Assistant', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('5', x, b.y + 1);
      }
      if (b.y < -b.r * 1.5) {
        s.bs.splice(i, 1);
        if (b.kind !== 'bomb' && !s.over) {
          s.fx.text(Math.min(w - 40, Math.max(40, x)), 24, 'ברח!', '#9E1F35');
          hurt();
        }
      }
    }
    s.fx.draw(ctx, dt);
    ctx.restore();
  });

  const poke = (e: React.PointerEvent) => {
    const s = g.current;
    if (s.over) return;
    const r = canvas.current!.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    // the balloon closest to her finger (a generous target)
    let best = -1;
    let bd = Infinity;
    s.bs.forEach((b, i) => {
      const x = b.x + Math.sin(s.t * 1.6 + b.sway) * 12;
      const d = Math.hypot(px - x, (py - b.y) * 0.85);
      if (d < b.r * 1.35 && d < bd) {
        bd = d;
        best = i;
      }
    });
    if (best < 0) return;
    const b = s.bs.splice(best, 1)[0];
    const x = b.x + Math.sin(s.t * 1.6 + b.sway) * 12;
    if (b.kind === 'bomb') {
      boom();
      s.fx.burst(x, b.y, ['#FFD45C', '#FF8A3D', '#5A5060'], 26, 300);
      hurt();
      return;
    }
    pop();
    tap(6);
    s.popped += 1;
    const pts = b.kind === 'gold' ? 5 : 1;
    s.score += pts;
    if (b.kind === 'gold') coin();
    if (b.kind === 'heart') {
      s.hearts = Math.min(3, s.hearts + 1);
      s.fx.text(x, b.y - 20, 'לב!', '#E53950');
    } else s.fx.text(x, b.y - 20, `+${pts}`, b.kind === 'gold' ? '#C98A1E' : '#C2385A');
    s.fx.burst(x, b.y, [b.kind === 'gold' ? '#F2C14E' : b.color, '#fff'], 14, 230, Math.random() < 0.3 ? 'heart' : 'dot', 300);
    const nl = 1 + Math.floor(s.popped / 15);
    if (nl > s.level) {
      s.level = nl;
      announceLevel(show, nl);
    }
    setHud({ score: s.score, hearts: s.hearts, level: s.level });
  };

  return (
    <Stage title="בלונים" score={hud.score} hearts={hud.hearts} level={hud.level} onClose={onClose} banner={banner} bg="#FFE1EC">
      <canvas ref={canvas} dir="ltr" className="absolute inset-0 size-full touch-none" onPointerDown={poke} />
      <Hint show={hud.score === 0} className="top-[25%] text-ink/60">
        נוגעים בבלונים לפני שהם בורחים למעלה
      </Hint>
    </Stage>
  );
}
