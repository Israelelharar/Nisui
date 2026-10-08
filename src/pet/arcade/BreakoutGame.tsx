import { useRef, useState } from 'react';
import { tap } from '../../lib/haptics';
import { bonk, coin, note, sparkle } from '../sound';
import { FX, Hint, Stage, TapToStart, announceLevel, drawHeart, rand, useBanner, useCanvasLoop, type GameProps } from './kit';

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  color: string;
  gift?: 'wide' | 'multi' | 'heart';
}
interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  stuck: boolean;
}
interface Gift {
  x: number;
  y: number;
  kind: 'wide' | 'multi' | 'heart';
}

const PALETTE = ['#F9A8C6', '#FFC2A8', '#FFE08A', '#BDE8B0', '#A9DDF7', '#C9B8F5'];
/** Each level's wall, as rows of characters: '.' empty, '1' one hit, '2' two hits. */
const WALLS = [
  ['1111111', '1111111', '1111111'],
  ['.11.11.', '1111111', '1111111', '.11111.', '..111..', '...1...'],
  ['2222222', '1111111', '1.1.1.1', '1111111', '2222222'],
  ['1.....1', '11...11', '111.111', '1121211', '1111111', '.11111.'],
  ['2121212', '1212121', '2121212', '1212121', '2121212', '1111111'],
];
const wallFor = (level: number) => {
  if (level <= WALLS.length) return WALLS[level - 1];
  // beyond the drawn walls: random, denser and tougher every level
  const rows = Math.min(9, 5 + Math.floor(level / 3));
  return Array.from({ length: rows }, () =>
    Array.from({ length: 7 }, () => (Math.random() < 0.12 ? '.' : Math.random() < Math.min(0.6, 0.2 + level * 0.04) ? '2' : '1')).join(''),
  );
};

/**
 * שוברים לבבות: a paddle, a ball, and a wall of hearts. Some hearts drop gifts
 * (a wider paddle, three balls, a heart back). Each wall is a level, and the
 * ball gets quicker. Three hearts (balls).
 */
