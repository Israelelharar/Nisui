import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { Sheet } from '../components/Sheet';
import { useApp } from '../hooks/useApp';
import { track } from '../lib/events';
import { tap } from '../lib/haptics';
import { chime } from './sfx';
import { MAX_GOALS, goalsFor, nextDate, review, setGoals, streak } from './goals';
import { p } from '../lib/he';

/** A hand-drawn tick box: an ink square that fills and gets a check stroke drawn in. */
function Tick({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden className="shrink-0">
      <rect x="3" y="3" width="22" height="22" rx="6" fill={on ? 'var(--color-accent)' : 'transparent'} stroke={on ? 'var(--color-accent)' : 'var(--color-muted)'} strokeWidth="2" style={{ transition: 'fill .25s' }} />
      <motion.path d="M8 14.5l4 4 8-9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ pathLength: on ? 1 : 0 }} transition={{ duration: 0.3 }} />
    </svg>
  );
}

/**
 * At night: first "did you do what you set for today?" (if she set something
 * yesterday), then "what are tomorrow's goals?".
 */
export function GoalsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { clock, showToast } = useApp();
  const today = clock.contentDate;
  const tomorrow = nextDate(today);
  const [step, setStep] = useState<'review' | 'plan'>('plan');
  const [checks, setChecks] = useState<boolean[]>([]);
  const [drafts, setDrafts] = useState<string[]>(['']);
  const [reviewedNow, setReviewedNow] = useState<null | { done: number; total: number }>(null);
  const todays = goalsFor(today);

  useEffect(() => {
    if (!open) return;
    const t = goalsFor(today);
    setStep(t && t.goals.length && !t.reviewed ? 'review' : 'plan');
    setChecks(t?.goals.map((g) => g.done) ?? []);
    const next = goalsFor(tomorrow);
    setDrafts(next?.goals.length ? next.goals.map((g) => g.text) : ['']);
    setReviewedNow(null);
  }, [open, today, tomorrow]);

  const finishReview = () => {
    if (!todays) return;
    review(today, checks);
    const done = checks.filter(Boolean).length;
    const total = todays.goals.length;
    track('goals', { done: String(done), total: String(total) });
    setReviewedNow({ done, total });
    if (done === total) chime();
    tap(16);
  };

  const save = () => {
    const texts = drafts.map((d) => d.trim()).filter(Boolean);
    if (!texts.length) return;
    setGoals(tomorrow, texts);
    track('goals_set', { n: String(texts.length) });
    tap(12);
    showToast('נשמר. מחר בלילה נבדוק ביחד');
    onClose();
  };

  const s = streak(today);

  return (
    <Sheet open={open} onClose={onClose} title={step === 'review' ? 'איך היה היום?' : 'המטרות למחר'}>
      <AnimatePresence mode="wait" initial={false}>
        {step === 'review' && todays ? (
          <motion.div key="review" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-3 pb-4">
            <p className="text-[15px] text-muted">אתמול בלילה הצבת לעצמך את המטרות האלה. עמדת בהן? {p('סמן', 'סמני')} מה עשית.</p>
            <ul className="flex flex-col gap-2">
              {todays.goals.map((g, i) => (
                <li key={i}>
                  <button
                    type="button"
                    disabled={!!reviewedNow}
                    aria-pressed={!!checks[i]}
                    onClick={() => {
                      tap(8);
                      setChecks((c) => c.map((v, j) => (j === i ? !v : v)));
                    }}
                    className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-paper px-4 py-3 text-right shadow-soft transition-transform active:scale-[0.98]"
                  >
                    <Tick on={!!checks[i]} />
                    <span className={`text-[16px] transition-colors ${checks[i] ? 'text-muted line-through decoration-accent/60 decoration-2' : ''}`}>{g.text}</span>
                  </button>
                </li>
              ))}
            </ul>
            {reviewedNow ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                <p className="text-center font-hand text-lg text-accent">
                  {reviewedNow.done === reviewedNow.total
                    ? 'הכל! אני כל כך גאה בך'
                    : reviewedNow.done === 0
                      ? 'גם ימים כאלה מותר. מחר יום חדש'
                      : `${reviewedNow.done} מתוך ${reviewedNow.total}. זה המון, באמת`}
                </p>
                <button type="button" onClick={() => setStep('plan')} className="h-13 rounded-2xl bg-accent font-bold text-white active:scale-[0.97]">
                  ועכשיו: מה המטרות למחר?
                </button>
              </motion.div>
            ) : (
              <button type="button" onClick={finishReview} className="h-13 rounded-2xl bg-accent font-bold text-white active:scale-[0.97]">
                סימנתי
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div key="plan" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-3 pb-4">
            <p className="text-[15px] text-muted">
              מה {p('אתה רוצה', 'את רוצה')} לעשות מחר? דברים קטנים זה מצוין. מחר בלילה אשאל אותך אם עמדת בהן.
              {s > 1 && <span className="block pt-1 font-hand text-accent">{s} ימים ברצף שעמדת בכל המטרות</span>}
            </p>
            {todays?.reviewed && (
              <p className="rounded-xl bg-soft px-3 py-2 text-sm">
                היום עמדת ב־{todays.goals.filter((g) => g.done).length} מתוך {todays.goals.length}
              </p>
            )}
            <ol className="flex flex-col gap-2">
              {drafts.map((d, i) => (
                <motion.li key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center font-serif text-lg text-muted tabular-nums">{i + 1}</span>
                  <label htmlFor={`goal-${i}`} className="sr-only">
                    מטרה {i + 1}
                  </label>
                  <input
                    id={`goal-${i}`}
                    value={d}
                    maxLength={70}
                    autoFocus={i === drafts.length - 1 && i > 0}
                    onChange={(e) => setDrafts((ds) => ds.map((x, j) => (j === i ? e.target.value : x)))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && d.trim() && drafts.length < MAX_GOALS) {
                        e.preventDefault();
                        setDrafts((ds) => [...ds, '']);
                      }
                    }}
                    placeholder={['ללכת לישון לפני 23:00', 'לשתות 8 כוסות מים', 'להתקשר לסבתא', 'לסיים את העבודה', 'לצאת להליכה'][i]}
                    className="h-12 min-w-0 flex-1 rounded-xl border-[1.5px] border-line bg-paper px-3.5 text-[15px] outline-none focus:border-accent"
                  />
                  {drafts.length > 1 && (
                    <button type="button" aria-label="למחוק" onClick={() => setDrafts((ds) => ds.filter((_, j) => j !== i))} className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted">
                      <X size={16} />
                    </button>
                  )}
                </motion.li>
              ))}
            </ol>
            {drafts.length < MAX_GOALS && (
              <button type="button" onClick={() => setDrafts((ds) => [...ds, ''])} className="flex h-11 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-line text-sm font-bold text-muted">
                <Plus size={16} /> עוד מטרה
              </button>
            )}
            <button type="button" onClick={save} disabled={!drafts.some((d) => d.trim())} className="h-13 rounded-2xl bg-accent font-bold text-white disabled:opacity-50 active:scale-[0.97]">
              לשמור למחר
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

/** How many of today's goals still wait for a tick (for the badge on the shelf). */
export function pendingReview(today: string) {
  const t = goalsFor(today);
  return t && t.goals.length && !t.reviewed ? t.goals.length : 0;
}
