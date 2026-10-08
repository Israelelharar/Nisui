import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEgg } from '../hooks/useApp';
import { client } from '../client';
import { a, p } from '../lib/he';

const LINES = [
  'זה אנחנו 🥹',
  `${p('אתה מחייך', 'את מחייכת')} ככה, ואני ${a('נמס', 'נמסה')}. כל פעם.`,
  `${p('תסתכל', 'תסתכלי')} כמה אנחנו מתאימים.`,
  'המקום הכי טוב בעולם: לידך.',
];

/**
 * A drawing of the two of them (client.usDrawing, optional), breathing softly
 * at the top of the home page. Tap for a line and a few hearts.
 */
export function UsDrawing() {
  const reduce = useReducedMotion();
  const say = useEgg(client.content.easterEggs?.usDrawing?.lines ?? LINES);
  const [pops, setPops] = useState<number[]>([]);

  if (!client.usDrawing) return null;
  const drawing = client.usDrawing;
  const tap = () => {
    say();
    if (reduce) return;
    const id = Date.now();
    setPops((p) => [...p.slice(-4), id]);
    window.setTimeout(() => setPops((p) => p.filter((x) => x !== id)), 1600);
  };

  return (
    <div className="relative -mx-2 -mb-3 flex justify-center">
      <div aria-hidden className="absolute inset-x-10 top-6 bottom-4 rounded-full bg-accent/10 blur-2xl" />
      <div className="relative w-[64%] max-w-[270px]">
      <motion.button
        type="button"
        onClick={tap}
        aria-label="הציור שלנו"
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileTap={reduce ? undefined : { scale: 0.97, rotate: -1 }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative w-full"
      >
        <img src={drawing} alt="" className={`h-auto w-full select-none ${reduce ? '' : 'animate-breathe'}`} draggable={false} />
        <AnimatePresence>
          {pops.map((id, i) => (
            <motion.span
              key={id}
              aria-hidden
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 0], y: -90, scale: 1.1, x: (i % 2 ? 1 : -1) * (14 + (id % 20)) }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="pointer-events-none absolute top-[38%] left-1/2 text-2xl text-accent"
            >
              ♥
            </motion.span>
          ))}
        </AnimatePresence>
      </motion.button>
      </div>
    </div>
  );
}
