import { quest } from '../lib/quest';
import { PeekFriend } from '../components/Friends';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { dates, datesFinished, unlockedCount, type DateEntry, type Sticker } from '../content/dates';
import { photoById } from '../content/photos';
import type { Photo } from '../content/types';
import { tap } from '../lib/haptics';
import { track } from '../lib/events';
import { Paper } from '../components/Paper';
import { Sheet } from '../components/Sheet';
import { PhotoImg } from '../components/PhotoImg';
import { Lightbox } from '../components/Lightbox';
import { MeetingJournal } from '../components/MeetingJournal';
import { P, p } from '../lib/he';
import { has } from '../client';

/**
 * "הפגישות שלנו": the partner's diary of their dates, as a calendar of hearts
 * and a diary. One date unlocks a day; the admin sees everything.
 */
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const DOW = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const monthOf = (iso: string) => iso.slice(0, 7);
const monthName = (ym: string, short = false) => `${MONTHS[Number(ym.slice(5)) - 1]} ${short ? `'${ym.slice(2, 4)}` : ym.slice(0, 4)}`;
const fmtDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
const label = (d: DateEntry) => (d.n ? `פגישה ${d.n}` : d.era ? d.era.replace('פגישות', 'פגישה') : 'פגישה');
const SEEN = 'idw:datesSeen';

