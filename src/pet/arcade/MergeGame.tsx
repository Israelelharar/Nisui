import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { tap } from '../../lib/haptics';
import { bonk, note, whoosh } from '../sound';
import { Stage, announceLevel, drawHeart, drawStar, useBanner, type GameProps } from './kit';
import { apple, carrot, coinSprite, lettuce, strawberry, watermelon } from './sprites';

const N = 4;
const TIERS = [
  { name: 'חסה', bg: '#E4F5DA' },
  { name: 'גזר', bg: '#FFE3C2' },
  { name: 'תפוח ירוק', bg: '#E8F7C8' },
  { name: 'תפוח', bg: '#FFD6D6' },
  { name: 'תות', bg: '#FFD1DC' },
  { name: 'אבטיח', bg: '#D4F0D0' },
  { name: 'לב', bg: '#FFC2CF' },
  { name: 'כוכב', bg: '#FFF0B8' },
  { name: 'מטבע', bg: '#FFE6A3' },
  { name: 'לב זהב', bg: '#FFD66B' },
  { name: 'כוכב זהב', bg: '#FFC93C' },
];

/** Each tier's picture, drawn once with the arcade sprites. */
function useTierArt() {
  return useMemo(() => {
    if (typeof document === 'undefined') return [] as string[];
    return TIERS.map((_, i) => {
      const c = document.createElement('canvas');
      c.width = c.height = 120;
      const ctx = c.getContext('2d')!;
      const draw = [
        () => lettuce(ctx, 60, 62, 42),
        () => carrot(ctx, 60, 64, 44, 0.6),
        () => apple(ctx, 60, 64, 40, 0, '#9BD45A'),
        () => apple(ctx, 60, 64, 40),
        () => strawberry(ctx, 60, 64, 42),
        () => watermelon(ctx, 60, 70, 44),
        () => drawHeart(ctx, 60, 62, 40, '#E53950', '#3B2216'),
        () => drawStar(ctx, 60, 62, 44, '#FFD45C'),
        () => coinSprite(ctx, 60, 60, 36),
        () => {
          drawHeart(ctx, 60, 62, 42, '#F2C14E', '#8A5A12');
          drawStar(ctx, 82, 34, 12, '#fff');
        },
        () => {
          drawStar(ctx, 60, 62, 48, '#F2C14E');
          drawStar(ctx, 60, 62, 22, '#FFF4C2');
        },
      ][i];
      draw();
      return c.toDataURL();
    });
  }, []);
}

interface Tile {
  id: number;
  t: number;
  r: number;
  c: number;
  born: boolean;
  merged: boolean;
}

let nextId = 1;
const empty = (tiles: Tile[]) => {
  const out: [number, number][] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!tiles.some((t) => t.r === r && t.c === c)) out.push([r, c]);
  return out;
};
const spawn = (tiles: Tile[]) => {
  const e = empty(tiles);
  if (!e.length) return tiles;
  const [r, c] = e[Math.floor(Math.random() * e.length)];
  return [...tiles, { id: nextId++, t: Math.random() < 0.9 ? 0 : 1, r, c, born: true, merged: false }];
};

/** Slides everything toward `dir`; returns the new tiles, the points, and whether anything moved. */
function slide(tiles: Tile[], dir: 'left' | 'right' | 'up' | 'down') {
  const out: Tile[] = [];
  let pts = 0;
  let moved = false;
  for (let line = 0; line < N; line++) {
    const cells = tiles
      .filter((t) => (dir === 'left' || dir === 'right' ? t.r === line : t.c === line))
      .sort((a, b) => {
        const ka = dir === 'left' || dir === 'right' ? a.c : a.r;
        const kb = dir === 'left' || dir === 'right' ? b.c : b.r;
        return dir === 'left' || dir === 'up' ? ka - kb : kb - ka;
      });
    let pos = 0;
    let last: Tile | null = null;
    for (const t of cells) {
      if (last && last.t === t.t && !last.merged) {
        last.t += 1;
        last.merged = true;
        pts += 2 ** (last.t + 1);
        moved = true;
        continue;
      }
      const k = dir === 'left' || dir === 'up' ? pos : N - 1 - pos;
      const nt: Tile = { ...t, born: false, merged: false, r: dir === 'left' || dir === 'right' ? line : k, c: dir === 'left' || dir === 'right' ? k : line };
      if (nt.r !== t.r || nt.c !== t.c) moved = true;
      out.push(nt);
      last = nt;
      pos++;
    }
  }
  return { tiles: out, pts, moved };
}
const canMove = (tiles: Tile[]) => (['left', 'right', 'up', 'down'] as const).some((d) => slide(tiles, d).moved);

