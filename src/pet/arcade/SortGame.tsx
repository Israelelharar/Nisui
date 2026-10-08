import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Undo2 } from 'lucide-react';
import { tap } from '../../lib/haptics';
import { bonk, note, splash, tada, tick } from '../sound';
import { Stage, type GameProps } from './kit';

const CAP = 4;
const LIQUIDS = ['#FF8FA8', '#7EC8F2', '#8FD06A', '#FFD45C', '#B48CF0', '#FF9A62', '#5DCBB8', '#E85A6A', '#8A6BE8', '#F2A6D8', '#6B8BD6'];

/** Colors and tubes for a level: 3 colors at first, up to 11; always two empty tubes. */
const setup = (level: number) => {
  const colors = Math.min(LIQUIDS.length, 3 + Math.floor((level - 1) / 2));
  return { colors, tubes: colors + 2 };
};

function deal(level: number): number[][] {
  const { colors, tubes } = setup(level);
  for (;;) {
    const all = Array.from({ length: colors * CAP }, (_, i) => i % colors);
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    const out: number[][] = Array.from({ length: tubes }, (_, t) => (t < colors ? all.slice(t * CAP, t * CAP + CAP) : []));
    // never start with a tube that's already done
    if (!out.some((t) => t.length === CAP && t.every((c) => c === t[0]))) return out;
  }
}

const solved = (tubes: number[][]) => tubes.every((t) => !t.length || (t.length === CAP && t.every((c) => c === t[0])));

/** How many of the top color would move from a to b (0 = not allowed). */
function pourable(a: number[], b: number[]) {
  if (!a.length || b.length >= CAP) return 0;
  const top = a[a.length - 1];
  if (b.length && b[b.length - 1] !== top) return 0;
  let run = 0;
  for (let i = a.length - 1; i >= 0 && a[i] === top; i--) run++;
  return Math.min(run, CAP - b.length);
}

/**
 * מיון צבעים: pour the colors between bottles until each holds just one.
 * A color only pours onto the same color or into an empty bottle. More
 * colors every couple of levels; she continues where she stopped.
 */
export function SortGame({ level, onEnd, onClose }: GameProps) {
  const first = useMemo(() => deal(level), [level]);
  const [tubes, setTubes] = useState(first);
  const [hist, setHist] = useState<number[][][]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [pour, setPour] = useState<{ from: number; to: number } | null>(null);
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);

  const choose = (i: number) => {
    if (won || pour) return;
    if (sel === null) {
      if (!tubes[i].length) return;
      tick();
      tap(4);
      setSel(i);
      return;
    }
    if (sel === i) {
      setSel(null);
      return;
    }
    const n = pourable(tubes[sel], tubes[i]);
    if (!n) {
      bonk();
      tap(20);
      setSel(tubes[i].length ? i : null);
      return;
    }
    const from = sel;
    setPour({ from, to: i });
    splash();
    tap(8);
    window.setTimeout(() => {
      const next = tubes.map((t) => t.slice());
      for (let k = 0; k < n; k++) next[i].push(next[from].pop()!);
      setHist((h) => [...h, tubes]);
      setTubes(next);
      setPour(null);
      setSel(null);
      setMoves((m) => m + 1);
      if (next[i].length === CAP && next[i].every((c) => c === next[i][0])) note(next[i][0] + 3, 0.07);
      if (solved(next)) {
        setWon(true);
        tada();
        const { colors } = setup(level);
        window.setTimeout(() => onEnd({ score: level, coins: 12 + colors * 5, level: level + 1 }), 1300);
      }
    }, 420);
  };

  const { tubes: count } = setup(level);
  const perRow = count <= 6 ? count : Math.ceil(count / 2);
  return (
    <Stage title="מיון צבעים" level={level} score={moves} onClose={onClose} bg="linear-gradient(#EAF7F4, #FDF7EE)">
      <div className="flex h-full flex-col items-center px-3 pt-10">
        <div className="grid w-full max-w-[420px] justify-items-center gap-y-8" style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}>
          {tubes.map((t, i) => {
            const lifted = sel === i;
            const pouring = pour?.from === i;
            const towards = pour ? (pour.to > pour.from ? 1 : -1) : 0;
            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => choose(i)}
                aria-label={`בקבוק ${i + 1}`}
                animate={pouring ? { y: -46, x: towards * -26, rotate: towards * -58 } : { y: lifted ? -18 : 0, x: 0, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="relative flex h-[200px] w-[50px] flex-col-reverse overflow-hidden rounded-b-[22px] rounded-t-[6px] border-[2.5px] border-[#3B2216] bg-white/55 p-[3px] shadow-[inset_-6px_0_0_rgb(255_255_255/0.6)]"
                style={{ transformOrigin: '50% 10%' }}
              >
                {t.map((c, k) => (
                  <motion.span
                    key={`${k}-${c}`}
                    layout
                    initial={{ opacity: 0, scaleY: 0.4 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    className={`block w-full shrink-0 ${k === 0 ? 'rounded-b-[18px]' : ''}`}
                    style={{ height: `${100 / CAP}%`, background: `linear-gradient(90deg, ${LIQUIDS[c]}, ${LIQUIDS[c]}CC)`, transformOrigin: 'bottom' }}
                  />
                ))}
                <span className="pointer-events-none absolute top-2 left-2 h-[70%] w-1.5 rounded-full bg-white/60" />
              </motion.button>
            );
          })}
        </div>
        {won ? (
          <motion.p initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-10 font-hand text-[24px] font-bold text-accent">
            כל הצבעים במקום!
          </motion.p>
        ) : (
          <div className="mt-10 flex gap-3">
            <button
              type="button"
              disabled={!hist.length}
              onClick={() => {
                tick();
                setTubes(hist[hist.length - 1]);
                setHist((h) => h.slice(0, -1));
                setSel(null);
              }}
              className="flex h-11 items-center gap-1.5 rounded-full bg-paper px-4 font-bold shadow-soft disabled:opacity-35"
            >
              <Undo2 size={18} /> אחורה
            </button>
            <button
              type="button"
              onClick={() => {
                tick();
                setTubes(first);
                setHist([]);
                setSel(null);
                setMoves(0);
              }}
              className="flex h-11 items-center gap-1.5 rounded-full bg-paper px-4 font-bold shadow-soft"
            >
              <RotateCcw size={17} /> מההתחלה
            </button>
          </div>
        )}
        <p className="mt-4 text-center font-hand text-[14px] text-muted">נוגעים בבקבוק ואז בבקבוק שאליו מוזגים. צבע רק על אותו צבע</p>
      </div>
    </Stage>
  );
}
