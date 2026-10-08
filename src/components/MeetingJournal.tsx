import { useEffect, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { BookOpen, Copy, PenLine } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { book } from '../content/book';
import { tap } from '../lib/haptics';
import { tada } from '../pet/sound';
import { Sheet } from './Sheet';
import { SectionTitle } from './Paper';
import { A, P, a, p } from '../lib/he';
import { has } from '../client';

/**
 * "היומן ממשיך": the dates diary, continued here. After they meet the
 * partner writes it down; it reaches the admin in full (api/_lib/journal.ts) and
 * Claude later turns it into a chapter of the book.
 */
export interface JournalEntry {
  id: string;
  date: string;
  place?: string;
  text: string;
  writtenAt: string;
  editedAt?: string;
}

let entries: JournalEntry[] | null = null;
let loading = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function load() {
  if (loading) return;
  loading = true;
  fetch('/api/event?journal')
    .then((r) => (r.ok ? r.json() : { entries: [] }))
    .then((d: { entries?: JournalEntry[] }) => (entries = d.entries ?? []))
    .catch(() => (entries = entries ?? []))
    .finally(() => {
      loading = false;
      emit();
    });
}
export function useJournal() {
  const list = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      if (!entries) load();
      return () => listeners.delete(l);
    },
    () => entries,
  );
  return { entries: list, set: (next: JournalEntry[]) => ((entries = next), emit()) };
}

const chapterOf = (e: JournalEntry) => book.find((c) => c.journalId === e.id);
const heDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
const dayOf = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);
const DRAFT = 'idw:journalDraft';

/** Ruled notebook paper, with the red margin line on the right (Hebrew side). */
const RULED = {
  backgroundImage:
    'linear-gradient(to left, transparent 30px, rgb(226 90 122 / 0.35) 30px, rgb(226 90 122 / 0.35) 31.5px, transparent 31.5px), repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgb(120 150 200 / 0.22) 31px, rgb(120 150 200 / 0.22) 32px)',
  backgroundColor: '#fffdf6',
  color: '#3a2a2e',
  colorScheme: 'light',
} as const;

/** The section on the dates page: the pen, and what was written so far. */
export function MeetingJournal() {
  const { viewer, showToast } = useApp();
  const isAdmin = viewer.role === 'admin';
  const { entries } = useJournal();
  const [writing, setWriting] = useState<JournalEntry | 'new' | null>(null);
  const list = [...(entries ?? [])].reverse();

  const copyForClaude = async () => {
    tap(8);
    const waiting = (entries ?? []).filter((e) => !chapterOf(e));
    const text = [
      `Claude, אלה הפגישות ש${P} ${p('כתב', 'כתבה')} באתר ועוד לא נהיו פרק בספר. תכתוב מכל אחת פרק (בתוכן הלקוח: book, עם journalId), ותוסיף אותה גם ל־dates:`,
      '',
      ...waiting.map((e) => `--- [${e.id}] ${e.date}${e.place ? ` · ${e.place}` : ''}\n${e.text}\n`),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast(waiting.length ? `הועתקו ${waiting.length} פגישות. להדביק לי בשיחה 📋` : 'אין פגישות שמחכות לפרק');
    } catch {
      showToast('לא הצלחתי להעתיק');
    }
  };

  return (
    <section>
      <SectionTitle
        aside={
          isAdmin && list.length > 0 ? (
            <button type="button" onClick={copyForClaude} className="flex min-h-9 items-center gap-1.5 rounded-full bg-sky px-3 text-[13px] font-bold text-blue">
              <Copy size={14} aria-hidden /> להעתיק ל־Claude
            </button>
          ) : undefined
        }
      >
        היומן ממשיך
      </SectionTitle>

      {!isAdmin && (
        <button
          type="button"
          onClick={() => (tap(8), setWriting('new'))}
          className="group relative block w-full -rotate-[0.4deg] overflow-hidden rounded-[6px_14px_14px_6px] pt-4 pr-11 pb-5 pl-5 text-right shadow-paper transition-transform active:scale-[0.985]"
          style={RULED}
        >
          <span className="flex items-center gap-2 font-serif text-[21px] leading-8">
            <PenLine size={19} className="text-[#c2385a] transition-transform group-active:-rotate-12" aria-hidden />
            נפגשנו? {p('תכתוב', 'תכתבי')} לי
          </span>
          <span className="block font-hand text-[16px] leading-8 opacity-80">כמו ביומן. זה מגיע אליי ישר,</span>
          <span className="block font-hand text-[16px] leading-8 opacity-80">{has('book') ? 'ונהיה פרק בספר שלנו.' : 'ונשמר כאן לתמיד.'}</span>
        </button>
      )}

      {entries === null ? (
        <p className="mt-3 text-sm text-muted">טוען את היומן…</p>
      ) : list.length === 0 ? (
        isAdmin && <p className="rounded-xl bg-paper px-4 py-3 text-[14px] text-muted shadow-soft">כש{P} {p('יכתוב', 'תכתוב')} כאן על פגישה, {a('תקבל', 'תקבלי')} אותה בהודעה, והיא תופיע כאן.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {list.map((e, i) => (
            <li key={e.id}>
              <EntryCard e={e} tilt={i % 2 ? 0.5 : -0.4} onEdit={isAdmin ? undefined : () => setWriting(e)} />
            </li>
          ))}
        </ul>
      )}

      {!isAdmin && <WriteSheet open={writing} onClose={() => setWriting(null)} />}
    </section>
  );
}

