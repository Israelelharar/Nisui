import { useRef, useState } from 'react';
import { tap } from '../../lib/haptics';
import { bonk, chirp, flap } from '../sound';
import { FX, Hint, Stage, TapToStart, announceLevel, drawPig, pick, rand, useBanner, useCanvasLoop, usePigSprite, type GameProps } from './kit';
import { carrot, cloud } from './sprites';

type Kind = 'hay' | 'rock' | 'bush' | 'bird' | 'tall';
interface Thing {
  x: number;
  kind: Kind;
  w: number;
  h: number;
  y: number;
}
interface Treat {
  x: number;
  y: number;
}

/**
 * הריצה הגדולה: he runs; she taps to jump (a second tap in the air jumps again).
 * Hay bales, rocks, bushes, and from level 3 birds; it keeps speeding up.
 * Carrots in the air are bonus points. Three hearts.
 */
export function RunnerGame({ look, onEnd, onClose }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [sprite, pigNode] = usePigSprite(look, 'happy', 130);
  const [hud, setHud] = useState({ score: 0, hearts: 3, level: 1 });
  const [started, setStarted] = useState(false);
  const [banner, show] = useBanner();
  const g = useRef({
    y: 0,
    vy: 0,
    jumps: 0,
    things: [] as Thing[],
    treats: [] as Treat[],
    next: 1.2,
    dist: 0,
    bonus: 0,
    hearts: 3,
    level: 1,
    over: false,
    t: 0,
    hurt: 0,
    fx: new FX(),
    speed: 260,
  });

  const jump = () => {
    const s = g.current;
    if (s.over) return;
    if (!started) {
      setStarted(true);
      return;
    }
    if (s.jumps >= 2) return;
    s.vy = s.jumps ? -560 : -640;
    s.jumps += 1;
    flap();
    tap(4);
    s.fx.burst(w0.current.px, w0.current.ground, ['#E2C9A0', '#fff'], 6, 80);
  };
  const w0 = useRef({ px: 80, ground: 400 });

  useCanvasLoop(canvas, (ctx, w, h, dt) => {
    const s = g.current;
    s.t += dt;
    const ground = h - 90;
    const px = Math.min(110, w * 0.24);
    w0.current = { px, ground };
    const run = started && !s.over;
    if (run) {
      s.speed = 260 + s.level * 34 + Math.min(120, s.dist * 0.004);
      s.dist += s.speed * dt;
    }
    const dx = run ? s.speed * dt : 0;
    // a warm afternoon: sky, far mountains, near hills, fence
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#FFD9B8');
    sky.addColorStop(0.55, '#FFF1DE');
    sky.addColorStop(1, '#FFF7EC');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) cloud(ctx, ((((i * 220 - s.dist * 0.08) % (w + 240)) + w + 240) % (w + 240)) - 100, 60 + i * 40, 100, 0.85);
    ctx.fillStyle = '#E9C3B5';
    ctx.beginPath();
    ctx.moveTo(0, ground);
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, ground - 120 - Math.abs(Math.sin((x + s.dist * 0.15) * 0.008)) * 70);
    ctx.lineTo(w, ground);
    ctx.fill();
    ctx.fillStyle = '#BFE3A2';
    ctx.beginPath();
    ctx.moveTo(0, ground);
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, ground - 40 - Math.sin((x + s.dist * 0.4) * 0.015) * 16);
    ctx.lineTo(w, ground);
    ctx.fill();

    ctx.save();
    s.fx.pre(ctx, dt);
    ctx.fillStyle = '#9FD56E';
    ctx.fillRect(0, ground, w, 10);
    ctx.fillStyle = '#D9AE74';
    ctx.fillRect(0, ground + 10, w, h - ground);
    ctx.fillStyle = 'rgba(120,80,40,0.22)';
    for (let x = -(s.dist % 36); x < w; x += 36) ctx.fillRect(x, ground + 26, 16, 4);

    if (run) {
      s.next -= dt;
      if (s.next <= 0) {
        const kinds: Kind[] = s.level >= 3 ? ['hay', 'rock', 'bush', 'bird', 'tall'] : s.level >= 2 ? ['hay', 'rock', 'bush', 'tall'] : ['hay', 'rock', 'bush'];
        const kind = pick(kinds);
        const size = { hay: [44, 38], rock: [40, 28], bush: [52, 34], bird: [40, 26], tall: [36, 64] }[kind];
        s.things.push({ x: w + 30, kind, w: size[0], h: size[1], y: kind === 'bird' ? ground - rand(70, 120) : ground - size[1] });
        if (Math.random() < 0.55) s.treats.push({ x: w + 30 + rand(120, 220), y: ground - rand(70, 150) });
        s.next = Math.max(0.62, rand(1.0, 1.7) - s.level * 0.07);
      }
    }
    s.vy += 1800 * dt;
    s.y = Math.min(0, s.y + s.vy * dt);
    if (s.y === 0) {
      s.vy = 0;
      s.jumps = 0;
    }
    const py = ground + s.y - 26;

    const lose = () => {
      if (s.hurt > 0 || s.over) return;
      s.hearts -= 1;
      s.hurt = 1.5;
      s.fx.kick(14);
      s.fx.burst(px, py, ['#E53950', '#FF9AB0'], 12, 170, 'heart');
      bonk();
      tap(40);
      setHud((v) => ({ ...v, hearts: s.hearts }));
      if (s.hearts <= 0) {
        s.over = true;
        const score = Math.floor(s.dist / 50) + s.bonus;
        window.setTimeout(() => onEnd({ score, coins: Math.min(170, Math.round(score / 2)), level: s.level }), 900);
      }
    };

    for (let i = s.things.length - 1; i >= 0; i--) {
      const o = s.things[i];
      o.x -= dx * (o.kind === 'bird' ? 1.25 : 1);
      drawThing(ctx, o, s.t);
      if (px + 20 > o.x + 6 && px - 20 < o.x + o.w - 6 && py + 22 > o.y + 4 && py - 18 < o.y + o.h) lose();
      if (o.x < -80) s.things.splice(i, 1);
    }
    for (let i = s.treats.length - 1; i >= 0; i--) {
      const c = s.treats[i];
      c.x -= dx;
      carrot(ctx, c.x, c.y + Math.sin(s.t * 5 + c.x) * 4, 15, 0.6);
      if (Math.abs(c.x - px) < 28 && Math.abs(c.y - py) < 34) {
        s.treats.splice(i, 1);
        s.bonus += 5;
        chirp();
        s.fx.text(c.x, c.y - 16, '+5', '#D9732A');
        s.fx.burst(c.x, c.y, ['#F08A2C', '#8FD06A'], 8, 120);
        continue;
      }
      if (c.x < -40) s.treats.splice(i, 1);
    }

    const score = Math.floor(s.dist / 50) + s.bonus;
    const nl = 1 + Math.floor(s.dist / 2400);
    if (nl > s.level) {
      s.level = nl;
      announceLevel(show, nl, 'יותר מהר!');
    }
    if (run && Math.floor(s.t * 6) % 3 === 0) setHud({ score, hearts: s.hearts, level: s.level });

    s.hurt = Math.max(0, s.hurt - dt);
    ctx.fillStyle = 'rgba(60,40,20,0.2)';
    ctx.beginPath();
    ctx.ellipse(px, ground + 4, 28 + s.y * 0.08, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!(s.hurt > 0 && Math.floor(s.t * 14) % 2)) {
      const bob = s.y === 0 && run ? Math.abs(Math.sin(s.t * 16)) * 5 : 0;
      drawPig(ctx, sprite, px, py - bob, 70, s.y < 0 ? -0.15 : Math.sin(s.t * 16) * 0.05, s.y === 0 ? 1 - bob * 0.01 : 1.05, true);
    }
    s.fx.draw(ctx, dt);
    ctx.restore();
  });

  return (
    <Stage title="הריצה הגדולה" score={hud.score} hearts={hud.hearts} level={hud.level} onClose={onClose} banner={banner} bg="#FFD9B8">
      {pigNode}
      <canvas ref={canvas} dir="ltr" className="absolute inset-0 size-full touch-none" onPointerDown={jump} />
      <TapToStart show={!started} text="נוגעים, והוא מתחיל לרוץ" />
      <Hint show={started && hud.score < 4} className="top-[20%] text-ink/70">
        נגיעה = קפיצה. עוד נגיעה באוויר = קפיצה כפולה
      </Hint>
    </Stage>
  );
}

