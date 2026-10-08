import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { tap } from '../../lib/haptics';
import { PigSvg } from '../PigSvg';
import { bonk, giggle, note, tada } from '../sound';
import { Stage, type GameProps } from './kit';
import { p } from '../../lib/he';

const COLS = 7;
const ROWS = 6;
type Cell = 0 | 1 | 2; // 1 = her, 2 = him
type Board = Cell[][]; // [col][row from bottom]

const emptyBoard = (): Board => Array.from({ length: COLS }, () => []);
const at = (b: Board, c: number, r: number): Cell => (c < 0 || c >= COLS || r < 0 ? 0 : (b[c][r] ?? 0));

function winLine(b: Board): [number, number][] | null {
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS; r++) {
      const p = at(b, c, r);
      if (!p) continue;
      for (const [dc, dr] of [
        [1, 0],
        [0, 1],
        [1, 1],
        [1, -1],
      ]) {
        const line: [number, number][] = [[c, r]];
        for (let k = 1; k < 4 && at(b, c + dc * k, r + dr * k) === p; k++) line.push([c + dc * k, r + dr * k]);
        if (line.length === 4) return line;
      }
    }
  return null;
}
const winner = (b: Board): Cell => {
  const l = winLine(b);
  return l ? at(b, l[0][0], l[0][1]) : 0;
};
const full = (b: Board) => b.every((col) => col.length >= ROWS);
const drop = (b: Board, c: number, p: Cell): Board => b.map((col, i) => (i === c ? [...col, p] : col));

/** A simple board score from his side: open windows of 2 and 3, and the middle column. */
function evaluate(b: Board) {
  let s = 0;
  for (let r = 0; r < ROWS; r++) if (at(b, 3, r) === 2) s += 3;
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS; r++)
      for (const [dc, dr] of [
        [1, 0],
        [0, 1],
        [1, 1],
        [1, -1],
      ]) {
        let mine = 0;
        let hers = 0;
        let ok = true;
        for (let k = 0; k < 4; k++) {
          const cc = c + dc * k;
          const rr = r + dr * k;
          if (cc < 0 || cc >= COLS || rr < 0 || rr >= ROWS) {
            ok = false;
            break;
          }
          const v = at(b, cc, rr);
          if (v === 2) mine++;
          else if (v === 1) hers++;
        }
        if (!ok || (mine && hers)) continue;
        s += mine === 3 ? 12 : mine === 2 ? 4 : 0;
        s -= hers === 3 ? 14 : hers === 2 ? 4 : 0;
      }
  return s;
}

