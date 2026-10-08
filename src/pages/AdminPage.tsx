import { useState } from 'react';
import { Navigate } from 'react-router';
import { Bell, CalendarDays, Eye, LogOut } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { notesFor } from '../lib/notes';
import { photosFor } from '../lib/photoOfDay';
import { getClock } from '../lib/time';
import { getWeekendMode } from '../lib/weekend';
import { weekendCopy } from '../content/daily';
import { PhotoImg } from '../components/PhotoImg';
import { Paper, SectionTitle } from '../components/Paper';
import { DayEditor } from '../components/DayEditor';
import { MeetingEditor } from '../components/MeetingEditor';
import { SkinPicker } from '../components/SkinPicker';
import { StartStatus } from '../components/StartStatus';
import { StorageCard } from '../components/StorageCard';
import { ProjectBackup } from '../components/ProjectBackup';
import { A, P, a, p } from '../lib/he';
import { has } from '../client';
import { adminNotes } from '../content/notes';

const CHANNELS = [
  { id: 'whatsapp', label: 'וואטסאפ' },
  { id: 'email', label: 'מייל' },
  { id: 'push', label: 'התראת טלפון (ntfy)' },
];

/**
 * The admin's corner: what the partner gets today, what opens next,
 * and where notifications go. Editing content from here is the next step
 * (needs a small database so changes survive without touching code).
 */
export function AdminPage() {
  const { viewer, clock, launchDay } = useApp();
  const [at, setAt] = useState(`${clock.contentDate}T12:00`);
  if (viewer.role === 'partner') return <Navigate to="/" replace />;

  const upcoming = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.parse(`${clock.contentDate}T12:00:00Z`) + i * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    const c = { ...getClock(), date: iso, contentDate: iso, dayIndex: clock.dayIndex + i, weekday: d.getUTCDay(), hour: 12, minute: 0 };
    return {
      iso,
      weekday: d.getUTCDay(),
      notes: has('letters') && adminNotes.length ? notesFor(c.dayIndex, launchDay) : null,
      photo: has('gallery') ? photosFor(c.dayIndex, launchDay) : null,
      weekend: d.getUTCDay() === 6 ? getWeekendMode(c) : null,
    };
  });
  const today = upcoming[0];
  const fmt = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-[30px] font-medium">שלום {A}</h1>
          <p className="text-[15px] text-muted">רק {a('אתה רואה', 'את רואה')} את העמוד הזה. הכניסות שלך לא שולחות התראות.</p>
        </div>
        <form method="post" action="/api/logout">
          <button type="submit" aria-label="יציאה" className="flex size-11 items-center justify-center rounded-full text-muted hover:bg-line/60">
            <LogOut size={20} />
          </button>
        </form>
      </header>

      <StartStatus />

      <DayEditor />

      {has('countdown') && <MeetingEditor />}

      <SkinPicker />

      <StorageCard />

      <ProjectBackup />

      <section>
        <SectionTitle>
          <span className="flex items-center gap-2"><Bell size={18} className="text-accent" /> התראות כש{P} {p('נכנס', 'נכנסת')}</span>
        </SectionTitle>
        <ul className="flex flex-col gap-2">
          {CHANNELS.map((ch) => {
            const on = viewer.notify?.[ch.id];
            return (
              <li key={ch.id} className="flex items-center justify-between rounded-xl bg-paper px-4 py-3 shadow-soft">
                <span>{ch.label}</span>
                <span className={`text-sm font-bold ${on ? 'text-accent' : 'text-muted'}`}>{on ? 'פעיל' : 'לא מוגדר'}</span>
              </li>
            );
          })}
        </ul>
        {viewer.role === null && <p className="mt-2 text-sm text-muted">(בתצוגה המקדימה אין שרת, אז אין התראות.)</p>}
      </section>

      <section>
        <SectionTitle>
          <span className="flex items-center gap-2"><Eye size={18} className="text-accent" /> מה {P} רואה</span>
        </SectionTitle>
        <Paper tape={false} tilt="" className="flex flex-col gap-3 p-4">
          {(today.notes || today.photo) && (
            <p className="text-sm text-muted">
              היום: {[today.notes && today.notes.today.map((n) => `„${n.title}“`).join(' + '), today.photo && `תמונה: ${today.photo.today.alt}`].filter(Boolean).join(' · ')}
            </p>
          )}
          <label htmlFor="at" className="text-sm font-bold">לראות את האתר בתאריך ושעה אחרים</label>
          <div className="flex gap-2">
            <input id="at" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="h-12 min-w-0 flex-1 rounded-xl border-[1.5px] border-line bg-bg px-3" />
            <a href={import.meta.env.VITE_PREVIEW ? `?at=${at}#/` : `/?at=${at}`} className="flex h-12 items-center rounded-xl bg-accent px-4 font-bold text-white no-underline">הצג</a>
          </div>
        </Paper>
      </section>

      {(today.notes || today.photo) && (
      <section>
        <SectionTitle aside={<span className="text-sm text-muted">{[today.notes && `עוד ${today.notes.remaining} פתקים`, today.photo && `${today.photo.remaining} תמונות`].filter(Boolean).join(' · ')}</span>}>
          <span className="flex items-center gap-2"><CalendarDays size={18} className="text-accent" /> השבועיים הקרובים</span>
        </SectionTitle>
        <ol className="flex flex-col gap-2.5">
          {upcoming.map((u) => (
            <li key={u.iso} className="flex gap-3 rounded-2xl bg-paper p-3 shadow-soft">
              {u.photo && <PhotoImg photo={u.photo.today} sizes="64px" className="w-16 shrink-0 self-start rounded-lg" />}
              <div className="min-w-0">
                <p className="text-xs font-bold text-accent">{fmt(u.iso)}</p>
                {u.notes && (
                  <p className="text-[15px] leading-snug">
                    {u.notes.rerun ? 'חוזר: ' : ''}
                    {u.notes.today.map((n) => n.title).join(' + ')}
                  </p>
                )}
                {u.photo?.rerun && <p className="text-xs text-muted">התמונות נגמרו, חוזרת תמונה ישנה</p>}
                {u.weekend && <p className="mt-1 text-xs text-muted">{weekendCopy[u.weekend].title}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>
      )}
    </div>
  );
}
