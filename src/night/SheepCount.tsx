import { quest } from '../lib/quest';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { Meadow } from './Meadow';
import { Sheep, SheepShadow, type SheepKind } from './Sheep';
import { bleat, chime, hop, oops, thud } from './sfx';
import { tap } from '../lib/haptics';
import { A, P, p } from '../lib/he';

/**
 * Counting sheep, but each round has a catch. The sheep trot in from the
 * right and hop the fence; count them in your head, then pick the number.
 *  1. all of them
 *  2. only the admin's (with the admin's face)
 *  3. only the black ones, and some lose their nerve and turn back
 *  4. only the partner's, now they come in pairs
 *  5. only the ones in a nightcap, and faster
 */
type Target = 'all' | 'admin' | 'black' | 'partner' | 'cap';
interface Spec {
  kind: SheepKind;
  cap: boolean;
  at: number;
  speed: number;
  refuse: boolean;
  lane: number;
  pitch: number;
}
interface Round {
  target: Target;
  rule: string;
  hint?: string;
  sheep: Spec[];
}

const ROUNDS: Target[] = ['all', 'admin', 'black', 'partner', 'cap'];
const WHO: Record<Target, string> = {
  all: 'כבשים',
  admin: `כבשים של ${A}`,
  black: 'כבשים שחורות',
  partner: `כבשים של ${P}`,
  cap: 'כבשים עם כובע שינה',
};

const count = p('ספור', 'ספרי');
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

function makeRound(target: Target): Round {
  const cfg = {
    all: { n: [5, 7], speed: 82, gap: [1.5, 2.3], refuse: 0 },
    admin: { n: [7, 9], speed: 92, gap: [1.2, 2], refuse: 0 },
    black: { n: [8, 10], speed: 98, gap: [1.1, 1.8], refuse: 0.28 },
    partner: { n: [9, 11], speed: 108, gap: [0.45, 1.6], refuse: 0.12 },
    cap: { n: [10, 12], speed: 122, gap: [0.5, 1.3], refuse: 0.15 },
  }[target];
  const n = Math.round(rnd(cfg.n[0], cfg.n[1]));
  const sheep: Spec[] = [];
  let at = 0.6;
  for (let i = 0; i < n; i++) {
    let kind: SheepKind = pick(['white', 'white', 'black', 'admin', 'partner']);
    if (target === 'admin' && Math.random() < 0.4) kind = 'admin';
    if (target === 'partner' && Math.random() < 0.4) kind = 'partner';
    if (target === 'black' && Math.random() < 0.35) kind = 'black';
    const cap = target === 'cap' ? Math.random() < 0.42 : Math.random() < 0.12;
    sheep.push({ kind, cap, at, speed: cfg.speed * rnd(0.88, 1.15), refuse: Math.random() < cfg.refuse, lane: rnd(-6, 6), pitch: rnd(0.85, 1.25) });
    at += rnd(cfg.gap[0], cfg.gap[1]);
  }
  // make sure there is something to count, and at least one decoy
  if (!sheep.some((s) => matches(s, target) && !s.refuse)) {
    const s = sheep[Math.floor(n / 2)];
    s.refuse = false;
    if (target === 'cap') s.cap = true;
    else if (target !== 'all') s.kind = target as SheepKind;
  }
  const rules: Record<Target, [string, string?]> = {
    all: [`${count} כמה כבשים קופצות מעל הגדר`, 'בלי לחץ. הן לאט.'],
    admin: [`${count} רק את הכבשים עם הפרצוף של ${A}`, 'כל השאר לא נחשבות'],
    black: [`${count} רק את הכבשים השחורות`, 'זהירות: יש כאלה שמתחרטות ולא קופצות. הן לא נחשבות'],
    partner: [`${count} רק את הכבשים עם הפרצוף שלך`, 'עכשיו הן מגיעות בזוגות'],
    cap: [`${count} רק כבשים עם כובע שינה`, 'הסיבוב האחרון, והן ממהרות לישון'],
  };
  return { target, rule: rules[target][0], hint: rules[target][1], sheep };
}

function matches(s: Spec, t: Target) {
  if (t === 'all') return true;
  if (t === 'cap') return s.cap;
  return s.kind === t;
}

const SIZE = 92;
const FEET = SIZE * 0.82 * (75 / 82);
const JUMP_HALF = 72;
const LIFT = 96;
const PAUSE = 1.5;

