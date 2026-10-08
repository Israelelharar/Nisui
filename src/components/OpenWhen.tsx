import { useState } from 'react';
import { Lock } from 'lucide-react';
import type { OpenWhen } from '../content/types';
import { photoById } from '../content/photos';
import { Sheet } from './Sheet';
import { PhotoImg } from './PhotoImg';
import { Paper, tintClass } from './Paper';
import { tap } from '../lib/haptics';
import { track } from '../lib/events';
import { A, P, a, p } from '../lib/he';

const isLocked = (c: OpenWhen) => c.locked || (c.unlockAt ? Date.parse(c.unlockAt) > Date.now() : false);

export function OpenWhenCard({ card, onOpen, tilt = 0, wide }: { card: OpenWhen; onOpen: (c: OpenWhen) => void; tilt?: number; wide?: boolean }) {
  const locked = isLocked(card);
  return (
    <button
      type="button"
      onClick={() => {
        tap();
        onOpen(card);
      }}
      style={{ rotate: `${tilt}deg` }}
      className={`${tintClass[card.tint]} flex ${wide ? 'w-full' : 'w-[128px] shrink-0'} h-[112px] flex-col justify-between rounded-[18px] p-3.5 text-right transition-transform active:scale-[0.97]`}
    >
      <span className="flex items-center justify-between font-hand text-xs opacity-80">
        {card.kind}
        <span aria-hidden className="text-base">{locked ? <Lock size={15} /> : card.emoji}</span>
      </span>
      <span className="text-[15px] leading-tight font-bold">{card.label}</span>
    </button>
  );
}

export function OpenWhenSheet({ card, onClose }: { card: OpenWhen | null; onClose: () => void }) {
  const locked = card ? isLocked(card) : false;
  const photo = card?.photoId ? photoById(card.photoId) : undefined;
  return (
    <Sheet open={!!card} onClose={onClose} title={card ? `${p('פתח', 'פתחי')} ${card.label}` : ''}>
      {card &&
        (locked ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-sky text-blue">
              <Lock size={28} />
            </span>
            <p className="font-serif text-xl">עוד לא.</p>
            <p className="max-w-[260px] text-muted">
              {card.unlockAt ? `נפתח ב-${new Date(card.unlockAt).toLocaleDateString('he-IL')}.` : `${A} ${a('יחליט', 'תחליט')} מתי. אבל ${a('הוא כבר כתב', 'היא כבר כתבה')} את זה.`}
            </p>
            <p className="font-hand text-sm text-accent">סבלנות, {P}.</p>
          </div>
        ) : (
          <Paper className="mb-4 p-5 pt-7">
            {photo && <PhotoImg photo={photo} className="mb-4 w-full rounded-xl" />}
            <p className="font-serif text-[19px] leading-relaxed whitespace-pre-line">{card.body}</p>
            <p className="mt-3 font-hand text-sm text-accent">— {A}</p>
          </Paper>
        ))}
    </Sheet>
  );
}

/** Hook-ish helper: state + track when a card is opened. */
export function useOpenWhen() {
  const [card, setCard] = useState<OpenWhen | null>(null);
  return {
    card,
    open: (c: OpenWhen) => {
      setCard(c);
      if (!isLocked(c)) track('letter_opened', { title: `${p('פתח', 'פתחי')} ${c.label}` });
    },
    close: () => setCard(null),
  };
}
