import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { tap } from '../../lib/haptics';
import { PigSvg } from '../PigSvg';
import { right as rightSound, wrong as wrongSound, sparkle } from '../sound';
import { Stage, announceLevel, useBanner, type GameProps } from './kit';
import { QUESTIONS, deal, type Q } from './trivia';
import { p } from '../../lib/he';
import { species } from '../species';

const SEEN = 'idw:trivia-seen';
const readSeen = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
};
const saveSeen = (s: Set<string>) => {
  try {
    localStorage.setItem(SEEN, JSON.stringify([...s]));
  } catch {
    /* fine */
  }
};

/** Level by how many she got right: 1 at first, 2 after 5, 3 after 13. */
const levelFor = (right: number) => (right >= 13 ? 3 : right >= 5 ? 2 : 1);
const CHEERS = ['נכון!!', 'יש!', `${p('מכיר', 'מכירה')} אותנו בעל פה`, 'וואו', p('גאון', 'גאונה'), 'בול!', p('מושלם', 'מושלמת')];
const TINTS = ['#FFE3EC', '#FFF1C9', '#DDEBFA', '#E4F5DA'];

/**
 * כמה את/ה מכיר/ה אותנו?: a question card, four answers. Wrong costs a heart (and
 * shows the right one); the questions climb from easy to hard as she gets them
 * right, and ones she hasn't seen come first.
 */
