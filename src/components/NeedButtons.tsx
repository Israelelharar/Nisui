import { Phone, Zap } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { tap } from '../lib/haptics';
import { A, p } from '../lib/he';
import { has } from '../client';

/** The two buttons that must always be one tap away. */
export function NeedButtons() {
  const { openSheet } = useApp();
  if (!has('contact') && !has('strength')) return null;
  return (
    <div className={`grid gap-2.5 ${has('contact') && has('strength') ? 'grid-cols-2' : ''}`}>
      {has('strength') && (
      <button
        type="button"
        onClick={() => {
          tap();
          openSheet('strength');
        }}
        className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-accent whitespace-nowrap px-2 text-[15px] font-bold text-white transition-transform active:scale-[0.97]"
      >
        <Zap size={18} strokeWidth={2} aria-hidden /> אני {p('צריך', 'צריכה')} כוח
      </button>
      )}
      {has('contact') && (
      <button
        type="button"
        onClick={() => {
          tap();
          openSheet('contact');
        }}
        className="flex h-14 items-center justify-center gap-2 rounded-[18px] border-[1.5px] border-accent bg-paper whitespace-nowrap px-2 text-[15px] font-bold transition-transform active:scale-[0.97]"
      >
        <Phone size={18} strokeWidth={2} className="text-accent" aria-hidden /> אני {p('צריך', 'צריכה')} את {A}
      </button>
      )}
    </div>
  );
}
