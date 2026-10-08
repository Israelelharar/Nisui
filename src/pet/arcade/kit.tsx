import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { tap } from '../../lib/haptics';
import { PigSvg, type Face } from '../PigSvg';
import { levelUp as levelUpSound } from '../sound';

export interface GameLook {
  skin: string;
  head?: string;
  face?: string;
  neck?: string;
}

export interface GameResult {
  score: number;
  coins: number;
  perfect?: boolean;
  /** The level she reached (saved for the games that continue where she stopped). */
  level?: number;
}

/** What every game gets. `level` is where she left off last time (1 for a fresh start). */
export interface GameProps {
  look: GameLook;
  level: number;
  onEnd: (r: GameResult) => void;
  onClose: () => void;
}

/* ───────────────────────── the frame around every game ───────────────────────── */

/**
 * The game's own room: her way out, the name, the level she's on, her hearts and
 * the score. `bg` paints the whole screen in the game's world (space, sky, felt…).
 */
export function Stage({
  title,
  score,
  hearts,
  maxHearts = 3,
  level,
  onClose,
  children,
  bg = 'var(--color-bg)',
  dark = false,
  banner,
}: {
  title: string;
  score?: ReactNode;
  hearts?: number;
  maxHearts?: number;
  level?: number;
  onClose: () => void;
  children: ReactNode;
  bg?: string;
  dark?: boolean;
  /** A short message that pops in the middle ("שלב 4!"); change its `key` to replay. */
  banner?: { key: number | string; text: string } | null;
}) {
  const ink = dark ? 'text-[#FFF6EC]' : 'text-ink';
  const chip = dark ? 'bg-white/12 text-[#FFF6EC] ring-1 ring-white/15' : 'bg-paper shadow-soft';
  return (
    <div className="fixed inset-0 z-50 flex flex-col select-none" style={{ background: bg }} dir="rtl">
      <div className={`mx-auto flex w-full max-w-[480px] items-center gap-2 px-3 pt-[max(12px,env(safe-area-inset-top))] pb-2 ${ink}`}>
        <button
          type="button"
          onClick={() => {
            tap(6);
            onClose();
          }}
          aria-label="יציאה מהמשחק"
          className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 ${chip}`}
        >
          <X size={21} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-serif text-[19px] leading-tight font-medium">{title}</h2>
          {level !== undefined && <div className={`text-[12px] font-bold ${dark ? 'text-[#FFD98A]' : 'text-gold-text'}`}>שלב {level}</div>}
        </div>
        {hearts !== undefined && <Hearts n={hearts} max={maxHearts} />}
        {score !== undefined && (
          <span className="min-w-[48px] rounded-full bg-accent px-3 py-1.5 text-center text-[15px] font-bold text-white tabular-nums shadow-[0_6px_14px_-8px_rgb(194_56_90/0.9)]">
            {score}
          </span>
        )}
      </div>
      <div className="relative mx-auto w-full max-w-[480px] flex-1 overflow-hidden">
        {children}
        <AnimatePresence>
          {banner && (
            <motion.div
              key={banner.key}
              className="pointer-events-none absolute inset-x-0 top-[34%] z-20 text-center"
              initial={{ opacity: 0, scale: 0.6, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.15, y: -16 }}
              transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            >
              <span className="inline-block -rotate-2 rounded-2xl bg-[#FFF6EC] px-5 py-2 font-hand text-[26px] font-bold text-accent shadow-[0_14px_30px_-12px_rgb(60_20_20/0.55)]">
                {banner.text}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const HEART = 'M12 21s-7.5-4.6-9.4-9.3C1.2 8.3 3.4 5 6.8 5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.4 0 5.6 3.3 4.2 6.7C19.5 16.4 12 21 12 21z';

/** Her hearts: full ones beat softly, a lost one breaks out of the row. */
export function Hearts({ n, max = 3 }: { n: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${n} לבבות מתוך ${max}`}>
      {Array.from({ length: max }, (_, i) => {
        const full = i < n;
        return (
          <motion.svg
            key={i}
            viewBox="0 0 24 24"
            width={22}
            height={22}
            animate={full ? { scale: 1, rotate: 0, opacity: 1 } : { scale: [1.5, 0.85], rotate: [0, -18], opacity: 0.55 }}
            transition={{ duration: 0.45 }}
          >
            <path d={HEART} fill={full ? '#E53950' : 'none'} stroke={full ? '#9E1F35' : '#C9A9AE'} strokeWidth={1.6} />
            {full && <path d="M7 8.5c-1 .4-1.6 1.3-1.6 2.3" stroke="#fff" strokeOpacity={0.7} strokeWidth={1.6} strokeLinecap="round" fill="none" />}
          </motion.svg>
        );
      })}
    </div>
  );
}