/** Choices: the answer and three neighbours, shuffled. */
function choicesFor(n: number) {
  const set = new Set([n]);
  for (const d of [1, -1, 2, -2, 3]) {
    if (set.size >= 4) break;
    if (n + d >= 0) set.add(n + d);
  }
  return [...set].sort(() => Math.random() - 0.5);
}

export function SheepCount({ onClose, onFarm }: { onClose: () => void; onFarm: () => void }) {
  const reduce = useReducedMotion();
  const [r, setR] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'play' | 'ask' | 'result' | 'end'>('intro');
  const [round, setRound] = useState(() => makeRound(ROUNDS[0]));
  const [stars, setStars] = useState<boolean[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const shadows = useRef<(HTMLDivElement | null)[]>([]);
  const [box, setBox] = useState({ w: 400, h: 800 });

  const answer = useMemo(() => round.sheep.filter((s) => matches(s, round.target) && !s.refuse).length, [round]);
  const choices = useMemo(() => choicesFor(answer), [answer]);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const groundY = box.h * 0.7;
  const fenceX = box.w / 2;

  // Park every sheep off stage until its turn.
  useLayoutEffect(() => {
    els.current.forEach((el) => el && (el.style.transform = `translate(${box.w + 200}px, ${groundY - FEET}px)`));
    shadows.current.forEach((el) => el && (el.style.opacity = '0'));
  }, [round, box.w, groundY]);

  useEffect(() => {
    if (phase !== 'play') return;
    const t0 = performance.now();
    const sp = reduce ? 1.6 : 1; // calmer pace when motion is reduced
    const flags = round.sheep.map(() => ({ up: false, down: false, stop: false }));
    let raf = 0;
    const frame = (now: number) => {
      const T = (now - t0) / 1000;
      let alive = 0;
      round.sheep.forEach((s, i) => {
        const el = els.current[i];
        const sh = shadows.current[i];
        if (!el || !sh) return;
        const t = T - s.at * sp;
        const startX = box.w + 20 + SIZE / 2;
        if (t < 0) {
          alive++;
          return;
        }
        const v = s.speed / sp;
        let cx: number;
        let flip = false;
        let state = 'walk';
        let done = false;
        if (!s.refuse) {
          cx = startX - v * t;
          done = cx < -SIZE;
        } else {
          const stopAt = fenceX + 78;
          const t1 = (startX - stopAt) / v;
          if (t < t1) cx = startX - v * t;
          else if (t < t1 + PAUSE) {
            cx = stopAt;
            state = t < t1 + 0.9 ? 'shake' : 'idle';
            if (!flags[i].stop) {
              flags[i].stop = true;
              bleat(s.pitch * 1.1, 0.09);
            }
          } else {
            cx = stopAt + v * (t - t1 - PAUSE);
            flip = true;
            done = cx > box.w + SIZE;
          }
        }
        const d = (cx - fenceX) / JUMP_HALF;
        const lift = !s.refuse && Math.abs(d) < 1 ? LIFT * (1 - d * d) : 0;
        if (lift > 0) {
          state = 'air';
          if (!flags[i].up) {
            flags[i].up = true;
            hop();
            if (Math.random() < 0.45) bleat(s.pitch);
          }
        } else if (flags[i].up && !flags[i].down) {
          flags[i].down = true;
          thud(0.18);
        }
        if (!done) alive++;
        const y = groundY - FEET - lift + s.lane;
        // a little forward tilt going up, back tilt coming down
        const tilt = lift > 0 ? d * -14 : 0;
        el.style.transform = `translate(${cx - SIZE / 2}px, ${y}px) rotate(${tilt}deg) scaleX(${flip ? -1 : 1})`;
        el.style.zIndex = String(10 + Math.round(s.lane));
        if (el.dataset.state !== state) el.dataset.state = state;
        const k = 1 - lift / (LIFT * 1.6);
        sh.style.opacity = done ? '0' : String(0.9 * k);
        sh.style.transform = `translate(${cx - SIZE * 0.35}px, ${groundY + s.lane - 6}px) scale(${k})`;
      });
      if (alive === 0) {
        window.setTimeout(() => setPhase('ask'), 500);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase, round, box.w, groundY, fenceX, reduce]);

  const start = () => {
    tap(8);
    setChosen(null);
    setPhase('play');
  };

  const choose = (n: number) => {
    if (chosen !== null) return;
    tap(12);
    setChosen(n);
    const ok = n === answer;
    if (ok) chime();
    else oops();
    setStars((s) => [...s, ok]);
    setPhase('result');
  };

  const next = useCallback(() => {
    tap(8);
    if (r + 1 >= ROUNDS.length) {
      setPhase('end');
      quest('sheep');
      chime([523, 659, 784, 1047, 1319]);
      return;
    }
    setR(r + 1);
    setRound(makeRound(ROUNDS[r + 1]));
    setPhase('intro');
  }, [r]);

  const again = () => {
    setR(0);
    setStars([]);
    setRound(makeRound(ROUNDS[0]));
    setPhase('intro');
  };

  const score = stars.filter(Boolean).length;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-center bg-[#0F1430]" dir="rtl" role="dialog" aria-modal="true" aria-label="לספור כבשים">
      <div ref={stage} className="relative h-full w-full max-w-[520px] overflow-hidden text-white">
        <Meadow ground={0.7} />

        {/* the fence */}
        <svg viewBox="0 0 120 70" className="absolute z-[30]" style={{ left: fenceX - 60, top: groundY - 64, width: 120, height: 70 }} aria-hidden>
          <g stroke="#2E2226" strokeWidth="2" strokeLinejoin="round">
            <rect x="4" y="22" width="112" height="9" rx="2" fill="#A97A52" />
            <rect x="4" y="44" width="112" height="9" rx="2" fill="#9A6D48" />
            {[14, 60, 106].map((x) => (
              <path key={x} d={`M${x - 6} 70V12l6-8 6 8v58z`} fill="#C08A5C" />
            ))}
          </g>
          <path d="M8 26h104M8 48h104" stroke="#E2B98C" strokeWidth="1.2" opacity=".55" />
        </svg>

        {round.sheep.map((_, i) => (
          <SheepShadow key={`sh${r}-${i}`} ref={(el) => void (shadows.current[i] = el)} size={SIZE} />
        ))}
        {round.sheep.map((s, i) => (
          <Sheep key={`s${r}-${i}`} ref={(el) => void (els.current[i] = el)} kind={s.kind} cap={s.cap} size={SIZE} />
        ))}

        {/* top bar */}
        <div className="absolute inset-x-0 top-0 z-[40] flex items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))]">
          <button type="button" onClick={onClose} aria-label="סגירה" className="flex size-11 items-center justify-center rounded-full bg-white/10 backdrop-blur active:scale-90">
            <X size={20} />
          </button>
          <div className="flex gap-1.5" aria-label={`סיבוב ${r + 1} מתוך 5`}>
            {ROUNDS.map((_, i) => (
              <span
                key={i}
                className={`block size-3 rounded-full border transition-all duration-500 ${
                  i < stars.length ? (stars[i] ? 'border-[#F2C27A] bg-[#F2C27A] shadow-[0_0_10px_#F2C27A]' : 'border-white/40 bg-white/20') : i === r ? 'border-white bg-transparent' : 'border-white/25'
                }`}
              />
            ))}
          </div>
        </div>

        {/* during play: the rule stays on screen as a little reminder */}
        <AnimatePresence>
          {phase === 'play' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 top-[calc(max(14px,env(safe-area-inset-top))+56px)] z-[40] flex justify-center px-6"
            >
              <p className="rounded-full bg-black/25 px-4 py-1.5 text-center font-hand text-sm text-white/85 backdrop-blur">{round.rule}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <Panel key={`intro${r}`}>
              <p className="text-xs font-bold tracking-[2px] text-[#F2C27A]">סיבוב {r + 1} מתוך 5</p>
              <h2 className="mt-2 font-serif text-[26px] leading-tight text-balance">{round.rule}</h2>
              {round.hint && <p className="mt-2 text-[15px] text-white/70">{round.hint}</p>}
              <TargetBadge target={round.target} />
              <button type="button" onClick={start} className="mt-5 h-13 w-full rounded-2xl bg-[#F2C27A] font-bold text-[#2A1A1E] active:scale-[0.97]">
                {r === 0 ? 'מתחילים לספור' : p('מוכן', 'מוכנה')}
              </button>
            </Panel>
          )}
          {(phase === 'ask' || phase === 'result') && (
            <Panel key={`ask${r}`}>
              <h2 className="font-serif text-[24px] leading-tight text-balance">
                כמה {WHO[round.target]} {round.target === 'all' ? 'קפצו' : 'קפצו מעל הגדר'}?
              </h2>
              <div className="mt-5 grid grid-cols-4 gap-2.5">
                {choices.map((n, i) => {
                  const right = phase === 'result' && n === answer;
                  const wrong = phase === 'result' && n === chosen && n !== answer;
                  return (
                    <motion.button
                      key={n}
                      type="button"
                      onClick={() => choose(n)}
                      disabled={phase === 'result'}
                      whileTap={{ scale: 0.9 }}
                      animate={right ? { y: [0, -10, 0], scale: [1, 1.12, 1] } : wrong ? { x: [0, -6, 6, -4, 0] } : {}}
                      transition={{ duration: 0.5 }}
                      style={{ rotate: `${[-3, 2, -1.5, 3][i]}deg` }}
                      className={`relative flex aspect-square items-center justify-center rounded-xl border-2 font-serif text-[30px] tabular-nums shadow-[0_6px_0_#5A3A22] transition-colors ${
                        right ? 'border-[#F2C27A] bg-[#E8B05C] text-[#2A1A1E]' : wrong ? 'border-[#E07A7A] bg-[#8A4A3A] text-white/80' : 'border-[#2E2226] bg-[#B07E52] text-[#2A1A1E]'
                      }`}
                    >
                      <span className="pointer-events-none absolute inset-x-1 top-1/2 h-px bg-[#2E2226]/15" />
                      {n}
                    </motion.button>
                  );
                })}
              </div>
              <AnimatePresence>
                {phase === 'result' && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
                    <p className="text-center font-hand text-lg text-[#F2C27A]">
                      {chosen === answer ? pick([`בדיוק! ${p('אתה גאון', 'את גאונה')}`, 'נכון! עין של נשר', 'יש! אף כבשה לא התחמקה']) : `כמעט. היו ${answer}`}
                    </p>
                    <button type="button" onClick={next} className="mt-4 h-13 w-full rounded-2xl bg-white/12 font-bold active:scale-[0.97]">
                      {r + 1 >= ROUNDS.length ? 'לסיכום' : 'לסיבוב הבא'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </Panel>
          )}
          {phase === 'end' && (
            <Panel key="end">
              <div className="flex justify-center gap-2">
                {stars.map((ok, i) => (
                  <motion.svg
                    key={i}
                    viewBox="0 0 24 24"
                    width="38"
                    height="38"
                    initial={{ scale: 0, rotate: -40 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15 * i, type: 'spring', stiffness: 260, damping: 14 }}
                  >
                    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z" fill={ok ? '#F2C27A' : 'none'} stroke={ok ? '#F2C27A' : '#ffffff55'} strokeWidth="1.5" strokeLinejoin="round" />
                  </motion.svg>
                ))}
              </div>
              <h2 className="mt-4 font-serif text-[26px] leading-tight">
                {score === 5 ? `מושלם. אף כבשה לא עבדה ${p('עליך', 'עלייך')}` : score >= 3 ? `${score} מתוך 5. מכובד מאוד` : 'הכבשים ניצחו הפעם'}
              </h2>
              <p className="mt-2 text-[15px] text-white/70">אוי, השער של הדיר נשאר פתוח והן ברחו לכל השדה…</p>
              <button type="button" onClick={onFarm} className="mt-5 h-13 w-full rounded-2xl bg-[#F2C27A] font-bold text-[#2A1A1E] active:scale-[0.97]">
                להחזיר אותן לדיר
              </button>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={again} className="h-12 flex-1 rounded-2xl bg-white/10 font-bold">
                  עוד פעם
                </button>
                <button type="button" onClick={onClose} className="h-12 flex-1 rounded-2xl bg-white/10 font-bold">
                  לילה טוב
                </button>
              </div>
            </Panel>
          )}
        </AnimatePresence>
      </div>
    </div>,
    document.body,
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="absolute inset-x-4 bottom-[max(20px,env(safe-area-inset-bottom))] z-[50] rounded-[28px] border border-white/12 bg-[#1B1830]/85 p-5 text-center shadow-[0_20px_60px_rgb(0_0_0/0.5)] backdrop-blur-xl"
    >
      {children}
    </motion.div>
  );
}

/** Which sheep to count, shown as a little sheep in a ring. */
function TargetBadge({ target }: { target: Target }) {
  const kinds: { kind: SheepKind; cap?: boolean }[] =
    target === 'all' ? [{ kind: 'white' }, { kind: 'black' }, { kind: 'admin' }] : target === 'cap' ? [{ kind: 'white', cap: true }, { kind: 'partner', cap: true }] : [{ kind: target as SheepKind }];
  return (
    <div className="mt-4 flex justify-center gap-3">
      {kinds.map((k, i) => (
        <div key={i} className="relative size-[76px] rounded-full border border-white/15 bg-white/8">
          <Sheep kind={k.kind} cap={k.cap} size={64} className="!top-3 !left-1.5" style={{ transform: 'none' }} />
        </div>
      ))}
    </div>
  );
}
