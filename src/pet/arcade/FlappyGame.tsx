import { useRef, useState } from 'react';
import { tap } from '../../lib/haptics';
import { bonk, chirp, coin, flap } from '../sound';
import { FX, Hint, Stage, TapToStart, announceLevel, drawPig, rand, useBanner, useCanvasLoop, usePigSprite, type GameProps } from './kit';
import { cloud, coinSprite } from './sprites';
import { species } from '../species';

interface Pipe {
  x: number;
  gap: number;
  size: number;
  passed: boolean;
  coin: boolean;
  drift: number;
}

/**
 * שרקן מעופף: tap and he flaps his little wings. Carrot pillars from above and
 * below; every 8 he passes is a level: the gap narrows, they come faster, and
 * later they slowly move up and down. Three hearts.
 */
export function FlappyGame({ look, onEnd, onClose }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [sprite, pigNode] = usePigSprite(look, 'happy', 120);
  const [hud, setHud] = useState({ score: 0, hearts: 3, level: 1 });
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [banner, show] = useBanner();
  const g = useRef({ y: 0, vy: 0, pipes: [] as Pipe[], next: 0, score: 0, hearts: 3, level: 1, over: false, t: 0, hurt: 0, wing: 0, fx: new FX(), scroll: 0, h: 600, wait: false });

  const flapNow = () => {
    const s = g.current;
    if (s.over) return;
    if (!started) setStarted(true);
    if (s.wait) {
      s.wait = false;
      setPaused(false);
    }
    s.vy = -330;
    s.wing = 0.18;
    flap();
    tap(4);
  };

  useCanvasLoop(canvas, (ctx, w, h, dt) => {
    const s = g.current;
    s.t += dt;
    s.h = h;
    if (!s.y) s.y = h * 0.42;
    const speed = 130 + s.level * 12;
    const live = started && !s.over && !s.wait;
    if (live) s.scroll += speed * dt;
    // sky, sun, clouds and soft hills at different speeds
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#9FD3F7');
    sky.addColorStop(1, '#FFF0D2');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,236,170,0.9)';
    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.16, 34, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      const span = w + 200;
      const x = ((((i * 170 - s.scroll * 0.15) % span) + span) % span) - 80;
      cloud(ctx, x, 70 + i * 55, 90 + (i % 2) * 30, 0.8);
    }
    ctx.fillStyle = '#B7E29C';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 10) ctx.lineTo(x, h - 70 - Math.sin((x + s.scroll * 0.35) * 0.012) * 22);
    ctx.lineTo(w, h);
    ctx.fill();

    ctx.save();
    s.fx.pre(ctx, dt);
    const px = w * 0.3;
    const ground = h - 26;
    if (live) {
      s.vy += 1050 * dt;
      s.y += s.vy * dt;
      s.next -= dt;
      if (s.next <= 0) {
        s.next = Math.max(1.05, 1.7 - s.level * 0.07);
        const gap = Math.max(118, 190 - s.level * 8);
        s.pipes.push({ x: w + 40, gap, size: rand(90, h - 140 - gap), passed: false, coin: Math.random() < 0.35, drift: s.level >= 4 ? rand(0.8, 1.6) : 0 });
      }
    } else if (!started || s.wait) s.y = h * 0.42 + Math.sin(s.t * 3) * 8;

    const lose = () => {
      if (s.hurt > 0 || s.over) return;
      s.hearts -= 1;
      s.hurt = 1.5;
      s.fx.kick(14);
      s.fx.burst(px, s.y, ['#E53950', '#FF9AB0'], 12, 180, 'heart');
      bonk();
      tap(40);
      setHud((v) => ({ ...v, hearts: s.hearts }));
      if (s.hearts <= 0) {
        s.over = true;
        window.setTimeout(() => onEnd({ score: s.score, coins: Math.min(160, s.score * 4), level: s.level }), 900);
        return;
      }
      // a fresh start: clear the pillar he hit and lift him to the middle
      s.pipes = s.pipes.filter((p) => p.x > px + 140);
      s.y = h * 0.42;
      s.vy = 0;
      s.wait = true;
      setPaused(true);
    };

    for (let i = s.pipes.length - 1; i >= 0; i--) {
      const p = s.pipes[i];
      if (live) p.x -= speed * dt;
      const top = p.size + (p.drift ? Math.sin(s.t * p.drift) * 40 : 0);
      const pw = 62;
      drawPillar(ctx, p.x, 0, pw, top, true);
      drawPillar(ctx, p.x, top + p.gap, pw, ground - top - p.gap, false);
      if (p.coin) {
        coinSprite(ctx, p.x + pw / 2, top + p.gap / 2, 11, s.t * 5);
        if (Math.abs(p.x + pw / 2 - px) < 22 && Math.abs(top + p.gap / 2 - s.y) < 26) {
          p.coin = false;
          s.score += 3;
          coin();
          s.fx.text(px, s.y - 30, '+3', '#C98A1E');
          setHud((v) => ({ ...v, score: s.score }));
        }
      }
      if (live && px + 18 > p.x && px - 18 < p.x + pw && (s.y - 16 < top || s.y + 16 > top + p.gap)) lose();
      if (!p.passed && p.x + pw < px) {
        p.passed = true;
        s.score += 1;
        chirp();
        s.fx.burst(px, s.y, ['#fff', '#FFE38A'], 6, 90, 'star');
        const nl = 1 + Math.floor(s.score / 8);
        if (nl > s.level) {
          s.level = nl;
          announceLevel(show, nl);
        }
        setHud({ score: s.score, hearts: s.hearts, level: s.level });
      }
      if (p.x < -80) s.pipes.splice(i, 1);
    }
    if (live && (s.y > ground - 16 || s.y < -30)) {
      if (s.y > ground - 16) s.y = ground - 16;
      lose();
    }
    // the ground
    ctx.fillStyle = '#E2B97A';
    ctx.fillRect(0, ground, w, h - ground);
    ctx.fillStyle = '#9FD56E';
    ctx.fillRect(0, ground, w, 7);
    ctx.fillStyle = 'rgba(120,80,40,0.25)';
    for (let x = -(s.scroll % 24); x < w; x += 24) ctx.fillRect(x, ground + 12, 12, 3);

    // him, with two little flapping wings
    s.hurt = Math.max(0, s.hurt - dt);
    s.wing = Math.max(0, s.wing - dt);
    const tilt = Math.max(-0.45, Math.min(0.9, s.vy / 650));
    if (!(s.hurt > 0 && Math.floor(s.t * 14) % 2)) {
      const flapA = s.wing > 0 ? -0.9 : Math.sin(s.t * 18) * 0.25;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(px - 4, s.y - 2);
        ctx.rotate(tilt + side * 0.2 + flapA * (side === -1 ? 1 : 0.7));
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.strokeStyle = '#3B2216';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(-16, -8, 15, 8, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      drawPig(ctx, sprite, px, s.y, 52, tilt);
    }
    s.fx.draw(ctx, dt);
    ctx.restore();
  });

  return (
    <Stage title={`${species.name} מעופף`} score={hud.score} hearts={hud.hearts} level={hud.level} onClose={onClose} banner={banner} bg="#9FD3F7">
      {pigNode}
      <canvas ref={canvas} dir="ltr" className="absolute inset-0 size-full touch-none" onPointerDown={flapNow} />
      <TapToStart show={!started || (paused && hud.hearts > 0)} text={started ? 'נוגעים כדי להמשיך' : 'נוגעים, והוא מנפנף'} />
      <Hint show={started && hud.score === 0} className="top-[18%] text-ink/70">
        כל נגיעה: נפנוף. לעבור בין הגזרים
      </Hint>
    </Stage>
  );
}

/** A giant carrot column: orange, ribbed, with a leafy cap where it ends. */
function drawPillar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fromTop: boolean) {
  if (h <= 0) return;
  ctx.save();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, '#F7A04A');
  g.addColorStop(0.45, '#FFB868');
  g.addColorStop(1, '#D9732A');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3B2216';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, fromTop ? [0, 0, 16, 16] : [16, 16, 0, 0]);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,60,20,0.35)';
  ctx.lineWidth = 2;
  for (let k = 18; k < h - 10; k += 26) {
    const yy = fromTop ? y + h - k : y + k;
    ctx.beginPath();
    ctx.moveTo(x + 10, yy);
    ctx.lineTo(x + w * 0.45, yy + 3);
    ctx.stroke();
  }
  // leafy cap at the open end
  const cy = fromTop ? y + h : y;
  ctx.fillStyle = '#5DB04F';
  ctx.strokeStyle = '#3B2216';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(x - 6, fromTop ? cy - 14 : cy, w + 12, 14, 7);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
