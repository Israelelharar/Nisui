import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useOpened } from '../hooks/useOpened';
import { notesFor } from '../lib/notes';
import { tap } from '../lib/haptics';
import { burstHeart } from './HeartBurst';
import { KIND_LABEL, NoteSheet } from './NoteSheet';
import type { Note } from '../content/types';
import { p } from '../lib/he';

/** Today's sealed note(s) from the admin. Opening one keeps it in "הפתקים שלי". */
export function TodayNotes() {
  const { clock, day, launchDay } = useApp();
  const base = notesFor(clock.dayIndex, launchDay);
  const rerun = base.rerun;
  // The admin's extra note for today goes first.
  const extra: Note | null = day?.note
    ? { id: `custom-${clock.contentDate}`, kind: 'note', title: day.note.title, body: day.note.body, author: 'admin', writtenOn: clock.contentDate }
    : null;
  const today = extra ? [extra, ...base.today] : base.today;
  const { isOpened, markOpened } = useOpened();
  const [reading, setReading] = useState<Note | null>(null);

  const open = (n: Note) => {
    tap(12);
    if (!isOpened(n.id)) burstHeart();
    markOpened(n.id, n.title, n.id.startsWith('custom-') ? n : undefined);
    setReading(n);
  };

  return (
    <>
      <div className={`grid gap-2.5 ${today.length === 2 ? 'grid-cols-2' : today.length > 2 ? 'grid-cols-3' : ''}`}>
        {today.map((n, i) => {
          const done = isOpened(n.id);
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => open(n)}
              style={{ rotate: `${i % 2 ? 1 : -1}deg` }}
              className="relative flex min-h-[112px] flex-col justify-between overflow-hidden rounded-[16px] bg-env p-4 text-right shadow-paper transition-transform active:scale-[0.98]"
            >
              <svg aria-hidden className="absolute inset-x-0 top-0 h-12 w-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M0 0 L50 26 L100 0" fill="none" stroke="var(--color-env-dark)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              </svg>
              {!done && (
                <span aria-hidden className="absolute top-3 left-1/2 -ml-[18px] flex size-9 items-center justify-center rounded-full bg-accent animate-pulse-seal">
                  <Heart size={16} fill="#FFE7B8" strokeWidth={0} />
                </span>
              )}
              <span className="relative mt-8 font-hand text-xs text-muted">
                {rerun && !n.id.startsWith('custom-') ? `${p('זוכר', 'זוכרת')} את זה?` : done ? `${KIND_LABEL[n.kind]} · נשמר אצלך` : `${KIND_LABEL[n.kind]} חדש`}
              </span>
              <span className="relative font-serif text-[18px] leading-tight">{done || (rerun && !n.id.startsWith('custom-')) ? n.title : 'לפתוח'}</span>
            </button>
          );
        })}
      </div>
      <NoteSheet note={reading} onClose={() => setReading(null)} />
    </>
  );
}