function EntryCard({ e, tilt, onEdit }: { e: JournalEntry; tilt: number; onEdit?: () => void }) {
  const [more, setMore] = useState(false);
  const chapter = chapterOf(e);
  const long = e.text.length > 260;
  return (
    <article className="rounded-[6px_14px_14px_6px] pt-3 pr-11 pb-4 pl-5 shadow-paper" style={{ ...RULED, rotate: `${tilt}deg` }}>
      <header className="flex items-baseline justify-between gap-2 leading-8">
        <span className="font-serif text-[17px]">{heDate(e.date)}</span>
        {e.place && <span className="truncate font-hand text-[14px] opacity-70">{e.place}</span>}
      </header>
      <p className={`font-hand text-[17px] leading-8 whitespace-pre-line ${long && !more ? 'line-clamp-4' : ''}`}>{e.text}</p>
      {long && (
        <button type="button" onClick={() => setMore((m) => !m)} className="text-[13px] font-bold text-[#c2385a]">
          {more ? 'פחות' : 'להמשיך לקרוא'}
        </button>
      )}
      <footer className="mt-2 flex items-center justify-between gap-2 text-[12.5px]">
        {chapter ? (
          <Link to={`/book?ch=${chapter.id}`} className="flex items-center gap-1 rounded-full bg-[#7a1f35] px-2.5 py-1 font-bold text-[#f6e7c8] no-underline">
            <BookOpen size={13} aria-hidden /> נהיה פרק: {chapter.title}
          </Link>
        ) : (
          <span className="opacity-60">מחכה להפוך לפרק בספר</span>
        )}
        {onEdit && (
          <button type="button" onClick={onEdit} className="min-h-8 px-1 font-bold opacity-70">
            לערוך
          </button>
        )}
      </footer>
    </article>
  );
}

