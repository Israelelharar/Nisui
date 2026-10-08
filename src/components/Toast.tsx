import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../hooks/useApp';

// The toast floats just above the bottom nav, so it never covers a page heading.
// Each toast is absolutely positioned on its own, so while one fades out the next
// one appears in exactly the same centered spot instead of beside it.
// Long lines wrap inside the bubble.
export function Toast() {
  const { toast } = useApp();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 z-50 mx-auto h-0 max-w-[480px]" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 96px)' }}>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97, transition: { duration: 0.16 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 32 }}
            className="absolute inset-x-4 bottom-0 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-2xl bg-ink px-4 py-2.5 text-center font-hand text-[15px] leading-snug text-balance text-white shadow-paper"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
