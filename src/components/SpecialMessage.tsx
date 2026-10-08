import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Heart } from 'lucide-react';
import { Paper } from './Paper';
import { burstHeart } from './HeartBurst';
import { track } from '../lib/events';
import { tap } from '../lib/haptics';
import { A, p } from '../lib/he';

/** The admin's special message for today: sealed until opened. */
export function SpecialMessage({ special, dayKey }: { special: { title?: string; body: string }; dayKey: string }) {
  const key = `idw:special:${dayKey}`;
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          tap(14);
          burstHeart();
          setOpen(true);
          track('letter_opened', { title: `הודעה מיוחדת: ${special.title ?? ''}`.trim() });
          try {
            localStorage.setItem(key, '1');
          } catch {
            /* fine */
          }
        }}
        className="flex items-center gap-4 rounded-[22px] bg-accent px-5 py-4 text-right text-white shadow-paper transition-transform active:scale-[0.98]"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15 animate-pulse-seal">
          <Heart size={22} fill="#FFE7B8" strokeWidth={0} />
        </span>
        <span>
          <span className="block font-serif text-xl">יש לך הודעה מיוחדת מ{A}</span>
          <span className="block text-sm text-white/85">רק להיום. {p('לחץ', 'לחצי')} לפתוח.</span>
        </span>
      </button>
    );
  }
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 10, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}>
      <Paper className="border-2 border-accent/30 px-5 pt-7 pb-5">
        <p className="text-xs font-bold tracking-[2px] text-accent">הודעה מיוחדת</p>
        {special.title && <h2 className="mt-1 font-serif text-[24px]">{special.title}</h2>}
        <p className="mt-2 font-serif text-[19px] leading-relaxed whitespace-pre-line">{special.body}</p>
        <p className="mt-3 font-hand text-sm text-accent">— {A}</p>
      </Paper>
    </motion.div>
  );
}