function WriteSheet({ open, onClose }: { open: JournalEntry | 'new' | null; onClose: () => void }) {
  const { clock, settings, showToast } = useApp();
  const { set } = useJournal();
  const reduce = useReducedMotion();
  const editing = open && open !== 'new' ? open : null;
  // Default to the meeting the admin set, if it was in the last few days; else today.
  const met = settings.nextMeeting?.date;
  const defaultDate = met && clock.dayIndex - dayOf(met) >= 0 && clock.dayIndex - dayOf(met) <= 4 ? met : clock.contentDate;
  const [date, setDate] = useState(defaultDate);
  const [place, setPlace] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSent(false);
    if (editing) {
      setDate(editing.date);
      setPlace(editing.place ?? '');
      setText(editing.text);
      return;
    }
    let d: { date?: string; place?: string; text?: string } = {};
    try {
      d = JSON.parse(localStorage.getItem(DRAFT) ?? '{}');
    } catch {
      /* no draft */
    }
    setDate(d.date ?? defaultDate);
    setPlace(d.place ?? (met === defaultDate ? (settings.nextMeeting?.label ?? '') : ''));
    setText(d.text ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Nothing written is lost if the sheet closes or the phone locks.
  useEffect(() => {
    if (!open || editing) return;
    try {
      localStorage.setItem(DRAFT, JSON.stringify({ date, place, text }));
    } catch {
      /* private mode */
    }
  }, [open, editing, date, place, text]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    tap(12);
    const res = await fetch('/api/event?journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editing?.id, date, place, text, headline: editing ? `✏️ ${P} ${p('עדכן', 'עדכנה')} את מה ש${p('כתב', 'כתבה')} על הפגישה` : `📝 ${P} ${p('כתב', 'כתבה')} על הפגישה שלכם` }),
    }).catch(() => null);
    setSending(false);
    if (!res?.ok) return showToast(res?.status === 503 ? 'אין חיבור לשרת כרגע. מה שכתבת שמור, ננסה אחר כך.' : 'השליחה נכשלה. מה שכתבת שמור, ננסה שוב?');
    const d = (await res.json()) as { entries: JournalEntry[] };
    set(d.entries);
    if (!editing) {
      try {
        localStorage.removeItem(DRAFT);
      } catch {
        /* fine */
      }
    }
    tap(25);
    tada();
    setSent(true);
    window.setTimeout(onClose, 1900);
  };

  return (
    <Sheet open={!!open} onClose={onClose} title={editing ? 'לערוך את מה שכתבת' : 'על הפגישה שלנו'}>
      {sent ? (
        <motion.div initial={reduce ? false : { scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-2 py-10 text-center">
          <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
            <path d="M8 18h48v30H8z" fill="#fffdf6" stroke="#c2385a" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M8 18l24 18 24-18" fill="none" stroke="#c2385a" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M32 44c-5-4-8-6-8-9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 3-3 5-8 9z" fill="#e25a7a" />
          </svg>
          <p className="font-serif text-[24px]">{editing ? 'עודכן' : `נשלח ל${A}`}</p>
          <p className="text-muted">{editing ? `${a('הוא קיבל', 'היא קיבלה')} את הגרסה החדשה.` : has('book') ? 'והפגישה הזאת תהיה פרק בספר שלנו.' : 'ונשמר כאן לתמיד.'}</p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3 pb-4">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
            <label htmlFor="j-date" className="text-sm font-bold">מתי</label>
            <input id="j-date" type="date" value={date} max={clock.contentDate} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl border-[1.5px] border-line bg-bg px-3" />
            <label htmlFor="j-place" className="text-sm font-bold">איפה</label>
            <input id="j-place" value={place} maxLength={80} onChange={(e) => setPlace(e.target.value)} placeholder="למשל: הים, בערב" className="h-11 rounded-xl border-[1.5px] border-line bg-bg px-3" />
          </div>
          <label htmlFor="j-text" className="sr-only">מה היה</label>
          <textarea
            id="j-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={9}
            maxLength={8000}
            placeholder={`מה עשינו, מה הכי צחקנו, מה ${a('הוא אמר', 'היא אמרה')} שאני לא רוצה לשכוח…`}
            className="w-full resize-none rounded-[6px_14px_14px_6px] py-[3px] pr-11 pl-5 font-hand text-[18px] leading-8 outline-none focus-visible:ring-2 focus-visible:ring-accent"
            style={{ ...RULED, backgroundAttachment: 'local' }}
          />
          <button type="button" onClick={send} disabled={!text.trim() || sending} className="h-12 rounded-full bg-accent font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50">
            {sending ? p('שולח…', 'שולחת…') : editing ? 'לשמור את השינוי' : `לשלוח ל${A} ולספר`}
          </button>
          {!editing && <p className="text-center text-[12.5px] text-muted">מה שכתבת נשמר גם אם סוגרים באמצע.</p>}
        </div>
      )}
    </Sheet>
  );
}

/** Home, the evening of a meeting and the days after: "איך היה?" until it's written. */
export function JournalNudge() {
  const { viewer, clock, settings } = useApp();
  const { entries } = useJournal();
  const met = settings.nextMeeting?.date;
  if (!has('journal') || viewer.role !== 'partner' || !met || entries === null) return null;
  const since = clock.dayIndex - dayOf(met);
  const due = (since === 0 && clock.hour >= 17) || (since >= 1 && since <= 3);
  if (!due || entries.some((e) => e.date === met)) return null;
  return (
    <Link to="/dates" className="flex items-center gap-3 rounded-[6px_18px_18px_6px] py-3.5 pr-10 pl-4 no-underline shadow-paper" style={RULED}>
      <PenLine size={22} className="shrink-0 text-[#c2385a]" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-[18px]">{since === 0 ? 'איך היה היום?' : since === 1 ? 'איך היה אתמול?' : 'איך היה בפגישה?'}</span>
        <span className="block font-hand text-[15px] opacity-75">לכתוב ליומן, לפני שהפרטים בורחים</span>
      </span>
      <span aria-hidden className="text-[#c2385a]">←</span>
    </Link>
  );
}