/**
 * מחברים ירקות: swipe, and two of the same join into the next: lettuce, carrot,
 * green apple… all the way to a golden star. No clock; it ends when the board is full.
 */
export function MergeGame({ onEnd, onClose }: GameProps) {
  const art = useTierArt();
  const [tiles, setTiles] = useState<Tile[]>(() => spawn(spawn([])));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [banner, show] = useBanner(1200);
  const over = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);

  const move = (dir: 'left' | 'right' | 'up' | 'down') => {
    if (over.current) return;
    const res = slide(tiles, dir);
    if (!res.moved) {
      tap(10);
      return;
    }
    whoosh();
    tap(4);
    const next = spawn(res.tiles);
    setTiles(next);
    const s = score + res.pts;
    setScore(s);
    const top = Math.max(...next.map((t) => t.t));
    if (res.pts) note(top + 1, 0.05);
    if (top > best) {
      setBest(top);
      if (top >= 4) announceLevel(show, top + 1, TIERS[top].name);
    }
    if (!canMove(next)) {
      over.current = true;
      bonk();
      window.setTimeout(() => onEnd({ score: s, coins: Math.min(180, Math.round(s / 20)), level: top + 1 }), 1000);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = ({ ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' } as const)[e.key as 'ArrowLeft'];
      if (d) {
        e.preventDefault();
        move(d);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const gap = 2.5;
  const size = (100 - gap * (N + 1)) / N;
  return (
    <Stage title="מחברים ירקות" score={score} level={best + 1} onClose={onClose} banner={banner} bg="linear-gradient(#FFF6E4, #F7E8CF)">
      <div className="flex h-full flex-col items-center px-4 pt-3">
        <div
          dir="ltr"
          className="relative aspect-square w-full max-w-[400px] touch-none rounded-[22px] bg-[#D9B98F] shadow-[inset_0_4px_10px_rgb(90_50_20/0.25),0_16px_30px_-18px_rgb(90_50_20/0.6)]"
          onPointerDown={(e) => (start.current = { x: e.clientX, y: e.clientY })}
          onPointerUp={(e) => {
            const a = start.current;
            start.current = null;
            if (!a) return;
            const dx = e.clientX - a.x;
            const dy = e.clientY - a.y;
            if (Math.hypot(dx, dy) < 24) return;
            move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
          }}
        >
          {Array.from({ length: N * N }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-[14px] bg-[#E9D3B0]/70"
              style={{ left: `${gap + (i % N) * (size + gap)}%`, top: `${gap + Math.floor(i / N) * (size + gap)}%`, width: `${size}%`, height: `${size}%` }}
            />
          ))}
          {tiles.map((t) => (
            <div
              key={t.id}
              className="absolute transition-[left,top] duration-[110ms] ease-out"
              style={{ left: `${gap + t.c * (size + gap)}%`, top: `${gap + t.r * (size + gap)}%`, width: `${size}%`, height: `${size}%` }}
            >
              <motion.div
                key={`${t.id}-${t.t}`}
                initial={t.born ? { scale: 0 } : t.t > 0 ? { scale: 1.18 } : false}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="flex size-full flex-col items-center justify-center rounded-[14px] shadow-[inset_0_-4px_0_rgb(0_0_0/0.08)]"
                style={{ background: TIERS[t.t].bg }}
              >
                {art[t.t] && <img src={art[t.t]} alt={TIERS[t.t].name} className="h-[62%] w-[62%] object-contain" draggable={false} />}
                <span className="text-[10px] leading-none font-bold text-ink/55">{TIERS[t.t].name}</span>
              </motion.div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5" dir="rtl">
          {TIERS.map((tier, i) => (
            <span key={tier.name} className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${i <= best ? 'bg-paper shadow-soft' : 'opacity-35'}`}>
              {art[i] && <img src={art[i]} alt="" className="size-4" />}
              {tier.name}
            </span>
          ))}
        </div>
        <p className="mt-3 text-center font-hand text-[14px] text-muted">מחליקים לכל כיוון. שניים זהים מתחברים לדבר הבא</p>
      </div>
    </Stage>
  );
}
