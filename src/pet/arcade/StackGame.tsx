import { useRef, useState } from 'react';
import { tap } from '../../lib/haptics';
import { bonk, note, sparkle } from '../sound';
import { FX, Hint, Stage, TapToStart, announceLevel, drawPig, useBanner, useCanvasLoop, usePigSprite, type GameProps } from './kit';

interface Layer {
  x: number;
  w: number;
  color: string;
}
interface Crumb {
  x: number;
  y: number;
  w: number;
  vy: number;
  vx: number;
  rot: number;
  color: string;
}
const FLAVORS = ['#F7B9C8', '#FFE08A', '#BFE3FF', '#C9EDB6', '#FFD3B0', '#E5D4FF', '#FFC2C2'];
const LH = 28;

/**
 * מגדל עוגה: a cake layer slides back and forth; she taps to drop it. Whatever
 * hangs over the layer below is sliced off and falls. A perfect drop is a "בול!"
 * and, after a few in a row, the layer grows back a little. It slides faster
 * as the tower climbs; he sits on top. One miss ends it.
 */
export function StackGame({ look, onEnd, onClose }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [sprite, pigNode] = usePigSprite(look, 'happy', 110);
  const [hud, setHud] = useState({ score: 0, level: 1 });
  const [started, setStarted] = useState(false);
  const [banner, show] = useBanner(900);
  const g = useRef({
    stack: [] as Layer[],
    cur: { x: 0, w: 0, color: FLAVORS[0] } as Layer,
    dir: 1,
    crumbs: [] as Crumb[],
    cam: 0,
    perfect: 0,
    over: false,
    t: 0,
    fx: new FX(),
    w: 400,
    level: 1,
    drop: 0,
    curY: 0,
  });

  useCanvasLoop(canvas, (ctx, w, h, dt) => {
    const s = g.current;
    s.t += dt;
    s.w = w;
    if (!s.stack.length) {
      const bw = Math.min(220, w * 0.58);
      s.stack = [{ x: (w - bw) / 2, w: bw, color: '#E9C8A8' }];
      s.cur = { x: 0, w: bw, color: FLAVORS[0] };
    }
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#FFE9F0');
    bg.addColorStop(1, '#FFF7EC');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // a lace doily and a cake stand at the bottom
    const n = s.stack.length;
    const targetCam = Math.max(0, n * LH - h * 0.45);
    s.cam += (targetCam - s.cam) * Math.min(1, dt * 5);
    const base = h - 90 + s.cam;
    ctx.save();
    s.fx.pre(ctx, dt);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = 'rgba(194,56,90,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(w / 2, base + 14, Math.min(170, w * 0.44), 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E8D5C4';
    ctx.fillRect(w / 2 - 10, base + 28, 20, 60);

    const top = s.stack[n - 1];
    const speed = 150 + n * 7 + s.level * 10;
    const curY = base - n * LH;
    s.curY = curY;
    if (started && !s.over) {
      s.cur.x += s.dir * speed * dt;
      if (s.cur.x + s.cur.w > w + 30) s.dir = -1;
      if (s.cur.x < -30) s.dir = 1;
    }
    s.stack.forEach((l, i) => drawLayer(ctx, l.x, base - (i + 1) * LH + LH, l.w, l.color, i === 0));
    if (!s.over) drawLayer(ctx, s.cur.x, curY, s.cur.w, s.cur.color, false);
    // him, riding on the layer that's sliding (or on top of the tower once it's all over)
    const ride = s.over ? top : s.cur;
    drawPig(ctx, sprite, ride.x + ride.w / 2, (s.over ? curY + LH : curY) - LH - 24 - s.drop * 18, 58, s.over ? 0 : s.dir * 0.08, s.drop > 0 ? 1 - s.drop * 0.15 : 1);
    s.drop = Math.max(0, s.drop - dt * 3);

    for (let i = s.crumbs.length - 1; i >= 0; i--) {
      const c = s.crumbs[i];
      c.vy += 1200 * dt;
      c.y += c.vy * dt;
      c.x += c.vx * dt;
      c.rot += c.vx * 0.002;
      if (c.y > h + s.cam + 200) {
        s.crumbs.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.translate(c.x + c.w / 2, c.y);
      ctx.rotate(c.rot);
      drawLayer(ctx, -c.w / 2, 0, c.w, c.color, false);
      ctx.restore();
    }
    s.fx.draw(ctx, dt);
    ctx.restore();
  });

  const drop = () => {
    const s = g.current;
    if (s.over) return;
    if (!started) {
      setStarted(true);
      return;
    }
    const n = s.stack.length;
    const top = s.stack[n - 1];
    const left = Math.max(top.x, s.cur.x);
    const right = Math.min(top.x + top.w, s.cur.x + s.cur.w);
    if (right <= left) {
      // a total miss: the layer tumbles, and that's the tower
      s.over = true;
      s.crumbs.push({ x: s.cur.x, y: s.curY, w: s.cur.w, vy: 0, vx: s.dir * 80, rot: 0, color: s.cur.color });
      bonk();
      tap(40);
      s.fx.kick(14);
      const score = n - 1;
      window.setTimeout(() => onEnd({ score, coins: Math.min(170, score * 4), level: s.level }), 1000);
      return;
    }
    let w = right - left;
    const off = Math.abs(s.cur.x - top.x);
    if (off < 5) {
      // a perfect one: snap it on, and after a streak grow back a bit
      s.perfect += 1;
      w = top.w;
      const grown = s.perfect >= 3 ? Math.min(Math.min(240, s.w * 0.62), w + 10) : w;
      s.stack.push({ x: top.x - (grown - w) / 2, w: grown, color: s.cur.color });
      note(s.perfect + 2, 0.08);
      sparkle();
      show(s.perfect >= 3 ? `בול! ×${s.perfect}` : 'בול!');
      s.fx.burst(top.x + top.w / 2, s.curY - LH / 2, ['#fff', '#FFE38A'], 14, 160, 'star');
    } else {
      s.perfect = 0;
      const cutX = s.cur.x < top.x ? s.cur.x : right;
      const cutW = s.cur.w - w;
      s.crumbs.push({ x: cutX, y: s.curY, w: cutW, vy: -40, vx: s.cur.x < top.x ? -60 : 60, rot: 0, color: s.cur.color });
      s.stack.push({ x: left, w, color: s.cur.color });
      note(0, 0.06);
    }
    tap(6);
    s.drop = 1;
    const count = s.stack.length - 1;
    const nl = 1 + Math.floor(count / 10);
    if (nl > s.level) {
      s.level = nl;
      announceLevel(show, nl);
    }
    setHud({ score: count, level: s.level });
    const last = s.stack[s.stack.length - 1];
    s.cur = { x: s.dir > 0 ? -last.w * 0.5 : s.w - last.w * 0.5, w: last.w, color: FLAVORS[count % FLAVORS.length] };
  };

  return (
    <Stage title="מגדל עוגה" score={hud.score} level={hud.level} onClose={onClose} banner={banner} bg="#FFE9F0">
      {pigNode}
      <canvas ref={canvas} dir="ltr" className="absolute inset-0 size-full touch-none" onPointerDown={drop} />
      <TapToStart show={!started} text="נוגעים כדי להתחיל לבנות" />
      <Hint show={started && hud.score < 2} className="top-6 text-ink/60">
        נוגעים כשהשכבה בדיוק מעל הקודמת
      </Hint>
    </Stage>
  );
}

function drawLayer(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string, plate: boolean) {
  if (w <= 0) return;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#3B2216';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y - LH, w, LH - 2, 6);
  ctx.fill();
  ctx.stroke();
  if (!plate) {
    // a cream drip along the top
    ctx.fillStyle = '#FFFDF8';
    ctx.beginPath();
    ctx.moveTo(x + 3, y - LH + 2);
    for (let k = 0; k <= w - 6; k += 12) {
      ctx.lineTo(x + 3 + k, y - LH + 2);
      ctx.quadraticCurveTo(x + 9 + k, y - LH + 9 + ((k / 12) % 2) * 4, x + 15 + k, y - LH + 2);
    }
    ctx.lineTo(x + w - 3, y - LH + 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x + 6, y - 10, w - 12, 3);
  ctx.restore();
}