/** Emoji inside the handwriting font get the system emoji font. */
const EMOJI = /((?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\uFE0F|\u200D(?:\p{Extended_Pictographic})|\p{Emoji_Modifier})*)/u;
function Emo({ text }: { text: string }) {
  return (
    <>
      {text.split(EMOJI).map((part, i) =>
        i % 2 ? (
          <span key={i} style={{ fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif" }}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

function useUnlock() {
  const { viewer, clock, launchDay } = useApp();
  const isAdmin = viewer.role === 'admin';
  const count = unlockedCount(clock.dayIndex, launchDay, isAdmin);
  // What the partner has, for the admin's "not open yet" marks.
  const hers = isAdmin ? (viewer.launchDate ? unlockedCount(clock.dayIndex, launchDay, false) : 0) : count;
  const idx = (d: DateEntry) => dates.indexOf(d);
  return {
    isAdmin,
    isOpen: (d: DateEntry) => idx(d) < count,
    hersOpen: (d: DateEntry) => idx(d) < hers,
    isNew: (d: DateEntry) => !isAdmin && idx(d) === count - 1 && !datesFinished(clock.dayIndex, launchDay),
    inDays: (d: DateEntry) => idx(d) - count + 1,
  };
}

export function DatesPage() {
  const u = useUnlock();
  const { showToast } = useApp();
  const [view, setView] = useState<'calendar' | 'diary'>('calendar');
  useEffect(() => quest('dates'), []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const open = dates.filter(u.isOpen);
  const months = useMemo(() => [...new Set(dates.filter((d) => d.date).map((d) => monthOf(d.date!)))], []);
  const lastOpenMonth = [...open].reverse().find((d) => d.date)?.date;
  const [month, setMonth] = useState(lastOpenMonth ? monthOf(lastOpenMonth) : months[0]);
  // Once we know who is looking (the admin sees everything), start at the newest month.
  useEffect(() => {
    if (lastOpenMonth) setMonth(monthOf(lastOpenMonth));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [u.isAdmin]);

  const openEntry = (d: DateEntry) => {
    tap(10);
    if (!u.isOpen(d)) {
      const n = u.inDays(d);
      return showToast(n === 1 ? 'הפגישה הזאת נפתחת מחר 🔒' : `הפגישה הזאת נפתחת בעוד ${n} ימים 🔒`);
    }
    setOpenId(d.id);
    if (!u.isAdmin) {
      try {
        const seen: string[] = JSON.parse(localStorage.getItem(SEEN) ?? '[]');
        if (!seen.includes(d.id)) {
          localStorage.setItem(SEEN, JSON.stringify([...seen, d.id]));
          track('letter_opened', { title: `פגישה: ${d.title}` });
        }
      } catch {
        /* fine */
      }
    }
  };
  const current = dates.find((d) => d.id === openId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <PeekFriend id="goat" side="right" size={124} bottom={220} />
      <header>
        <h1 className="font-serif text-[30px] font-medium">הפגישות שלנו</h1>
        <p className="font-hand text-[15px] text-muted">
          היומן ש{P} {p('כתב', 'כתבה')} ❤️ {u.isAdmin ? `· ${dates.length} פגישות` : `· ${open.length} מתוך ${dates.length} נפתחו`}
        </p>
        {!u.isAdmin && open.length < dates.length && <p className="mt-1 text-sm text-muted">כל יום נפתחת עוד פגישה. 🔓</p>}
      </header>

      {has('journal') && <MeetingJournal />}

      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-full bg-paper p-1 shadow-soft">
        {(
          [
            ['calendar', '🗓️ לוח לבבות'],
            ['diary', '📖 כל היומן'],
          ] as const
        ).map(([id, text]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`h-10 rounded-full text-[15px] transition-colors ${view === id ? 'bg-accent font-bold text-white' : ''}`}
          >
            {text}
          </button>
        ))}
      </div>

      {view === 'calendar' ? (
        <>
          <MonthNav months={months} month={month} setMonth={setMonth} />
          <Calendar month={month} u={u} onPick={openEntry} />
          <ul className="flex flex-col gap-3">
            {dates
              .filter((d) => d.date && monthOf(d.date) === month)
              .map((d, i) => (
                <li key={d.id}>
                  <DateCard d={d} u={u} i={i} onOpen={openEntry} />
                </li>
              ))}
          </ul>
          {dates.some((d) => !d.date && u.isOpen(d)) && (
            <button type="button" onClick={() => setView('diary')} className="text-sm font-bold text-accent">
              ועוד פגישות בלי תאריך ביומן ←
            </button>
          )}
        </>
      ) : (
        <Diary u={u} onOpen={openEntry} />
      )}

      <DateSheet d={current} u={u} onClose={() => setOpenId(null)} onGo={openEntry} onPhoto={setLightbox} />
      <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

type U = ReturnType<typeof useUnlock>;

function MonthNav({ months, month, setMonth }: { months: string[]; month: string; setMonth: (m: string) => void }) {
  const i = months.indexOf(month);
  useEffect(() => {
    document.getElementById(`m-${month}`)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [month]);
  const btn = 'flex size-11 items-center justify-center rounded-full bg-paper shadow-soft disabled:opacity-30';
  return (
    <div>
      <div className="flex items-center justify-between">
        <button type="button" aria-label="החודש הקודם" disabled={i <= 0} onClick={() => setMonth(months[i - 1])} className={btn}>
          <ChevronRight size={22} />
        </button>
        <h2 className="font-serif text-2xl text-accent">{monthName(month)}</h2>
        <button type="button" aria-label="החודש הבא" disabled={i >= months.length - 1} onClick={() => setMonth(months[i + 1])} className={btn}>
          <ChevronLeft size={22} />
        </button>
      </div>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {months.map((m) => (
          <button
            key={m}
            id={`m-${m}`}
            type="button"
            onClick={() => setMonth(m)}
            className={`h-9 shrink-0 rounded-full border-[1.5px] px-3 text-sm ${m === month ? 'border-accent bg-soft font-bold' : 'border-line bg-paper'}`}
          >
            {monthName(m, true)} · {dates.filter((d) => d.date && monthOf(d.date) === m).length}♥
          </button>
        ))}
      </div>
    </div>
  );
}

function Calendar({ month, u, onPick }: { month: string; u: U; onPick: (d: DateEntry) => void }) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const byDay = new Map(dates.filter((d) => d.date && monthOf(d.date) === month).map((d) => [Number(d.date!.slice(8)), d]));

  return (
    <div className="grid grid-cols-7 gap-1.5 text-center" role="grid" aria-label={monthName(month)}>
      {DOW.map((d) => (
        <span key={d} className="text-xs font-bold text-muted">{d}</span>
      ))}
      {Array.from({ length: first }, (_, i) => <span key={`e${i}`} />)}
      {Array.from({ length: days }, (_, i) => {
        const day = i + 1;
        const d = byDay.get(day);
        if (!d) return <span key={day} className="flex h-12 items-center justify-center rounded-xl bg-paper/70 text-[13px] text-muted/60">{day}</span>;
        const open = u.isOpen(d);
        return (
          <button
            key={day}
            type="button"
            onClick={() => onPick(d)}
            aria-label={open ? `${day} · ${d.title}` : `${day} · נעול`}
            className={`relative flex h-12 flex-col items-center justify-center rounded-xl leading-none transition-transform active:scale-95 ${
              open ? 'bg-accent text-white shadow-soft' : 'border-[1.5px] border-dashed border-accent/40 bg-soft'
            } ${u.isNew(d) ? 'outline-2 outline-offset-2 outline-accent' : ''}`}
          >
            {open ? (
              <>
                <span className="sticker text-[17px]" style={{ ['--dur' as string]: `${3 + (day % 4) * 0.5}s`, ['--tilt' as string]: `${day % 2 ? 6 : -6}deg` }} aria-hidden>
                  {d.icon}
                </span>
                <span className="mt-0.5 text-[10px] font-bold">♥ {day}</span>
              </>
            ) : (
              <>
                <Lock size={14} className="text-accent" aria-hidden />
                <span className="mt-0.5 text-[10px] text-accent">{day}</span>
              </>
            )}
            {u.isAdmin && !u.hersOpen(d) && <span aria-hidden className="absolute top-1 left-1 size-1.5 rounded-full bg-butter" />}
          </button>
        );
      })}
    </div>
  );
}

function DateCard({ d, u, i, onOpen }: { d: DateEntry; u: U; i: number; onOpen: (d: DateEntry) => void }) {
  const open = u.isOpen(d);
  if (!open)
    return (
      <button type="button" onClick={() => onOpen(d)} className="flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-accent/40 px-4 py-3.5 text-right">
        <Lock size={18} className="shrink-0 text-accent" />
        <span className="text-[15px] text-muted">
          {d.date ? `${new Date(`${d.date}T12:00:00Z`).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })} · ` : ''}
          פגישה נעולה · {u.inDays(d) === 1 ? 'נפתחת מחר' : `נפתחת בעוד ${u.inDays(d)} ימים`}
        </span>
      </button>
    );
  return (
    <button type="button" onClick={() => onOpen(d)} className="block w-full text-right">
      <Paper tape={i === 0} tilt={i % 2 ? 'rotate-[0.5deg]' : '-rotate-[0.5deg]'} className="px-4 pt-4 pb-3.5">
        <div className="flex items-start gap-3">
          <span className="sticker flex size-12 shrink-0 items-center justify-center rounded-2xl bg-soft text-2xl" style={{ ['--tilt' as string]: '5deg' }} aria-hidden>
            {d.icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white">{label(d)}</span>
              {u.isNew(d) && <span className="rounded-full bg-butter px-2 py-0.5 text-xs font-bold">חדש היום</span>}
              {u.isAdmin && !u.hersOpen(d) && <span className="rounded-full bg-line px-2 py-0.5 text-xs">עוד לא נפתח ל{P}</span>}
            </div>
            <h3 className="mt-1 font-serif text-xl leading-tight">{d.title}</h3>
            <p className="text-xs text-muted">{d.date ? fmtDate(d.date) : 'התאריך עוד יתווסף'}</p>
            <p className="mt-1.5 line-clamp-2 font-hand text-[14px]"><Emo text={d.text} /></p>
            <p className="mt-1 text-xs tracking-wide" aria-hidden>{d.stickers.map((s) => s.e).join(' ')}</p>
          </div>
        </div>
      </Paper>
    </button>
  );
}

function Diary({ u, onOpen }: { u: U; onOpen: (d: DateEntry) => void }) {
  const firstLocked = dates.findIndex((d) => !u.isOpen(d));
  const shown = firstLocked === -1 ? dates : dates.slice(0, firstLocked + 1);
  let era = 'הפגישות הראשונות';
  return (
    <ol className="flex flex-col gap-3">
      {shown.map((d, i) => {
        const header = i === 0 || d.era ? (d.era ?? era) : null;
        if (d.era) era = d.era;
        return (
          <li key={d.id}>
            {header && <p className="mt-3 mb-2 font-serif text-lg text-accent">{header}</p>}
            {!d.date || i === 0 || monthOf(d.date) !== monthOf(shown[i - 1].date ?? '') ? (
              <p className="mb-1.5 text-xs font-bold tracking-[2px] text-muted">{d.date ? monthName(monthOf(d.date)) : 'בלי תאריך'}</p>
            ) : null}
            <DateCard d={d} u={u} i={i} onOpen={onOpen} />
          </li>
        );
      })}
    </ol>
  );
}

const SPOTS = [
  { top: '8%', right: '6%' },
  { top: '48%', right: '22%' },
  { top: '14%', left: '8%' },
  { top: '55%', left: '26%' },
  { top: '10%', right: '44%' },
];

function StickerStage({ d }: { d: DateEntry }) {
  const { showToast } = useApp();
  const [popped, setPopped] = useState<number | null>(null);
  const say = (s: Sticker, i: number) => {
    tap(8);
    setPopped(i);
    showToast(s.say);
    window.setTimeout(() => setPopped(null), 460);
  };
  return (
    <div className="relative h-32 overflow-hidden rounded-3xl bg-soft/70" aria-label="מדבקות, אפשר ללחוץ">
      <span aria-hidden className="absolute inset-0 flex items-center justify-center text-[56px] opacity-90">
        <span className="sticker" style={{ ['--dur' as string]: '5s' }}>{d.icon}</span>
      </span>
      {d.stickers.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => say(s, i)}
          aria-label={s.say}
          className="absolute flex size-12 items-center justify-center rounded-full bg-paper text-2xl shadow-soft"
          style={SPOTS[i % SPOTS.length]}
        >
          <span
            className={`sticker ${popped === i ? 'sticker-pop' : ''}`}
            style={{ ['--dur' as string]: `${3.2 + i * 0.7}s`, ['--delay' as string]: `${i * -0.9}s`, ['--tilt' as string]: `${i % 2 ? 8 : -8}deg` }}
          >
            {s.e}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Her words, laid out: " + " moments one per line; long stories by paragraph. */
function Words({ text }: { text: string }) {
  const paras = text.split('\n').filter((p) => p.trim());
  if (paras.length === 1 && text.includes('+')) {
    return (
      <ul className="flex flex-col gap-2">
        {text
          .split('+')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s, i) => (
            <li key={i} className="flex gap-2 font-hand text-[17px] leading-relaxed">
              <span aria-hidden className="text-accent">♥</span>
              <span><Emo text={s} /></span>
            </li>
          ))}
      </ul>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {paras.map((p, i) => (
        <p key={i} className="font-hand text-[17px] leading-[1.9]"><Emo text={p.trim()} /></p>
      ))}
    </div>
  );
}

function DateSheet({ d, u, onClose, onGo, onPhoto }: { d: DateEntry | null; u: U; onClose: () => void; onGo: (d: DateEntry) => void; onPhoto: (p: Photo) => void }) {
  const i = d ? dates.indexOf(d) : -1;
  const prev = i > 0 ? dates[i - 1] : null;
  const next = i >= 0 && i < dates.length - 1 && u.isOpen(dates[i + 1]) ? dates[i + 1] : null;
  const photos = (d?.photoIds ?? []).map(photoById).filter((x): x is Photo => !!x);
  return (
    <Sheet open={!!d} onClose={onClose} title={d ? `${label(d)} · ${d.title}` : ''}>
      {d && (
        <div key={d.id} className="flex flex-col gap-4 pb-6">
          <StickerStage d={d} />
          <p className="-mt-2 text-center text-xs text-muted">אפשר ללחוץ על המדבקות 👆</p>
          <p className="text-sm font-bold text-accent">{d.date ? fmtDate(d.date) : 'התאריך עוד יתווסף'}</p>
          <Paper tape tilt="" className="px-5 pt-6 pb-5">
            <Words text={d.text} />
            <p className="mt-4 text-left font-hand text-sm text-muted">— {P}</p>
          </Paper>
          {photos.length > 0 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {photos.map((p) => (
                <button key={p.id} type="button" onClick={() => onPhoto(p)} className="shrink-0">
                  <PhotoImg photo={p} sizes="140px" className="w-36 rounded-xl shadow-paper" />
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={!prev} onClick={() => prev && onGo(prev)} className="flex h-12 items-center justify-center gap-1 rounded-xl bg-paper font-bold shadow-soft disabled:opacity-30">
              <ChevronRight size={18} /> הקודמת
            </button>
            <button type="button" disabled={!next} onClick={() => next && onGo(next)} className="flex h-12 items-center justify-center gap-1 rounded-xl bg-paper font-bold shadow-soft disabled:opacity-30">
              {next || u.isAdmin || i === dates.length - 1 ? 'הבאה' : 'הבאה מחר 🔒'} <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
