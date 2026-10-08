import { useRef, useState } from 'react';
import { tap } from '../../lib/haptics';
import { boing, bonk, chirp, coin } from '../sound';
import { FX, Hint, Stage, TapToStart, announceLevel, drawPig, drawStar, rand, useBanner, useCanvasLoop, usePigSprite, type GameProps } from './kit';
import { strawberry } from './sprites';

interface Plat {
  x: number;
  y: number;
  w: number;
  kind: 'cloud' | 'move' | 'break' | 'spring';
  vx: number;
  gone: number;
  star: boolean;
}

/** Sky colors from the meadow to space, by height. */
const SKY: [number, string, string][] = [
  [0, '#BFE3FF', '#FFF2DC'],
  [3000, '#FFC9A8', '#FFE8C9'],
  [7000, '#B48CD9', '#F7B9C8'],
  [12000, '#2B1F4E', '#5B3F8C'],
  [18000, '#0D0A24', '#241A55'],
];
const lerpHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
const skyAt = (hgt: number) => {
  for (let i = SKY.length - 1; i >= 0; i--)
    if (hgt >= SKY[i][0]) {
      const n = SKY[i + 1];
      if (!n) return [SKY[i][1], SKY[i][2]];
      const t = (hgt - SKY[i][0]) / (n[0] - SKY[i][0]);
      return [lerpHex(SKY[i][1], n[1], t), lerpHex(SKY[i][2], n[2], t)];
    }
  return [SKY[0][1], SKY[0][2]];
};

/**
 * קופץ לירח: he bounces on clouds by himself; she moves her finger left and
 * right to steer him. Higher up the clouds thin out, some drift and some
 * crumble, and the sky turns from day to sunset to space. Falling costs a heart
 * (a rescue cloud catches him). Three hearts.
 */
