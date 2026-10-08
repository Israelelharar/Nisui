import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Eye } from 'lucide-react';
import { photos } from '../../content/photos';
import { tap } from '../../lib/haptics';
import { click, tada } from '../sound';
import { Stage, type GameProps } from './kit';

const sizeFor = (level: number) => (level <= 3 ? 3 : level <= 7 ? 4 : 5);

/** A solvable shuffle: random legal moves backwards from the solved board. */
function shuffled(n: number, moves: number) {
  const b = Array.from({ length: n * n }, (_, i) => i); // value n*n-1 is the hole
  let hole = n * n - 1;
  let prev = -1;
  for (let k = 0; k < moves; k++) {
    const r = Math.floor(hole / n);
    const c = hole % n;
    const opts = [hole - n, hole + n, c > 0 ? hole - 1 : -1, c < n - 1 ? hole + 1 : -1].filter((x) => x >= 0 && x < n * n && x !== prev && (x !== hole - n || r > 0));
    const pick = opts[Math.floor(Math.random() * opts.length)];
    [b[hole], b[pick]] = [b[pick], b[hole]];
    prev = hole;
    hole = pick;
  }
  if (b.every((v, i) => v === i)) return shuffled(n, moves + 3);
  return b;
}

/**
 * פאזל הזזה: one of our photos, cut into squares with one missing. Tapping a
 * square in the hole's row or column slides it (and those between) in. Bigger
 * grids as the levels go: 3×3, then 4×4, then 5×5. She continues where she stopped.
 */
export function PuzzleGame({ level, onEnd, onClose }: GameProps) {
  const n = sizeFor(level);
  const photo = useMemo(() => photos[(level * 7 + 3) % photos.length], [level]);
  const [board, setBoard] = useState(() => shuffled(n, 30 + level * 18));
  const [moves, setMoves] = useState(0);
  const [peek, setPeek] = useState(false);
  const [won, setWon] = useState(false);
  const hole = board.indexOf(n * n - 1);

  const press = (i: number) => {
    if (won) return;
    const hr = Math.floor(hole / n);
    const hc = hole % n;
    const r = Math.floor(i / n);
    const c = i % n;
    if (r !== hr && c !== hc) {
      tap(12);
      return;
    }
    const b = board.slice();
    const step = r === hr ? (c < hc ? -1 : 1) : c === hc ? (r < hr ? -n : n) : 0;
    let h = hole;
    while (h !== i) {
      b[h] = b[h + step];
      h += step;
    }
    b[i] = n * n - 1;
    click();
    tap(4);
    setBoard(b);
    setMoves((m) => m + 1);
    if (b.every((v, k) => v === k)) {
      setWon(true);
      tada();
      window.setTimeout(() => onEnd({ score: level, coins: 14 + n * n, level: level + 1 }), 1800);
    }
  };

  return (
    <Stage title="פאזל הזזה" level={level} score={moves} onClose={onClose} bg="linear-gradient(#EFF8E9, #FFF7F1)">
      <div className="flex h-full flex-col items-center px-4 pt-3">
        <div
          dir="ltr"
          className="relative aspect-square w-full max-w-[400px] rounded-[18px] bg-[#C7B39B] p-1.5 shadow-[0_18px_30px_-16px_rgb(90_50_20/0.6)]"
          style={{ rotate: '-0.6deg' }}
        >
          <div className="relative size-full">
            {board.map((v, i) => {
              if (v === n * n - 1 && !won) return null;
              const r = Math.floor(i / n);
              const c = i % n;
              const vr = Math.floor(v / n);
              const vc = v % n;
              return (
                <motion.button
                  key={v}
                  type="button"
                  onClick={() => press(i)}
                  aria-label={`חלק ${v + 1}`}
                  className="absolute overflow-hidden rounded-[6px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.5),0_2px_3px_rgb(0_0_0/0.2)]"
                  initial={false}
                  animate={{ left: `${(c * 100) / n}%`, top: `${(r * 100) / n}%`, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                  style={{
                    width: `calc(${100 / n}% - 3px)`,
                    height: `calc(${100 / n}% - 3px)`,
                    margin: 1.5,
                    backgroundImage: `url(${photo.src})`,
                    backgroundSize: `${n * 100}% ${n * 100}%`,
                    backgroundPosition: `${(vc * 100) / (n - 1)}% ${(vr * 100) / (n - 1)}%`,
                  }}
                />
              );
            })}
            {(peek || won) && (
              <motion.img
                src={photo.src}
                alt={photo.alt}
                className="absolute inset-0 size-full rounded-[10px] object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: won ? 1 : 0.92 }}
                transition={{ duration: won ? 0.9 : 0.15, delay: won ? 0.3 : 0 }}
              />
            )}
          </div>
        </div>
        {won ? (
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-5 px-4 text-center font-hand text-[17px] text-ink/80">
            {photo.caption}
          </motion.p>
        ) : (
          <button
            type="button"
            onPointerDown={() => setPeek(true)}
            onPointerUp={() => setPeek(false)}
            onPointerLeave={() => setPeek(false)}
            className="mt-6 flex h-11 items-center gap-2 rounded-full bg-paper px-5 font-bold shadow-soft select-none"
          >
            <Eye size={18} /> להחזיק כדי להציץ בתמונה
          </button>
        )}
        <p className="mt-3 text-center font-hand text-[14px] text-muted">
          {n}×{n} · נוגעים בריבוע שבשורה או בטור של החור
        </p>
      </div>
    </Stage>
  );
}
