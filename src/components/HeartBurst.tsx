import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Heart } from 'lucide-react';

const EVENT = 'idw:heart';

/** One elegant heart, only for meaningful moments. */
export const burstHeart = () => window.dispatchEvent(new Event(EVENT));

export function HeartBurst() {
  const [n, setN] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    const on = () => setN((x) => x + 1);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  useEffect(() => {
    if (!n) return;
    const id = window.setTimeout(() => setN(0), 1400);
    return () => window.clearTimeout(id);
  }, [n]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <AnimatePresence>
        {n > 0 && (
          <motion.div
            key={n}
            initial={{ scale: reduce ? 1 : 0.4, opacity: 0 }}
            animate={{ scale: reduce ? 1 : [0.4, 1.15, 1], opacity: [0, 1, 1] }}
            exit={{ opacity: 0, scale: reduce ? 1 : 1.25, filter: 'blur(6px)' }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="text-accent drop-shadow-[0_10px_30px_rgb(194_56_90/0.35)]"
          >
            <Heart size={120} fill="currentColor" strokeWidth={0} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
