import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Phone, RefreshCw } from 'lucide-react';
import { Sheet } from './Sheet';
import { useApp } from '../hooks/useApp';
import { strengthStates } from '../content/strength';
import type { Mood } from '../content/types';
import { pickDaily } from '../lib/daily';
import { track } from '../lib/events';
import { burstHeart } from './HeartBurst';
import { A, a, p } from '../lib/he';
import { has } from '../client';

/** "⚡ I need strength". Choose how you feel → something the admin prepared. */
export function StrengthSheet() {
  const { sheet, closeSheet, clock, openSheet } = useApp();
  const [mood, setMood] = useState<Mood | null>(null);
  const [step, setStep] = useState(0);
  const state = strengthStates.find((s) => s.mood === mood);

  // Start fresh next time it opens (also after jumping to the contact sheet).
  useEffect(() => {
    if (sheet === 'strength') return;
    const id = window.setTimeout(() => {
      setMood(null);
      setStep(0);
    }, 400);
    return () => window.clearTimeout(id);
  }, [sheet]);

  const close = closeSheet;

  return (
    <Sheet open={sheet === 'strength'} onClose={close} title={state ? state.label : `אני ${p('צריך', 'צריכה')} כוח`}>
      <AnimatePresence mode="wait" initial={false}>
        {!state ? (
          <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="mb-4 text-muted">מה הכי קרוב למה ש{p('אתה מרגיש', 'את מרגישה')} עכשיו?</p>
            <ul className="grid grid-cols-2 gap-2.5">
              {strengthStates.map((s, i) => (
                <li key={s.mood} className={i === strengthStates.length - 1 ? 'col-span-2' : ''}>
                  <button
                    type="button"
                    onClick={() => {
                      setMood(s.mood);
                      track('strength', { label: s.label });
                    }}
                    className="flex min-h-14 w-full items-center gap-2.5 rounded-2xl bg-paper px-4 py-3 text-right text-[15px] font-semibold shadow-soft transition-transform active:scale-[0.98]"
                  >
                    <span aria-hidden className="text-xl">{s.emoji}</span>
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : (
          <motion.div key={`r-${step}`} initial={{ opacity: 0, filter: 'blur(6px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} exit={{ opacity: 0 }}>
            <article className="relative rounded-2xl bg-paper px-5 pt-7 pb-5 shadow-paper">
              <span aria-hidden className="absolute -top-2.5 left-1/2 -ml-11 h-5 w-22 -rotate-3 rounded-sm bg-soft" />
              <p className="font-serif text-[20px] leading-relaxed">{pickDaily(state.responses, clock.dayIndex, `strength:${state.mood}`, step)}</p>
              <p className="mt-3 font-hand text-sm text-accent">— {A}</p>
            </article>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setStep((x) => x + 1)}
                className="flex h-13 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-accent font-bold"
              >
                <RefreshCw size={18} className="text-accent" /> עוד אחד
              </button>
              <button
                type="button"
                onClick={() => {
                  burstHeart();
                  close();
                }}
                className="h-13 rounded-2xl bg-accent font-bold text-white"
              >
                תודה ❤️
              </button>
              {has('contact') && (
              <button
                type="button"
                onClick={() => openSheet('contact')}
                className="col-span-2 flex h-13 items-center justify-center gap-2 rounded-2xl bg-paper font-bold shadow-soft"
              >
                <Phone size={18} className="text-accent" /> אני {p('צריך', 'צריכה')} לשמוע {a('אותו', 'אותה')}
              </button>
              )}
            </div>
            <button type="button" onClick={() => { setMood(null); setStep(0); }} className="mx-auto mt-3 mb-1 flex min-h-11 items-center gap-1 text-sm text-muted">
              <ArrowRight size={16} /> לבחור משהו אחר
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