export function BreakoutGame({ onEnd, onClose }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ score: 0, hearts: 3, level: 1 });
  const [started, setStarted] = useState(false);
  const [banner, show] = useBanner();
  const g = useRef({
    bricks: [] as Brick[],
    balls: [] as Ball[],
    gifts: [] as Gift[],
    px: 0.5,
    tx: 0.5,
    wide: 0,
    score: 0,
    hearts: 3,
    level: 1,
    over: false,
    t: 0,
    fx: new FX(),
    built: 0,
    hitStreak: 0,
  });

  const build = (w: number) => {
    const s = g.current;
    const wall = wallFor(s.level);
    const cols = 7;
    const gap = 6;
    const bw = (w - 24 - gap * (cols - 1)) / cols;
    const bh = 22;
    s.bricks = [];
    wall.forEach((row, r) =>
      [...row].forEach((c, k) => {
        if (c === '.') return;
        const roll = Math.random();
        s.bricks.push({
          x: 12 + k * (bw + gap),
          y: 60 + r * (bh + gap),
          w: bw,
          h: bh,
          hp: Number(c),
          color: PALETTE[(r + s.level) % PALETTE.length],
          gift: roll < 0.06 ? 'wide' : roll < 0.1 ? 'multi' : roll < 0.12 ? 'heart' : undefined,
        });
      }),
    );
    s.built = s.level;
  };
  const serve = () => {
    g.current.balls = [{ x: 0, y: 0, vx: 0, vy: 0, stuck: true }];
  };

  useCanvasLoop(canvas, (ctx, w, h, dt) => {
    const s = g.current;
    s.t += dt;
    if (s.built !== s.level) {
      build(w);
      serve();
    }
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#FFF4F6');
    bg.addColorStop(1, '#FBE1E6');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(194,56,90,0.05)';
    for (let y = 0; y < h; y += 28) for (let x = (y / 28) % 2 ? 14 : 0; x < w; x += 28) drawHeart(ctx, x, y, 5, 'rgba(194,56,90,0.06)');

    ctx.save();
    s.fx.pre(ctx, dt);
    s.px += (s.tx - s.px) * Math.min(1, dt * 18);
    s.wide = Math.max(0, s.wide - dt);
    const pw = s.wide > 0 ? 130 : 86;
    const pX = s.px * w;
    const pY = h - 60;
    const speed = 330 + s.level * 26;

    for (const b of s.bricks) {
      ctx.fillStyle = b.color;
      ctx.strokeStyle = '#3B2216';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 7);
      ctx.fill();
      ctx.stroke();
      drawHeart(ctx, b.x + b.w / 2, b.y + b.h / 2 + 1, 7, b.hp > 1 ? '#C2385A' : 'rgba(255,255,255,0.85)');
      if (b.gift) {
        ctx.fillStyle = '#FFE38A';
        ctx.beginPath();
        ctx.arc(b.x + b.w - 6, b.y + 6, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const lostBall = () => {
      s.hearts -= 1;
      bonk();
      tap(40);
      s.fx.kick(12);
      setHud((v) => ({ ...v, hearts: s.hearts }));
      if (s.hearts <= 0) {
        s.over = true;
        window.setTimeout(() => onEnd({ score: s.score, coins: Math.min(170, Math.round(s.score / 4)), level: s.level }), 900);
      } else serve();
    };

    for (let i = s.balls.length - 1; i >= 0; i--) {
      const b = s.balls[i];
      if (b.stuck) {
        b.x = pX;
        b.y = pY - 16;
      } else if (!s.over) {
        // sub-steps so a fast ball never skips through a brick
        const steps = 3;
        for (let k = 0; k < steps; k++) {
          b.x += (b.vx * dt) / steps;
          b.y += (b.vy * dt) / steps;
          if (b.x < 8 || b.x > w - 8) {
            b.vx *= -1;
            b.x = Math.max(8, Math.min(w - 8, b.x));
          }
          if (b.y < 8) {
            b.vy = Math.abs(b.vy);
          }
          if (b.vy > 0 && b.y > pY - 10 && b.y < pY + 8 && Math.abs(b.x - pX) < pw / 2 + 8) {
            const off = (b.x - pX) / (pw / 2);
            const a = off * 1.05;
            const v = Math.hypot(b.vx, b.vy);
            b.vx = Math.sin(a) * v;
            b.vy = -Math.cos(a) * v;
            s.hitStreak = 0;
            tap(3);
            note(0, 0.03);
          }
          for (let j = s.bricks.length - 1; j >= 0; j--) {
            const br = s.bricks[j];
            if (b.x > br.x - 7 && b.x < br.x + br.w + 7 && b.y > br.y - 7 && b.y < br.y + br.h + 7) {
              const fromSide = b.x < br.x || b.x > br.x + br.w;
              if (fromSide) b.vx *= -1;
              else b.vy *= -1;
              br.hp -= 1;
              s.hitStreak += 1;
              note(s.hitStreak);
              if (br.hp <= 0) {
                s.bricks.splice(j, 1);
                s.score += 10 * s.level;
                s.fx.burst(br.x + br.w / 2, br.y + br.h / 2, [br.color, '#fff', '#E53950'], 12, 170, Math.random() < 0.4 ? 'heart' : 'dot');
                if (br.gift) s.gifts.push({ x: br.x + br.w / 2, y: br.y + br.h, kind: br.gift });
              } else s.fx.burst(b.x, b.y, ['#fff'], 5, 90);
              setHud((v) => ({ ...v, score: s.score }));
              break;
            }
          }
        }
        if (b.y > h + 20) {
          s.balls.splice(i, 1);
          if (!s.balls.length && !s.over) lostBall();
          continue;
        }
      }
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#C2385A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    for (let i = s.gifts.length - 1; i >= 0; i--) {
      const gf = s.gifts[i];
      gf.y += 150 * dt;
      if (gf.y > pY - 12 && gf.y < pY + 14 && Math.abs(gf.x - pX) < pw / 2 + 10) {
        s.gifts.splice(i, 1);
        sparkle();
        coin();
        if (gf.kind === 'wide') {
          s.wide = 12;
          s.fx.text(pX, pY - 30, 'משטח רחב!', '#C2385A');
        } else if (gf.kind === 'heart') {
          s.hearts = Math.min(3, s.hearts + 1);
          setHud((v) => ({ ...v, hearts: s.hearts }));
          s.fx.text(pX, pY - 30, 'לב!', '#C2385A');
        } else {
          const src = s.balls.find((b) => !b.stuck) ?? { x: pX, y: pY - 20, vx: 0, vy: -speed };
          for (const a of [-0.5, 0.5]) s.balls.push({ x: src.x, y: src.y, vx: Math.sin(a) * speed, vy: -Math.cos(a) * speed, stuck: false });
          s.fx.text(pX, pY - 30, 'שלושה כדורים!', '#C2385A');
        }
        continue;
      }
      if (gf.y > h + 20) {
        s.gifts.splice(i, 1);
        continue;
      }
      ctx.fillStyle = gf.kind === 'heart' ? '#E53950' : gf.kind === 'wide' ? '#7EC8F2' : '#F6C455';
      ctx.strokeStyle = '#3B2216';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(gf.x - 16, gf.y - 9, 32, 18, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = "800 12px 'Assistant', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gf.kind === 'heart' ? '♥' : gf.kind === 'wide' ? '⟷' : '×3', gf.x, gf.y + 1);
    }

    // the paddle: a rounded pink bar with a shine
    ctx.fillStyle = '#E25A7A';
    ctx.strokeStyle = '#3B2216';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(pX - pw / 2, pY, pw, 16, 8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pX - pw / 2 + 10, pY + 5);
    ctx.lineTo(pX + pw / 2 - 18, pY + 5);
    ctx.stroke();

    if (!s.bricks.length && !s.over) {
      s.level += 1;
      s.score += 50;
      s.gifts = [];
      announceLevel(show, s.level, 'קיר חדש');
      setHud((v) => ({ ...v, level: s.level, score: s.score }));
    }
    s.fx.draw(ctx, dt);
    ctx.restore();
  });

  const launch = () => {
    const s = g.current;
    const speed = 330 + s.level * 26;
    for (const b of s.balls)
      if (b.stuck) {
        const a = rand(-0.35, 0.35);
        b.stuck = false;
        b.vx = Math.sin(a) * speed;
        b.vy = -Math.cos(a) * speed;
      }
  };
  const steer = (e: React.PointerEvent) => {
    const r = canvas.current?.getBoundingClientRect();
    if (r) g.current.tx = Math.max(0.1, Math.min(0.9, (e.clientX - r.left) / r.width));
  };

  return (
    <Stage title="שוברים לבבות" score={hud.score} hearts={hud.hearts} level={hud.level} onClose={onClose} banner={banner} bg="#FFF4F6">
      <canvas
        ref={canvas}
        dir="ltr"
        className="absolute inset-0 size-full touch-none"
        onPointerDown={(e) => {
          steer(e);
          if (!started) setStarted(true);
        }}
        onPointerMove={steer}
        onPointerUp={launch}
      />
      <TapToStart show={!started} text="גוררים את המשטח, משחררים כדי לשגר" />
      <Hint show={started && hud.score === 0} className="bottom-28 text-ink/60">
        משחררים את האצבע, והכדור יוצא
      </Hint>
    </Stage>
  );
}
