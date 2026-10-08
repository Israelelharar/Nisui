import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';

/**
 * Bottom sheet dialog. Esc / backdrop close; focus moves in and back out.
 * Rendered into <body> so it sits above the bottom nav from inside any page.
 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => panel.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      returnTo.current?.focus?.();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="relative max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[28px] skin-sheet px-5 pt-3 pb-safe outline-none"
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" aria-hidden />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-[22px] font-medium">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="סגירה"
                className="flex size-11 items-center justify-center rounded-full text-muted hover:bg-line/60"
              >
                <X size={22} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
