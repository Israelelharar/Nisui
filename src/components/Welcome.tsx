import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { GuineaPig } from './GuineaPig';
import { tap } from '../lib/haptics';
import { photos } from '../content/photos';
import { has } from '../client';
import { P, p } from '../lib/he';

const ease = [0.2, 0.8, 0.2, 1] as const;

/**
 * Where the polaroids land on the table (percent of the stage: left, top,
 * width, tilt), in the order they drop. Up to seven of the couple's photos.
 */
const SPOTS = [
  [6, 4, 46, -7],
  [50, 7, 44, 6],
  [27, 30, 46, -2],
  [3, 52, 42, 5],
  [55, 50, 42, -6],
  [30, 64, 40, 3],
  [14, 34, 30, 9],
] as const;
const STEP = 0.18;
const shown = photos.slice(0, SPOTS.length);
const LANDED = 0.5 + Math.max(1, shown.length) * STEP + 0.35;
const TAPE = ['bg-soft/90', 'bg-butter/90', 'bg-sky/90', 'bg-peach/90'];

/** The way in: "welcome to our site", and the photos of us drop onto the table one by one. */
export function Welcome({ onEnter }: { onEnter: () => void }) {
  const reduce = useReducedMotion();
  const [landed, setLanded] = useState(!!reduce);
  useEffect(() => {
    if (reduce) return;
    const t = window.setTimeout(() => setLanded(true), LANDED * 1000);
    return () => window.clearTimeout(t);
  }, [reduce]);

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center overflow-hidden bg-[#F6F3EC] px-3 pt-[max(18px,env(safe-area-inset-top))] pb-10">
      <FloatingHearts />

      <h1 className="relative z-10 text-center leading-none">
        <motion.span
          className="block font-hand text-[clamp(28px,8.6vw,38px)] text-accent"
          initial={reduce ? false : { opacity: 0, y: 14, rotate: -4, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, rotate: -2, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
        >
          {P} {p('ברוך הבא', 'ברוכה הבאה')}
        </motion.span>
        <motion.span
          className="mt-1.5 block font-serif text-[24px] font-medium text-ink"
          initial={reduce ? false : { opacity: 0, y: 10, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease, delay: 0.35 }}
        >
          לאתר שלנו!{' '}
          <svg viewBox="0 0 24 24" width="22" height="22" className="welcome-beat inline-block -translate-y-0.5 align-middle text-[#E53950]" fill="currentColor" aria-label="❤️">
            <path d="M12 21s-7.5-4.6-9.4-9.3C1.2 8.3 3.4 5 6.8 5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.4 0 5.6 3.3 4.2 6.7C19.5 16.4 12 21 12 21z" />
          </svg>
        </motion.span>
      </h1>

      <div className="relative z-10 mt-4 aspect-[3/4]" style={{ width: 'min(100%, calc((100dvh - 236px) * 0.75))' }}>
        {shown.length === 0 && <Envelope />}
        {/* the photos, one by one, dropping from above and settling where they belong */}
        {shown.map((ph, i) => {
          const [l, t, w, tilt] = SPOTS[i];
          return (
            <motion.figure
              key={ph.id}
              className="absolute m-0 rounded-[3px] bg-white p-[3.5%] pb-[12%] shadow-[0_10px_22px_-8px_rgb(70_45_30/0.45)]"
              style={{ left: `${l}%`, top: `${t}%`, width: `${w}%` }}
              initial={reduce ? false : { opacity: 0, y: -90 - (i % 3) * 30, rotate: tilt * 2.2, scale: 1.25 }}
              animate={{ opacity: 1, y: 0, rotate: tilt, scale: 1 }}
              transition={{ type: 'spring', stiffness: 170, damping: 15, delay: 0.5 + i * STEP }}
            >
              <span aria-hidden className={`absolute -top-[7%] left-1/2 h-[14%] w-[44%] -translate-x-1/2 rotate-[-4deg] rounded-[2px] ${TAPE[i % TAPE.length]}`} />
              <img src={ph.srcSmall} alt="" draggable={false} className="aspect-square w-full object-cover select-none" />
            </motion.figure>
          );
        })}
        {/* a slow shine passing over the table, like light on glossy paper */}
        {landed && !reduce && shown.length > 0 && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="welcome-shine absolute inset-y-0 -left-1/2 w-1/3 bg-[linear-gradient(100deg,transparent,rgb(255_255_255/0.35),transparent)]" />
          </div>
        )}
      </div>

      <motion.button
        type="button"
        onClick={() => {
          tap();
          onEnter();
        }}
        initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
        animate={landed ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 12, filter: 'blur(6px)' }}
        transition={{ duration: 0.45, ease, delay: reduce ? 0 : 0.25 }}
        className="relative z-10 mt-5 h-14 w-[calc(100%-16px)] rounded-2xl bg-accent text-[17px] font-bold text-white shadow-[0_12px_24px_-12px_rgb(194_56_90/0.8)] transition-transform active:scale-[0.98]"
        tabIndex={landed ? 0 : -1}
      >
        להיכנס
      </motion.button>

      {has('pet') && <GuineaPig />}
    </main>
  );
}

/** With no photos yet: a sealed envelope on the table. */
function Envelope() {
  return (
    <div className="absolute inset-x-[6%] top-[22%] aspect-[3/2] -rotate-2 rounded-[10px] bg-env shadow-[0_24px_50px_rgb(80_40_30/0.16)]">
      <svg aria-hidden viewBox="0 0 300 110" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[58%] w-full">
        <path d="M2 2 L150 96 L298 2" fill="none" stroke="var(--color-env-dark)" strokeWidth="2" />
      </svg>
      <span className="absolute top-[32%] left-1/2 flex size-16 -translate-x-1/2 items-center justify-center rounded-full bg-accent shadow-[inset_0_0_0_5px_rgb(0_0_0/0.12)]">
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
          <path d="M12 20s-7-4.4-9.3-8.6C1.2 8.6 3 5 6.5 5c2 0 3.5 1.2 5.5 3.2C14 6.2 15.5 5 17.5 5 21 5 22.8 8.6 21.3 11.4 19 15.6 12 20 12 20z" fill="#FFE7B8" />
        </svg>
      </span>
      <span className="absolute right-[7%] bottom-[10%] font-serif text-[19px]">ל{P}</span>
    </div>
  );
}

/** Little hearts drifting up behind everything. */
function FloatingHearts() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className="welcome-heart absolute bottom-[-30px] text-accent"
          style={{ left: `${6 + ((i * 37) % 88)}%`, animationDelay: `${(i * 1.3) % 9}s`, animationDuration: `${9 + (i % 4) * 2}s`, opacity: 0.18 + (i % 3) * 0.08 }}
        >
          <svg viewBox="0 0 24 24" width={12 + (i % 3) * 6} height={12 + (i % 3) * 6} fill="currentColor">
            <path d="M12 21s-7.5-4.6-9.4-9.3C1.2 8.3 3.4 5 6.8 5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.4 0 5.6 3.3 4.2 6.7C19.5 16.4 12 21 12 21z" />
          </svg>
        </span>
      ))}
    </div>
  );
}
