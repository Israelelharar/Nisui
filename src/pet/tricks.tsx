import { COIN } from './catalog';
import { Sheet } from '../components/Sheet';
import { tricks } from './catalog';
import type { PetState } from './engine';
import { P, a } from '../lib/he';

/**
 * The tricks book: nine secret gestures. She sees which she found and half a
 * clue for the rest; the admin (looking at the partner's pet) sees every answer.
 */
export function TricksSheet({ open, onClose, pet, mirror }: { open: boolean; onClose: () => void; pet: PetState; mirror: boolean }) {
  const known = pet.tricks ?? [];
  return (
    <Sheet open={open} onClose={onClose} title={`ספר הטריקים · ${known.length}/${tricks.length}`}>
      <div className="flex flex-col gap-3 pb-6">
        <p className="-mt-2 text-[15px] leading-relaxed text-muted">
          ל{pet.name} יש תשעה טריקים סודיים. כל אחד נפתח מנגיעה אחרת בו: איפה נוגעים, כמה פעמים, ולאיזה כיוון. כל טריק חדש שווה 15 {COIN}, ושלושה טריקים שונים תוך 10 שניות הם קומבו.
        </p>
        {mirror && <p className="rounded-xl bg-ink px-3 py-1.5 text-[12.5px] font-bold text-white">👀 רק {a('אתה רואה', 'את רואה')} את התשובות. אצל {P} יש חצי רמז.</p>}
        <ul className="grid grid-cols-1 gap-2">
          {tricks.map((t, i) => {
            const got = known.includes(t.id);
            const times = pet.counters[`trick:${t.id}`] ?? 0;
            return (
              <li key={t.id} className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 ${got ? 'bg-butter' : 'bg-paper shadow-soft'}`}>
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full font-serif text-[18px] font-bold ${got ? 'bg-accent text-white' : 'bg-soft text-muted'}`}
                  aria-hidden
                >
                  {got ? '✓' : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{got || mirror ? t.name : '???'}</span>
                  <span className="block text-[13px] leading-snug text-muted">{mirror ? t.how : got ? `עשה את זה ${times} פעמים` : t.half}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}