/** A banner that pops and leaves by itself. */
export function useBanner(ms = 1300) {
  const [banner, setBanner] = useState<{ key: number; text: string } | null>(null);
  const t = useRef<number | undefined>(undefined);
  const show = useCallback(
    (text: string) => {
      window.clearTimeout(t.current);
      setBanner({ key: performance.now(), text });
      t.current = window.setTimeout(() => setBanner(null), ms);
    },
    [ms],
  );
  useEffect(() => () => window.clearTimeout(t.current), []);
  return [banner, show] as const;
}

/** "שלב N!" with its little arpeggio. */
export function announceLevel(show: (t: string) => void, level: number, extra = '') {
  levelUpSound();
  tap(12);
  show(`שלב ${level}!${extra ? ` ${extra}` : ''}`);
}

/* ───────────────────────── canvas + loop ───────────────────────── */

export type Frame = (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number, now: number) => void;

/**
 * Runs `frame` every animation frame on a canvas that always matches its box at the
 * phone's pixel density. `frame` is read fresh each time, so it can close over state.
 */
export function useCanvasLoop(canvas: RefObject<HTMLCanvasElement | null>, frame: Frame, running = true) {
  const f = useRef(frame);
  f.current = frame;
  useEffect(() => {
    if (!running) return;
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      f.current(ctx, w, h, dt, now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [canvas, running]);
}

/* ───────────────────────── juice: particles, floating text, shake ───────────────────────── */

interface Part {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
  color: string;
  g: number;
  shape: 'dot' | 'heart' | 'star';
}
interface Float {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

/** Sparks, little hearts and "+3"s that fly out of every hit, and a screen shake that settles. */
export class FX {
  parts: Part[] = [];
  floats: Float[] = [];
  shake = 0;
  burst(x: number, y: number, colors: string[], n = 14, speed = 220, shape: Part['shape'] = 'dot', gravity = 420) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.75);
      const max = 0.45 + Math.random() * 0.5;
      this.parts.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - speed * 0.25,
        r: shape === 'dot' ? 2 + Math.random() * 3 : 5 + Math.random() * 4,
        life: max,
        max,
        color: colors[i % colors.length],
        g: gravity,
        shape,
      });
    }
  }
  text(x: number, y: number, text: string, color = '#C2385A') {
    this.floats.push({ x, y, text, color, life: 0.9 });
  }
  kick(n = 8) {
    this.shake = Math.max(this.shake, n);
  }
  /** Call before drawing the world: moves the camera by the current shake. */
  pre(ctx: CanvasRenderingContext2D, dt: number) {
    if (this.shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
      this.shake *= Math.pow(0.0015, dt);
    } else this.shake = 0;
  }
  /** Call after drawing the world. */
  draw(ctx: CanvasRenderingContext2D, dt: number) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.parts.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      p.vx *= Math.pow(0.4, dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const k = p.life / p.max;
      ctx.globalAlpha = Math.min(1, k * 1.6);
      ctx.fillStyle = p.color;
      if (p.shape === 'heart') drawHeart(ctx, p.x, p.y, p.r * (0.6 + k * 0.4), p.color);
      else if (p.shape === 'star') drawStar(ctx, p.x, p.y, p.r * (0.6 + k * 0.4), p.color);
      else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.5 + k * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life -= dt;
      if (f.life <= 0) {
        this.floats.splice(i, 1);
        continue;
      }
      f.y -= 46 * dt;
      ctx.globalAlpha = Math.min(1, f.life * 2.2);
      ctx.font = `800 ${18 + (0.9 - f.life) * 6}px 'Playpen Sans Hebrew', 'Assistant', sans-serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }
}

export function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, stroke?: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(r / 10, r / 10);
  ctx.beginPath();
  ctx.moveTo(0, 9);
  ctx.bezierCurveTo(-6, 5, -11, 1, -11, -3.5);
  ctx.bezierCurveTo(-11, -8, -7.5, -10.5, -4.5, -10.5);
  ctx.bezierCurveTo(-2.5, -10.5, -1, -9.5, 0, -7.5);
  ctx.bezierCurveTo(1, -9.5, 2.5, -10.5, 4.5, -10.5);
  ctx.bezierCurveTo(7.5, -10.5, 11, -8, 11, -3.5);
  ctx.bezierCurveTo(11, 1, 6, 5, 0, 9);
  ctx.fillStyle = color;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/* ───────────────────────── his picture, for canvas games ───────────────────────── */

/**
 * Draws her pig (skin, hat and all) once into a bitmap the canvas games can stamp
 * cheaply every frame. Returns the bitmap (null until ready) and a hidden node to render.
 */
export function usePigSprite(look: GameLook, mood: Face = 'happy', px = 180) {
  const holder = useRef<HTMLDivElement>(null);
  const [sprite, setSprite] = useState<HTMLCanvasElement | null>(null);
  const key = `${look.skin}|${look.head}|${look.face}|${look.neck}|${mood}`;
  useEffect(() => {
    const svg = holder.current?.querySelector('svg');
    if (!svg) return;
    let alive = true;
    const markup = svg.outerHTML
      .replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
      .replace(/viewBox="[^"]*"/, 'viewBox="-20 -40 240 275"');
    const img = new Image();
    img.onload = () => {
      if (!alive) return;
      const c = document.createElement('canvas');
      c.width = px;
      c.height = Math.round((px * 275) / 240);
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
      setSprite(c);
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    return () => {
      alive = false;
    };
  }, [key, px]);
  const node = (
    <div ref={holder} aria-hidden style={{ position: 'fixed', left: -9999, top: 0, width: 200, height: 225, pointerEvents: 'none' }}>
      <PigSvg {...look} mood={mood} />
    </div>
  );
  return [sprite, node] as const;
}

/** Stamps the pig sprite centered at (x, y), `w` wide, with squash & tilt. */
export function drawPig(ctx: CanvasRenderingContext2D, sprite: HTMLCanvasElement | null, x: number, y: number, w: number, tilt = 0, squash = 1, flip = false) {
  if (!sprite) {
    ctx.fillStyle = '#E8B48A';
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.4, w * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const h = (w * sprite.height) / sprite.width;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(flip ? -1 / squash : 1 / squash, squash);
  ctx.drawImage(sprite, -w / 2, -h / 2 - h * 0.04, w, h);
  ctx.restore();
}

/* ───────────────────────── small bits ───────────────────────── */

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
export const shuffle = <T,>(a: readonly T[]) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** A hint line that fades away after the first few seconds of a game. */
export function Hint({ children, show = true, className = '', style }: { children: ReactNode; show?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.p
          className={`pointer-events-none absolute inset-x-0 z-10 text-center font-hand text-[16px] ${className}`}
          style={style}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {children}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** "Tap to start" over a game that waits for her (so nothing hits her before she's ready). */
export function TapToStart({ show, text = 'נוגעים כדי להתחיל', dark = false }: { show: boolean; text?: string; dark?: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span className={`tap-pulse rounded-full px-5 py-2 font-hand text-[19px] font-bold ${dark ? 'bg-white/15 text-white' : 'bg-white/85 text-ink shadow-soft'}`}>{text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