function drawThing(ctx: CanvasRenderingContext2D, o: Thing, t: number) {
  ctx.save();
  ctx.strokeStyle = '#3B2216';
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  if (o.kind === 'hay' || o.kind === 'tall') {
    ctx.fillStyle = '#F2CF6B';
    ctx.beginPath();
    ctx.roundRect(o.x, o.y, o.w, o.h, 6);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(150,100,20,0.6)';
    for (let k = 6; k < o.h - 3; k += 7) {
      ctx.beginPath();
      ctx.moveTo(o.x + 4, o.y + k);
      ctx.lineTo(o.x + o.w - 4, o.y + k + 1);
      ctx.stroke();
    }
    ctx.strokeStyle = '#B5784A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(o.x + o.w * 0.3, o.y);
    ctx.lineTo(o.x + o.w * 0.3, o.y + o.h);
    ctx.moveTo(o.x + o.w * 0.7, o.y);
    ctx.lineTo(o.x + o.w * 0.7, o.y + o.h);
    ctx.stroke();
  } else if (o.kind === 'rock') {
    ctx.fillStyle = '#A9A3A6';
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + o.h);
    ctx.quadraticCurveTo(o.x + 2, o.y + 4, o.x + o.w * 0.45, o.y);
    ctx.quadraticCurveTo(o.x + o.w, o.y + 2, o.x + o.w, o.y + o.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(o.x + 10, o.y + 12);
    ctx.quadraticCurveTo(o.x + 14, o.y + 5, o.x + 22, o.y + 4);
    ctx.stroke();
  } else if (o.kind === 'bush') {
    ctx.fillStyle = '#6CBF5A';
    ctx.beginPath();
    ctx.arc(o.x + o.w * 0.28, o.y + o.h * 0.6, o.h * 0.5, Math.PI, 0);
    ctx.arc(o.x + o.w * 0.62, o.y + o.h * 0.45, o.h * 0.55, Math.PI, 0);
    ctx.lineTo(o.x + o.w, o.y + o.h);
    ctx.lineTo(o.x, o.y + o.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#EE4A5A';
    for (const [bx, by] of [
      [0.3, 0.5],
      [0.6, 0.35],
      [0.75, 0.7],
    ]) {
      ctx.beginPath();
      ctx.arc(o.x + o.w * bx, o.y + o.h * by, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // a round little bird, wings going
    const f = Math.sin(t * 16) * 8;
    ctx.fillStyle = '#7EC8F2';
    ctx.beginPath();
    ctx.ellipse(o.x + 20, o.y + 13, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#B9E3FA';
    ctx.beginPath();
    ctx.ellipse(o.x + 22, o.y + 8 - f * 0.5, 10, 5 + Math.abs(f) * 0.4, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F6C455';
    ctx.beginPath();
    ctx.moveTo(o.x + 2, o.y + 12);
    ctx.lineTo(o.x - 7, o.y + 15);
    ctx.lineTo(o.x + 3, o.y + 17);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3B2216';
    ctx.beginPath();
    ctx.arc(o.x + 10, o.y + 10, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