function minimax(b: Board, depth: number, alpha: number, beta: number, him: boolean): number {
  const w = winner(b);
  if (w === 2) return 100000 + depth;
  if (w === 1) return -100000 - depth;
  if (depth === 0 || full(b)) return evaluate(b);
  const order = [3, 2, 4, 1, 5, 0, 6].filter((c) => b[c].length < ROWS);
  if (him) {
    let best = -Infinity;
    for (const c of order) {
      best = Math.max(best, minimax(drop(b, c, 2), depth - 1, alpha, beta, false));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  }
  let best = Infinity;
  for (const c of order) {
    best = Math.min(best, minimax(drop(b, c, 1), depth - 1, alpha, beta, true));
    beta = Math.min(beta, best);
    if (alpha >= beta) break;
  }
  return best;
}

/** His move. Level 1 plays loosely; every level he thinks further ahead. */
function think(b: Board, level: number) {
  const open = [3, 2, 4, 1, 5, 0, 6].filter((c) => b[c].length < ROWS);
  // even at level 1 he'll take a win and block hers, but sometimes he daydreams
  for (const c of open) if (winner(drop(b, c, 2)) === 2) return c;
  if (level > 1 || Math.random() < 0.7) for (const c of open) if (winner(drop(b, c, 1)) === 1) return c;
  if (level === 1 && Math.random() < 0.55) return open[Math.floor(Math.random() * open.length)];
  const depth = Math.min(5, 1 + level);
  let best = open[0];
  let bestV = -Infinity;
  for (const c of open) {
    const v = minimax(drop(b, c, 2), depth - 1, -Infinity, Infinity, false) + Math.random() * (level < 4 ? 6 : 1);
    if (v > bestV) {
      bestV = v;
      best = c;
    }
  }
  return best;
}

/**
 * ארבע בשורה: she plays pink, he plays gold. Each win is a level, and he
 * gets cleverer every level (he looks further ahead). A loss or a draw is just
 * another round at the same level.
 */
export function ConnectGame({ look, level, onEnd, onClose }: GameProps) {
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [result, setResult] = useState<'her' | 'him' | 'draw' | null>(null);
  const [last, setLast] = useState<[number, number] | null>(null);
  const line = winLine(board);

  const play = (c: number, p: 1 | 2) => {
    if (board[c].length >= ROWS) return board;
    const b = drop(board, c, p);
    setBoard(b);
    setLast([c, b[c].length - 1]);
    note(p === 1 ? c : c + 3, 0.06);
    tap(6);
    const w = winner(b);
    if (w === 1) {
      setResult('her');
      tada();
      window.setTimeout(() => onEnd({ score: level, coins: 15 + level * 8, level: level + 1 }), 1600);
    } else if (w === 2) {
      setResult('him');
      giggle();
    } else if (full(b)) setResult('draw');
    else setTurn(p === 1 ? 2 : 1);
    return b;
  };

  useEffect(() => {
    if (turn !== 2 || result) return;
    const t = window.setTimeout(() => play(think(board, level), 2), 520);
    return () => window.clearTimeout(t);
  });

  const again = () => {
    setBoard(emptyBoard());
    setResult(null);
    setLast(null);
    setTurn(Math.random() < 0.5 ? 1 : 2);
  };

  return (
    <Stage title="ארבע בשורה" level={level} onClose={onClose} bg="linear-gradient(#EAF1FF, #FFF7F1)">
      <div className="flex h-full flex-col items-center px-3 pt-1">
        <div className="mb-2 flex w-full max-w-[420px] items-center justify-between">
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[14px] font-bold transition-opacity ${turn === 1 && !result ? 'bg-paper shadow-soft' : 'opacity-50'}`}>
            <span className="size-4 rounded-full bg-[#FF6F91] ring-2 ring-[#3B2216]" /> {p('אתה', 'את')}
          </div>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[14px] font-bold transition-opacity ${turn === 2 && !result ? 'bg-paper shadow-soft' : 'opacity-50'}`}>
            <span className="w-8">
              <PigSvg {...look} mood={result === 'him' ? 'laugh' : result === 'her' ? 'sad' : turn === 2 ? 'smile' : 'normal'} className="w-full" />
            </span>
            הוא <span className="size-4 rounded-full bg-[#FFC93C] ring-2 ring-[#3B2216]" />
          </div>
        </div>
        <div dir="ltr" className="relative w-full max-w-[420px] rounded-[22px] bg-[#5A8BD6] p-2 shadow-[inset_0_-6px_0_rgb(0_0_0/0.15),0_16px_30px_-16px_rgb(30_50_120/0.7)]">
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: COLS }, (_, c) => (
              <button
                key={c}
                type="button"
                aria-label={`עמודה ${c + 1}`}
                disabled={turn !== 1 || !!result || board[c].length >= ROWS}
                onClick={() => play(c, 1)}
                className="flex flex-col-reverse gap-1.5 rounded-xl py-0.5 transition-colors enabled:active:bg-white/10"
              >
                {Array.from({ length: ROWS }, (_, r) => {
                  const v = at(board, c, r);
                  const isLast = last?.[0] === c && last[1] === r;
                  const inLine = line?.some(([lc, lr]) => lc === c && lr === r);
                  return (
                    <span key={r} className="relative aspect-square w-full rounded-full bg-[#EAF2FF] shadow-[inset_0_3px_4px_rgb(0_0_0/0.25)]">
                      {v !== 0 && (
                        <motion.span
                          className="absolute inset-0 rounded-full ring-2 ring-[#3B2216]"
                          style={{ background: v === 1 ? 'radial-gradient(circle at 35% 30%, #FFC2D2, #FF6F91 60%)' : 'radial-gradient(circle at 35% 30%, #FFF0B0, #FFC93C 60%)' }}
                          initial={isLast ? { y: -(ROWS - r) * 52 } : false}
                          animate={{ y: 0, scale: inLine ? [1, 1.15, 1] : 1 }}
                          transition={isLast ? { type: 'spring', stiffness: 420, damping: 22 } : { repeat: inLine ? Infinity : 0, duration: 0.8 }}
                        />
                      )}
                    </span>
                  );
                })}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 min-h-[90px] text-center">
          {result === 'her' && <p className="font-hand text-[24px] font-bold text-accent">ניצחת אותו! בשלב הבא הוא יחשוב יותר</p>}
          {result && result !== 'her' && (
            <>
              <p className="font-hand text-[21px] font-bold">{result === 'him' ? 'הפעם הוא ניצח 😜' : 'תיקו!'}</p>
              <button
                type="button"
                onClick={() => {
                  bonk();
                  again();
                }}
                className="mt-2 h-11 rounded-full bg-accent px-6 font-bold text-white"
              >
                עוד סיבוב
              </button>
            </>
          )}
          {!result && <p className="font-hand text-[15px] text-muted">{turn === 1 ? 'התור שלך: נוגעים בעמודה' : 'הוא חושב…'}</p>}
        </div>
      </div>
    </Stage>
  );
}
