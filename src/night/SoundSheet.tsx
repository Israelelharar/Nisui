import { quest } from '../lib/quest';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Square } from 'lucide-react';
import { Sheet } from '../components/Sheet';
import { tap } from '../lib/haptics';
import { NightIcon } from './icons';
import { SOUNDS, soundscape, type SoundId } from './sounds';

const MINUTES = [15, 30, 60];

export function useSoundscape() {
  const current = useSyncExternalStore(
    (f) => soundscape.subscribe(f),
    () => soundscape.current,
  );
  const [left, setLeft] = useState(soundscape.left());
  useEffect(() => {
    setLeft(soundscape.left());
    if (!current) return;
    const id = window.setInterval(() => setLeft(soundscape.left()), 5000);
    return () => window.clearInterval(id);
  }, [current]);
  return { current, left };
}

/** Five sleep sounds as five round "stones". One plays at a time, with a timer that fades it out. */
export function SoundSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { current, left } = useSoundscape();
  const [minutes, setMinutes] = useState(30);
  const reduce = useReducedMotion();

  const play = (id: SoundId) => {
    tap(10);
    if (current === id) soundscape.stop(true);
    else {
      soundscape.play(id, minutes);
      quest('sound');
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="צלילים להירדם">
      <div className="flex flex-col gap-4 pb-4">
        <ul className="flex flex-col gap-2">
          {SOUNDS.map((s, i) => {
            const on = current === s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => play(s.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-3.5 rounded-[22px] px-3 py-2.5 text-right transition-all active:scale-[0.98] ${on ? 'bg-[#1E2340] text-white shadow-[0_10px_30px_-10px_rgb(30_35_64/0.7)]' : 'bg-paper shadow-soft'}`}
                  style={{ marginInlineStart: [0, 10, 4, 14, 2][i] }}
                >
                  <span className={`relative flex size-14 shrink-0 items-center justify-center rounded-full ${on ? 'bg-white/10' : 'bg-[#1E2340]'}`}>
                    {on && !reduce && (
                      <motion.span className="absolute inset-0 rounded-full border-2 border-[#F2C27A]/60" animate={{ scale: [1, 1.35], opacity: [0.8, 0] }} transition={{ duration: s.id === 'heart' ? 60 / 58 : 2.4, repeat: Infinity }} />
                    )}
                    <motion.span animate={on && !reduce ? (s.id === 'heart' ? { scale: [1, 1.12, 1, 1.06, 1] } : { y: [0, -2, 0] }) : {}} transition={{ duration: s.id === 'heart' ? 60 / 58 : 2.4, repeat: Infinity }}>
                      <NightIcon name={s.id} size={38} />
                    </motion.span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-lg leading-tight">{s.name}</span>
                    <span className={`block text-sm ${on ? 'text-white/65' : 'text-muted'}`}>{on ? `מתנגן · נגמר בעוד ${left} דק׳` : s.line}</span>
                  </span>
                  {on && (
                    <span className="flex size-9 items-center justify-center rounded-full bg-white/12" aria-hidden>
                      <Square size={13} fill="currentColor" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">טיימר</span>
          <div className="flex flex-1 rounded-full border-[1.5px] border-line p-1" role="radiogroup" aria-label="כמה זמן">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={minutes === m}
                onClick={() => {
                  setMinutes(m);
                  if (current) soundscape.play(current, m);
                }}
                className={`h-9 flex-1 rounded-full text-sm font-bold tabular-nums transition-colors ${minutes === m ? 'bg-ink text-white' : 'text-muted'}`}
              >
                {m} דק׳
              </button>
            ))}
          </div>
        </div>
        <p className="text-center font-hand text-sm text-muted">בסוף הזמן הצליל דועך לאט, בלי להעיר.</p>
      </div>
    </Sheet>
  );
}