export function TriviaGame({ look, onEnd, onClose }: GameProps) {
  const [seen] = useState(readSeen);
  const pools = useMemo(() => {
    const by = (l: number) => {
      const all = QUESTIONS.filter((q) => q[0] === l);
      const fresh = all.filter((q) => !seen.has(q[1]));
      const old = all.filter((q) => seen.has(q[1]));
      const mix = <T,>(a: T[]) => a.map((x) => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
      return [...mix(fresh), ...mix(old)];
    };
    return { 1: by(1), 2: by(2), 3: by(3) } as Record<1 | 2 | 3, Q[]>;
  }, [seen]);
  const [used, setUsed] = useState(0);
  const [rightN, setRightN] = useState(0);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [banner, show] = useBanner(1100);
  const level = levelFor(rightN);

  const [q, setQ] = useState<Q | null>(() => pools[1].shift() ?? null);
  const dealt = useMemo(() => (q ? deal(q) : null), [q]);

  const next = (lv: 1 | 2 | 3) => {
    // mostly her level, sometimes one easier, so it never feels like a wall
    const order: (1 | 2 | 3)[] = Math.random() < 0.25 && lv > 1 ? [(lv - 1) as 1 | 2, lv, 3, 2, 1] : [lv, 3, 2, 1];
    for (const l of order) {
      const n = pools[l].shift();
      if (n) return n;
    }
    return null;
  };

  const finish = (s: number, r: number) => onEnd({ score: s, coins: Math.min(180, 10 + r * 6), level: levelFor(r) });

  const choose = (i: number) => {
    if (picked !== null || !q || !dealt) return;
    setPicked(i);
    seen.add(q[1]);
    saveSeen(seen);
    setUsed((u) => u + 1);
    const ok = i === dealt.right;
    let s = score;
    let r = rightN;
    let h = hearts;
    if (ok) {
      const st = streak + 1;
      setStreak(st);
      r += 1;
      s += q[0] * 10 + (st >= 3 ? 5 * Math.min(st, 8) : 0);
      setRightN(r);
      setScore(s);
      rightSound();
      tap(8);
      if (levelFor(r) > level) window.setTimeout(() => announceLevel(show, levelFor(r), levelFor(r) === 3 ? 'למומחים בלבד' : 'קצת יותר קשה'), 300);
      else if (st >= 3 && st % 3 === 0) {
        sparkle();
        show(`רצף ${st}! 🔥`);
      }
    } else {
      setStreak(0);
      h -= 1;
      setHearts(h);
      wrongSound();
      tap(40);
    }
    window.setTimeout(
      () => {
        if (h <= 0) return finish(s, r);
        const n = next(levelFor(r));
        if (!n) return finish(s + 50, r);
        setQ(n);
        setPicked(null);
      },
      ok ? 900 : 1700,
    );
  };

  const ok = picked !== null && dealt && picked === dealt.right;
  return (
    <Stage
      title={`כמה ${p('אתה מכיר', 'את מכירה')} אותנו?`}
      score={score}
      hearts={hearts}
      level={level}
      onClose={onClose}
      banner={banner}
      bg="radial-gradient(120% 60% at 50% 0%, #FFE9EE 0%, #FFF7F1 70%)"
    >
      <div className="flex h-full flex-col overflow-y-auto px-4 pb-6">
        <div className="mx-auto mb-1 w-[84px]">
          <motion.div key={`${used}-${picked}`} animate={picked === null ? { y: [0, -4, 0] } : ok ? { y: [0, -16, 0], rotate: [0, -6, 6, 0] } : { x: [0, -6, 6, -4, 0] }} transition={{ duration: 0.5 }}>
            <PigSvg {...look} mood={picked === null ? 'normal' : ok ? 'laugh' : 'sad'} className="w-full" />
          </motion.div>
        </div>
        <AnimatePresence mode="wait">
          {q && dealt && (
            <motion.div
              key={q[1]}
              initial={{ opacity: 0, y: 24, rotate: 3 }}
              animate={{ opacity: 1, y: 0, rotate: -1 }}
              exit={{ opacity: 0, x: -60, rotate: -6 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="relative z-10"
            >
              <div className="relative rounded-[22px] bg-paper px-5 pt-6 pb-5 shadow-[0_18px_36px_-20px_rgb(80_30_40/0.5)]">
                <span className="absolute -top-2.5 left-1/2 h-5 w-20 -translate-x-1/2 rotate-[-3deg] bg-[#F7D9A8]/80" />
                <div className="mb-1 flex items-center justify-between text-[12px] font-bold text-muted">
                  <span>שאלה {used + (picked === null ? 1 : 0)}</span>
                  <span className="flex gap-0.5" aria-label={`רמה ${q[0]}`}>
                    {[1, 2, 3].map((d) => (
                      <span key={d} className={`size-2 rounded-full ${d <= q[0] ? 'bg-accent' : 'bg-line'}`} />
                    ))}
                  </span>
                </div>
                <h3 className="font-serif text-[22px] leading-snug font-medium text-balance">{q[1]}</h3>
              </div>
              <div className="mt-4 flex flex-col gap-2.5">
                {dealt.answers.map((a, i) => {
                  const isRight = i === dealt.right;
                  const state = picked === null ? 'idle' : isRight ? 'right' : i === picked ? 'wrong' : 'dim';
                  return (
                    <motion.button
                      key={a}
                      type="button"
                      onClick={() => choose(i)}
                      disabled={picked !== null}
                      initial={{ opacity: 0, x: 20 }}
                      animate={
                        state === 'wrong'
                          ? { opacity: 1, x: [0, -8, 8, -5, 5, 0] }
                          : state === 'right'
                            ? { opacity: 1, x: 0, scale: [1, 1.04, 1] }
                            : { opacity: state === 'dim' ? 0.45 : 1, x: 0 }
                      }
                      transition={{ delay: picked === null ? 0.06 * i : 0, duration: 0.4 }}
                      className={`relative min-h-[54px] rounded-2xl px-4 py-3 text-right text-[16.5px] leading-snug font-bold transition-colors ${
                        state === 'right' ? 'bg-[#5DB04F] text-white' : state === 'wrong' ? 'bg-[#E25A6A] text-white' : 'text-ink active:scale-[0.98]'
                      }`}
                      style={{
                        background: state === 'idle' || state === 'dim' ? TINTS[i] : undefined,
                        rotate: `${[0.6, -0.5, 0.4, -0.7][i]}deg`,
                        boxShadow: 'inset 0 -3px 0 rgb(0 0 0 / 0.07)',
                      }}
                    >
                      {a}
                      {state === 'right' && picked === i && (
                        <span className="absolute top-1/2 left-4 -translate-y-1/2 font-hand text-[14px]">{CHEERS[(used + score) % CHEERS.length]}</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-auto pt-5 text-center font-hand text-[13px] text-muted">
          {QUESTIONS.length} שאלות עלינו ועל ה{species.name} · טעות = לב
        </p>
      </div>
    </Stage>
  );
}
