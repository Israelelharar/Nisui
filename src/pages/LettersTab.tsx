import { PopFriend, useTripleTap } from '../components/Friends';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { Lock } from 'lucide-react';
import { useApp, useEgg } from '../hooks/useApp';
import { useOpened } from '../hooks/useOpened';
import { notesFor } from '../lib/notes';
import { adminNotes, partnerNotes, togetherNotes } from '../content/notes';
import { easterEggs } from '../content/story';
import type { Note } from '../content/types';
import { Paper, SectionTitle } from '../components/Paper';
import { KIND_LABEL, NoteSheet } from '../components/NoteSheet';
import { TodayNotes } from '../components/TodayNotes';
import { SurpriseSection } from '../components/SurpriseSection';
import { Vouchers } from '../components/Vouchers';
import { A, a, p } from '../lib/he';
import { has } from '../client';

const FILTERS: { id: Note['kind'] | 'all'; label: string }[] = [
  { id: 'all', label: 'הכל' },
  { id: 'letter', label: 'מכתבים' },
  { id: 'song', label: 'שירים' },
  { id: 'note', label: 'פתקים' },
];
const TINTS = ['bg-peach', 'bg-sky', 'bg-butter', 'bg-soft'];

/** "💌 What <admin> wrote me": today's note, the saved notes, and the partner's own words. A tab of "אנחנו" (/us?tab=letters). */
export function LettersTab() {
  const { clock, launchDay } = useApp();
  const hasNotes = has('letters') && adminNotes.length > 0;
  const { released, remaining, today } = hasNotes ? notesFor(clock.dayIndex, launchDay) : { released: [], remaining: 0, today: [] };
  const { isOpened, customNotes } = useOpened();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [reading, setReading] = useState<Note | null>(null);
  const ace = useEgg(easterEggs.ace?.lines ?? ['A ♥']);
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  const mine = [...customNotes, ...released.filter((n) => isOpened(n.id))];
  const shown = filter === 'all' ? mine : mine.filter((n) => n.kind === filter);
  const hers = has('letters') ? [...togetherNotes, ...partnerNotes] : [];
  const knock = useTripleTap();
  const missed = released.filter((n) => !isOpened(n.id) && !today.some((t) => t.id === n.id));

  return (
    <div className="flex flex-col gap-6">
      <header className="relative">
        <PopFriend id="curly" open={knock.open} onClose={knock.close} size={130} className="-top-6 left-0" />
        <h2 onClick={knock.onTap} className="font-serif text-[26px] font-medium">
          מה ש{A} {a('כתב', 'כתבה')} לי
        </h2>
        <p className="mt-1 font-hand text-[15px] text-muted">״כש{p('תרצה', 'תרצי')} להתאהב, תמיד {p('תוכל', 'תוכלי')} להיכנס לפה״</p>
      </header>

      {hasNotes && (
        <section>
          <SectionTitle>הפתק של היום</SectionTitle>
          <TodayNotes />
          {remaining > 0 && <p className="mt-3 text-center text-sm text-muted">עוד {remaining} מחכים לך. כל יום משהו חדש.</p>}
        </section>
      )}

      <SurpriseSection />

      {has('vouchers') && <Vouchers />}

      {hasNotes && (
      <section>
        <SectionTitle aside={<span className="text-sm text-muted">{mine.length}</span>}>הפתקים שלי</SectionTitle>
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`h-9 rounded-full border-[1.5px] px-3.5 text-sm ${filter === f.id ? 'border-accent bg-soft font-bold' : 'border-line bg-paper'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="rounded-2xl border-[1.5px] border-dashed border-line px-4 py-6 text-center text-muted">
            כל פתק ש{p('תפתח', 'תפתחי')} יישמר כאן. לתמיד.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {shown.map((n, i) => (
              <li key={n.id}>
                <button type="button" onClick={() => setReading(n)} className="block w-full text-right">
                  <Paper tape={i === 0} tilt={i % 2 ? 'rotate-[0.6deg]' : '-rotate-[0.6deg]'} className="px-5 pt-5 pb-4">
                    <span className={`${TINTS[i % 4]} rounded-full px-2.5 py-0.5 text-xs font-bold`}>{KIND_LABEL[n.kind]}</span>
                    <h3 className="mt-2 font-serif text-[21px]">{n.title}</h3>
                    <p className="mt-1 line-clamp-2 font-serif text-[15px] text-muted">{n.body}</p>
                  </Paper>
                </button>
              </li>
            ))}
          </ul>
        )}
        {missed.length > 0 && (
          <>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted">
              <Lock size={14} aria-hidden /> מימים קודמים, עוד לא נפתחו:
            </p>
            <ul className="mt-2 flex flex-wrap justify-center gap-2">
              {missed.map((n) => (
                <li key={n.id}>
                  <MissedNote note={n} onOpen={setReading} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      )}

      {hers.length > 0 && (
      <section>
        <SectionTitle>מה ש{p('אתה כתבת', 'את כתבת')} ל{a('ו', 'ה')}</SectionTitle>
        <p className="-mt-1 mb-3 text-sm text-muted">השירים והמכתבים שלך. גם הם שמורים כאן.</p>
        <ul className="grid grid-cols-2 gap-2.5">
          {hers.map((n, i) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => setReading(n)}
                style={{ rotate: `${i % 2 ? 0.8 : -0.8}deg` }}
                className={`${TINTS[(i + 1) % 4]} flex min-h-[92px] w-full flex-col justify-between rounded-[16px] p-3.5 text-right`}
              >
                <span className="font-hand text-xs opacity-80">{n.author === 'both' ? 'שנינו' : KIND_LABEL[n.kind]}</span>
                <span className="text-[15px] leading-tight font-bold">{n.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      )}

      {easterEggs.ace && (
      <button type="button" onClick={ace} aria-label="קלף" className="mx-auto flex h-14 w-10 flex-col items-center justify-center rounded-md border border-line bg-paper font-serif text-accent shadow-soft">
        <span className="text-lg leading-none">A</span>
        <span aria-hidden className="text-sm leading-none">♥</span>
      </button>
      )}

      <NoteSheet note={reading} onClose={() => setReading(null)} />
    </div>
  );
}

function MissedNote({ note, onOpen }: { note: Note; onOpen: (n: Note) => void }) {
  const { markOpened } = useOpened();
  return (
    <button
      type="button"
      onClick={() => {
        markOpened(note.id, note.title);
        onOpen(note);
      }}
      className="flex h-11 items-center gap-2 rounded-full bg-env px-4 text-sm font-semibold"
    >
      <span aria-hidden className="size-2.5 rounded-full bg-accent" />
      {KIND_LABEL[note.kind]} שחיכה לך
    </button>
  );
}
