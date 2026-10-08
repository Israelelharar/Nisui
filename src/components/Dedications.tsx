import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '../hooks/useApp';
import { tap } from '../lib/haptics';
import { markSeen, unseenGifts, type Art } from '../pet/arcade/artStore';
import { ceremony } from '../pet/sound';
import { P, p } from '../lib/he';

/**
 * For the admin: a drawing the partner dedicated to them, unveiled once on
 * the next visit. A dimmed stage, slow light, the polaroid dropping in, her words.
 * Each dedication shows exactly once; then it's marked seen on the server.
 */
export function Dedications() {
  const { viewer } = useApp();
  const [queue, setQueue] = useState<Art[]>([]);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (viewer.role !== 'admin') return;
    let alive = true;
    void unseenGifts().then((g) => alive && setQueue(g));
    return () => {
      alive = false;
    };
  }, [viewer.role]);

  const art = queue[0];
  useEffect(() => {
    if (art) window.setTimeout(() => ceremony(), 350);
  }, [art]);

  const [zoom, setZoom] = useState(false);
  const next = () => {
    if (!art) return;
    tap(10);
    setZoom(false);
    void markSeen(art.id);
    setQueue((q) => q.slice(1));
  };

  return (
    <AnimatePresence>
      {art && (
        <motion.div
          key={art.id}
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden bg-[#1C1013]/88 px-6 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          dir="rtl"
        >
          {!reduce && (
            <div
              aria-hidden
              className="dedication-rays pointer-events-none absolute top-1/2 left-1/2 size-[180vmax] -translate-x-1/2 -translate-y-1/2"
              style={{ background: 'repeating-conic-gradient(from 0deg, rgb(255 220 170 / 0.09) 0deg 9deg, transparent 9deg 24deg)' }}
            />
          )}
          <motion.p
            className="relative mb-4 font-hand text-[18px] text-[#FFE3C4]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {P} {p('צייר', 'ציירה')} לך ציור
          </motion.p>
          <motion.div
            className="relative w-full max-w-[300px] rounded-[4px] bg-white p-3 pb-5 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)]"
            initial={reduce ? false : { y: -420, rotate: -14, scale: 0.9 }}
            animate={{ y: 0, rotate: -2, scale: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 13, delay: 0.5 }}
          >
            <span className="absolute -top-2.5 left-1/2 h-6 w-24 -translate-x-1/2 rotate-[3deg] bg-[#F7D9A8]/85" />
            <button type="button" onClick={() => setZoom(true)} aria-label="להגדיל את הציור" className="block w-full">
              <img src={art.src} alt={art.title} className="aspect-[3/4] w-full rounded-[2px] object-cover" />
            </button>
            <div className="mt-1 text-center text-[11px] text-[#B59A84]">נגיעה בציור מגדילה אותו</div>
            <div className="mt-2 text-center font-hand text-[20px] font-bold text-[#3B2216]">{art.title}</div>
            {art.note && <p className="mt-1 text-center font-hand text-[16px] leading-snug text-[#5A3A2A]">״{art.note}״</p>}
            <div className="mt-1 text-center text-[12px] text-[#9A7A62]">באהבה, {P} ❤️</div>
          </motion.div>
          <motion.button
            type="button"
            onClick={next}
            className="relative mt-6 h-12 rounded-full bg-accent px-8 font-bold text-white shadow-[0_14px_30px_-12px_rgb(194_56_90/0.9)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            whileTap={{ scale: 0.96 }}
          >
            {queue.length > 1 ? `תודה ❤️ (עוד ${queue.length - 1})` : `תודה, ${p('אהוב', 'אהובה')} ❤️`}
          </motion.button>
          {/* the drawing on the whole screen; a tap anywhere closes it */}
          <AnimatePresence>
            {zoom && (
              <motion.button
                type="button"
                onClick={() => setZoom(false)}
                aria-label="סגירת התצוגה המוגדלת"
                className="fixed inset-0 z-10 flex items-center justify-center bg-[#1C1013]/96 p-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.img
                  src={art.src}
                  alt={art.title}
                  className="max-h-full max-w-full rounded-[4px] bg-white object-contain shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9)]"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
