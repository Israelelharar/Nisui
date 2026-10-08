import { useCallback, useRef, useState } from 'react';
import { tap } from '../../lib/haptics';
import { boom, bonk, coin, pew, sparkle } from '../sound';
import { FX, Hint, Stage, TapToStart, announceLevel, drawHeart, drawPig, rand, useBanner, useCanvasLoop, usePigSprite, type GameProps } from './kit';
import { alien, strawberry } from './sprites';

interface Alien {
  x: number;
  y: number;
  hx: number;
  hy: number;
  kind: number;
  hp: number;
  dive: number; // 0 = in formation, otherwise seconds into a dive
  dx: number;
}
interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
}
interface Drop {
  x: number;
  y: number;
  kind: 'heart' | 'double';
}

/**
 * חלליות: he flies a little glass-domed ship; she drags to steer and it fires by itself.
 * Each cleared wave is a new level: more rows, faster sway, more shots back, and
 * from level 3 some aliens break formation and dive at him. Three hearts.
 */
export function SpaceGame({ look, onEnd, onClose }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [sprite, pigNode] = usePigSprite(look, 'happy', 120);
  const [hud, setHud] = useState({ score: 0, hearts: 3, level: 1 });
  const [started, setStarted] = useState(false);
  const [banner, show] = useBanner();
  const g = useRef({
    x: 0.5,
    tx: 0.5,
    aliens: [] as Alien[],
    shots: [] as Shot[],
    bad: [] as Shot[],
    drops: [] as Drop[],
    stars: Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), z: rand(0.2, 1) })),
    fire: 0,
    enemyFire: 1.5,
    sway: 0,
    t: 0,
    hurt: 0,
    double: 0,
    score: 0,
    hearts: 3,
    level: 1,
    over: false,
    fx: new FX(),
    waveIn: 0,
  });

  const wave = useCallback((level: number, w: number) => {
    const s = g.current;
    const rows = Math.min(5, 2 + Math.floor(level / 2));
    const cols = w < 360 ? 5 : 6;
    const gap = Math.min(52, (w - 40) / cols);
    s.aliens = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        s.aliens.push({
          x: 0,
          y: -60 - r * 40,
          hx: w / 2 + (c - (cols - 1) / 2) * gap,
          hy: 70 + r * 42,
          kind: (r + level) % 5,
          hp: level >= 5 && r === 0 ? 2 : 1,
          dive: 0,
          dx: 0,
        });
    s.aliens.forEach((a) => (a.x = a.hx));
    s.waveIn = 1;
  }, []);

  const finish = useCallback(() => {
    const s = g.current;
    if (s.over) return;
    s.over = true;
    window.setTimeout(() => onEnd({ score: s.score, coins: Math.min(160, Math.round(s.score / 12)), level: s.level }), 900);
  }, [onEnd]);

  useCanvasLoop(canvas, (ctx, w, h, dt) => {
    const s = g.current;
    s.t += dt;
    // deep space: a violet-blue night with a soft nebula
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#120B2E');
    bg.addColorStop(0.6, '#24154A');
    bg.addColorStop(1, '#3B1F55');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const neb = ctx.createRadialGradient(w * 0.75, h * 0.3, 10, w * 0.75, h * 0.3, w * 0.7);
    neb.addColorStop(0, 'rgba(240,120,170,0.22)');
    neb.addColorStop(1, 'rgba(240,120,170,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, w, h);
    for (const st of s.stars) {
      st.y += dt * st.z * (started ? 0.12 : 0.03);
      if (st.y > 1) st.y -= 1;
      ctx.globalAlpha = 0.35 + st.z * 0.6;
      ctx.fillStyle = '#FFF6E0';
      ctx.fillRect(st.x * w, st.y * h, st.z * 2.2, st.z * 2.2);
    }
    ctx.globalAlpha = 1;

    ctx.save();
    s.fx.pre(ctx, dt);
    const py = h - 70;
    s.x += (s.tx - s.x) * Math.min(1, dt * 14);
    const px = s.x * w;

    if (started && !s.over) {
      if (!s.aliens.length) {
        if (s.score > 0) {
          s.level += 1;
          announceLevel(show, s.level);
          setHud((v) => ({ ...v, level: s.level }));
        }
        wave(s.level, w);
      }
      // he fires by himself
      s.fire -= dt;
      if (s.fire <= 0) {
        s.fire = 0.28;
        pew();
        if (s.double > 0) {
          s.shots.push({ x: px - 12, y: py - 30, vx: -30, vy: -560 }, { x: px + 12, y: py - 30, vx: 30, vy: -560 });
        } else s.shots.push({ x: px, y: py - 34, vx: 0, vy: -560 });
      }
      s.double = Math.max(0, s.double - dt);
      // formation sway and arrival
      s.sway += dt * (0.8 + s.level * 0.12);
      const swayX = Math.sin(s.sway) * Math.min(40, 18 + s.level * 3);
      s.waveIn = Math.max(0, s.waveIn - dt * 0.9);
      const desc = Math.min(60, (s.level - 1) * 6) * (1 - s.waveIn);
      for (const a of s.aliens) {
        if (a.dive > 0) {
          a.dive += dt;
          a.y += dt * (170 + s.level * 12);
          a.x += a.dx * dt + Math.sin(a.dive * 4) * 60 * dt;
          if (a.y > h + 30) {
            a.dive = 0;
            a.y = -30;
          }
        } else {
          a.x += (a.hx + swayX - a.x) * Math.min(1, dt * 4);
          a.y += (a.hy + desc - a.y) * Math.min(1, dt * 3);
        }
      }
      if (s.level >= 3 && Math.random() < dt * (0.25 + s.level * 0.05)) {
        const free = s.aliens.filter((a) => a.dive === 0);
        const a = free[Math.floor(Math.random() * free.length)];
        if (a) {
          a.dive = 0.01;
          a.dx = (px - a.x) * 0.55;
        }
      }
      // they shoot back, more as the levels go up
      s.enemyFire -= dt;
      if (s.enemyFire <= 0 && s.aliens.length) {
        s.enemyFire = Math.max(0.35, 1.6 - s.level * 0.13) * rand(0.6, 1.3);
        const a = s.aliens[Math.floor(Math.random() * s.aliens.length)];
        const aim = s.level >= 4 ? (px - a.x) / 2.6 : 0;
        s.bad.push({ x: a.x, y: a.y + 12, vx: aim, vy: 190 + s.level * 14 });
      }
    }

    // his shots
    for (let i = s.shots.length - 1; i >= 0; i--) {
      const b = s.shots[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      let gone = b.y < -20;
      for (let j = s.aliens.length - 1; j >= 0 && !gone; j--) {
        const a = s.aliens[j];
        if (Math.abs(a.x - b.x) < 18 && Math.abs(a.y - b.y) < 16) {
          gone = true;
          a.hp -= 1;
          if (a.hp <= 0) {
            s.aliens.splice(j, 1);
            const pts = 10 * s.level + (a.dive ? 15 : 0);
            s.score += pts;
            s.fx.burst(a.x, a.y, ['#FFE38A', '#F59AC0', '#8BD67B', '#fff'], 16, 200);
            s.fx.text(a.x, a.y - 14, `+${pts}`, '#FFE38A');
            boom();
            tap(5);
            if (Math.random() < 0.07) s.drops.push({ x: a.x, y: a.y, kind: s.hearts < 3 && Math.random() < 0.5 ? 'heart' : 'double' });
            setHud((v) => ({ ...v, score: s.score }));
          } else s.fx.burst(b.x, b.y, ['#fff'], 5, 90);
        }
      }
      if (gone) s.shots.splice(i, 1);
      else {
        ctx.fillStyle = '#FFE38A';
        ctx.shadowColor = '#FFD45C';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(b.x - 2.5, b.y - 9, 5, 16, 3);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    // their shots and the gifts that fall
    const hurt = () => {
      if (s.hurt > 0 || s.over) return;
      s.hearts -= 1;
      s.hurt = 1.6;
      s.fx.kick(14);
      s.fx.burst(px, py, ['#E53950', '#FF9AB0'], 12, 160, 'heart');
      bonk();
      tap(40);
      setHud((v) => ({ ...v, hearts: s.hearts }));
      if (s.hearts <= 0) finish();
    };
    for (let i = s.bad.length - 1; i >= 0; i--) {
      const b = s.bad[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (Math.abs(b.x - px) < 22 && Math.abs(b.y - py) < 22) {
        s.bad.splice(i, 1);
        hurt();
        continue;
      }
      if (b.y > h + 20) {
        s.bad.splice(i, 1);
        continue;
      }
      ctx.fillStyle = '#FF7FAF';
      ctx.shadowColor = '#FF7FAF';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    for (const a of s.aliens) {
      if (a.dive && Math.abs(a.x - px) < 26 && Math.abs(a.y - py) < 26) {
        hurt();
        a.y = -40;
        a.dive = 0;
      }
      alien(ctx, a.x, a.y, a.hp > 1 ? 19 : 16, a.kind, s.t);
    }
    for (let i = s.drops.length - 1; i >= 0; i--) {
      const d = s.drops[i];
      d.y += 120 * dt;
      if (Math.abs(d.x - px) < 28 && Math.abs(d.y - py) < 30) {
        s.drops.splice(i, 1);
        sparkle();
        if (d.kind === 'heart') {
          s.hearts = Math.min(3, s.hearts + 1);
          setHud((v) => ({ ...v, hearts: s.hearts }));
          s.fx.text(px, py - 40, 'לב!', '#FF7FAF');
        } else {
          s.double = 8;
          s.fx.text(px, py - 40, 'יריה כפולה!', '#FFE38A');
        }
        coin();
        continue;
      }
      if (d.y > h + 20) s.drops.splice(i, 1);
      else if (d.kind === 'heart') drawHeart(ctx, d.x, d.y, 13, '#E53950', '#fff');
      else strawberry(ctx, d.x, d.y, 14, Math.sin(s.t * 4) * 0.3);
    }

    // his ship: a glass bubble with him inside, a warm flame underneath
    s.hurt = Math.max(0, s.hurt - dt);
    if (!(s.hurt > 0 && Math.floor(s.t * 14) % 2)) {
      const flame = 10 + Math.sin(s.t * 40) * 4;
      ctx.fillStyle = '#FFB347';
      ctx.beginPath();
      ctx.moveTo(px - 9, py + 22);
      ctx.quadraticCurveTo(px, py + 22 + flame * 2.2, px + 9, py + 22);
      ctx.fill();
      ctx.fillStyle = '#FFE38A';
      ctx.beginPath();
      ctx.moveTo(px - 5, py + 22);
      ctx.quadraticCurveTo(px, py + 22 + flame * 1.3, px + 5, py + 22);
      ctx.fill();
      ctx.fillStyle = '#E25A7A';
      ctx.strokeStyle = '#3B2216';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(px - 34, py + 18);
      ctx.quadraticCurveTo(px - 30, py + 4, px - 18, py + 4);
      ctx.lineTo(px + 18, py + 4);
      ctx.quadraticCurveTo(px + 30, py + 4, px + 34, py + 18);
      ctx.quadraticCurveTo(px, py + 30, px - 34, py + 18);
      ctx.fill();
      ctx.stroke();
      drawPig(ctx, sprite, px, py - 10, 52, (s.tx - s.x) * -1.2);
      ctx.beginPath();
      ctx.arc(px, py - 4, 27, Math.PI, 0);
      ctx.fillStyle = 'rgba(190,230,255,0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py - 4, 21, Math.PI * 1.15, Math.PI * 1.45);
      ctx.stroke();
    }
    s.fx.draw(ctx, dt);
    ctx.restore();
  });

  const steer = (e: React.PointerEvent) => {
    const r = canvas.current?.getBoundingClientRect();
    if (!r) return;
    g.current.tx = Math.max(0.06, Math.min(0.94, (e.clientX - r.left) / r.width));
  };

  return (
    <Stage title="חלליות" dark bg="#120B2E" score={hud.score} hearts={hud.hearts} level={hud.level} onClose={onClose} banner={banner}>
      {pigNode}
      <canvas
        ref={canvas}
        dir="ltr"
        className="absolute inset-0 size-full touch-none"
        onPointerDown={(e) => {
          if (!started) {
            setStarted(true);
            tap(8);
          }
          steer(e);
        }}
        onPointerMove={steer}
      />
      <TapToStart show={!started} dark text="נוגעים, והחללית יוצאת לדרך" />
      <Hint show={started && hud.score === 0} className="bottom-28 text-white/70">
        גוררים את האצבע ימינה ושמאלה. הוא יורה לבד
      </Hint>
    </Stage>
  );
}