export function JumperGame({ look, onEnd, onClose }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [sprite, pigNode] = usePigSprite(look, 'happy', 120);
  const [hud, setHud] = useState({ score: 0, hearts: 3, level: 1 });
  const [started, setStarted] = useState(false);
  const [banner, show] = useBanner();
  const g = useRef({
    x: 0.5,
    tx: 0.5,
    y: 0,
    vy: 0,
    cam: 0,
    top: 0,
    plats: [] as Plat[],
    made: false,
    height: 0,
    stars: 0,
    hearts: 3,
    level: 1,
    over: false,
    t: 0,
    fx: new FX(),
    hurt: 0,
    squash: 1,
  });

  const add = (w: number, y: number) => {
    const s = g.current;
    const lv = s.level;
    const roll = Math.random();
    const kind: Plat['kind'] = roll < Math.min(0.25, 0.05 + lv * 0.03) && lv >= 3 ? 'break' : roll < 0.4 && lv >= 2 ? 'move' : roll > 0.93 ? 'spring' : 'cloud';
    const pw = Math.max(54, 84 - lv * 3);
    s.plats.push({ x: rand(pw / 2 + 6, w - pw / 2 - 6), y, w: pw, kind, vx: kind === 'move' ? rand(40, 70 + lv * 8) * (Math.random() < 0.5 ? -1 : 1) : 0, gone: 0, star: Math.random() < 0.25 });
  };

  useCanvasLoop(canvas, (ctx, w, h, dt) => {
    const s = g.current;
    s.t += dt;
    if (!s.made) {
      s.made = true;
      s.y = h - 120;
      s.plats = [{ x: w / 2, y: h - 80, w: 120, kind: 'cloud', vx: 0, gone: 0, star: false }];
      s.top = h - 80;
      while (s.top > -h) {
        s.top -= rand(70, 100);
        add(w, s.top);
      }
    }
    const height = Math.max(0, Math.round(h - 120 - s.y));
    const [c1, c2] = skyAt(height);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, c1);
    bg.addColorStop(1, c2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    if (height > 9000) {
      ctx.fillStyle = `rgba(255,246,224,${Math.min(0.8, (height - 9000) / 6000)})`;
      for (let i = 0; i < 50; i++) ctx.fillRect((i * 97) % w, (i * 61 + s.cam * 0.05) % h, 2, 2);
    }
    // the moon grows as he climbs
    const moonR = 20 + Math.min(90, height / 200);
    ctx.fillStyle = 'rgba(255,233,170,0.95)';
    ctx.beginPath();
    ctx.arc(w * 0.78, 80, moonR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(230,200,130,0.6)';
    ctx.beginPath();
    ctx.arc(w * 0.78 - moonR * 0.3, 80 - moonR * 0.2, moonR * 0.18, 0, Math.PI * 2);
    ctx.arc(w * 0.78 + moonR * 0.35, 80 + moonR * 0.25, moonR * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    s.fx.pre(ctx, dt);
    const play = started && !s.over;
    if (play) {
      s.x += (s.tx - s.x) * Math.min(1, dt * 9);
      s.vy += 1350 * dt;
      s.y += s.vy * dt;
    }
    const px = s.x * w;
    // the camera only goes up
    const want = s.y - h * 0.45;
    if (want < s.cam) s.cam = want;
    while (s.top > s.cam - 100) {
      s.top -= rand(66, 92) + Math.min(50, s.level * 5);
      add(w, s.top);
    }

    for (let i = s.plats.length - 1; i >= 0; i--) {
      const p = s.plats[i];
      if (p.kind === 'move' && play) {
        p.x += p.vx * dt;
        if (p.x < p.w / 2 || p.x > w - p.w / 2) p.vx *= -1;
      }
      if (p.gone) p.gone += dt;
      const sy = p.y - s.cam;
      if (sy > h + 60) {
        s.plats.splice(i, 1);
        continue;
      }
      // landing: only while falling, feet over the cloud
      if (play && s.vy > 0 && !p.gone && Math.abs(px - p.x) < p.w / 2 + 10 && s.y + 22 >= p.y - 6 && s.y + 22 <= p.y + 14) {
        if (p.kind === 'break') {
          p.gone = 0.01;
          s.vy = -560;
          chirp();
        } else {
          s.vy = p.kind === 'spring' ? -1150 : -720;
          s.squash = 0.75;
          if (p.kind === 'spring') {
            boing();
            s.fx.burst(p.x, p.y, ['#EE4A5A', '#fff'], 10, 160);
          } else tap(3);
        }
      }
      if (p.star && Math.abs(px - p.x) < 26 && Math.abs(s.y - (p.y - 34)) < 30) {
        p.star = false;
        s.stars += 1;
        coin();
        s.fx.burst(p.x, sy - 34, ['#FFE38A', '#fff'], 8, 120, 'star');
      }
      drawCloud(ctx, p, sy, s.t);
      if (p.star) drawStar(ctx, p.x, sy - 34 + Math.sin(s.t * 4 + p.x) * 3, 10, '#FFD45C', s.t);
    }

    // falling below the screen: a heart, and a rescue cloud
    if (play && s.y - s.cam > h + 40) {
      s.hearts -= 1;
      s.hurt = 1.4;
      bonk();
      tap(40);
      setHud((v) => ({ ...v, hearts: s.hearts }));
      if (s.hearts <= 0) {
        s.over = true;
        const score = Math.floor(height / 10) + s.stars * 10;
        window.setTimeout(() => onEnd({ score, coins: Math.min(170, Math.round(score / 8)), level: s.level }), 700);
      } else {
        const rescue: Plat = { x: w / 2, y: s.cam + h - 90, w: 130, kind: 'cloud', vx: 0, gone: 0, star: false };
        s.plats.push(rescue);
        s.y = rescue.y - 60;
        s.x = s.tx = 0.5;
        s.vy = -700;
      }
    }

    s.squash += (1 - s.squash) * Math.min(1, dt * 10);
    s.hurt = Math.max(0, s.hurt - dt);
    if (!(s.hurt > 0 && Math.floor(s.t * 14) % 2)) drawPig(ctx, sprite, px, s.y - s.cam, 58, (s.tx - s.x) * -1.6, s.squash);

    const score = Math.floor(height / 10) + s.stars * 10;
    const nl = 1 + Math.floor(height / 1600);
    if (nl > s.level) {
      s.level = nl;
      announceLevel(show, nl, height > 12000 ? 'בחלל!' : '');
    }
    if (Math.floor(s.t * 5) % 2 === 0 && score !== hud.score) setHud({ score, hearts: s.hearts, level: s.level });
    s.fx.draw(ctx, dt);
    ctx.restore();
  });

  const steer = (e: React.PointerEvent) => {
    const r = canvas.current?.getBoundingClientRect();
    if (r) g.current.tx = Math.max(0.05, Math.min(0.95, (e.clientX - r.left) / r.width));
  };

  return (
    <Stage title="קופץ לירח" score={hud.score} hearts={hud.hearts} level={hud.level} onClose={onClose} banner={banner} bg="#BFE3FF">
      {pigNode}
      <canvas
        ref={canvas}
        dir="ltr"
        className="absolute inset-0 size-full touch-none"
        onPointerDown={(e) => {
          if (!started) setStarted(true);
          steer(e);
        }}
        onPointerMove={steer}
      />
      <TapToStart show={!started} text="נוגעים, והוא מתחיל לקפוץ" />
      <Hint show={started && hud.score < 20} className="bottom-24 text-ink/60">
        מזיזים את האצבע לצדדים, והוא הולך אחריה
      </Hint>
    </Stage>
  );
}

function drawCloud(ctx: CanvasRenderingContext2D, p: Plat, sy: number, t: number) {
  ctx.save();
  if (p.gone) {
    ctx.globalAlpha = Math.max(0, 1 - p.gone * 2.5);
    sy += p.gone * 260;
  }
  const w = p.w;
  const fill = p.kind === 'break' ? '#E9DCCF' : p.kind === 'move' ? '#E3F3FF' : '#FFFFFF';
  ctx.fillStyle = fill;
  ctx.strokeStyle = 'rgba(59,34,22,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x - w * 0.28, sy, 11, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(p.x - w * 0.1, sy - 8, 14, Math.PI, Math.PI * 1.9);
  ctx.arc(p.x + w * 0.14, sy - 7, 12, Math.PI * 1.1, Math.PI * 1.95);
  ctx.arc(p.x + w * 0.3, sy, 10, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (p.kind === 'break') {
    ctx.beginPath();
    ctx.moveTo(p.x - 6, sy - 12);
    ctx.lineTo(p.x + 2, sy - 2);
    ctx.lineTo(p.x - 3, sy + 8);
    ctx.stroke();
  }
  if (p.kind === 'spring') strawberry(ctx, p.x, sy - 14 + Math.sin(t * 8) * 1.5, 13);
  ctx.restore();
}
