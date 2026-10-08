import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import type { DayOverride } from '../content/types';
import { Paper, SectionTitle } from './Paper';
import { A, P, a, p } from '../lib/he';
import { client } from '../client';
import { weekendCopy } from '../content/daily';

const EMPTY = { greeting: '', specialTitle: '', specialBody: '', line: '', noteTitle: '', noteBody: '', weekend: '' };
type Form = typeof EMPTY;

const toForm = (o: DayOverride | null): Form => ({
  greeting: o?.greeting ?? '',
  specialTitle: o?.special?.title ?? '',
  specialBody: o?.special?.body ?? '',
  line: o?.line ?? '',
  noteTitle: o?.note?.title ?? '',
  noteBody: o?.note?.body ?? '',
  weekend: o?.weekend ?? '',
});
const toOverride = (f: Form): DayOverride => ({
  greeting: f.greeting || undefined,
  special: f.specialBody ? { title: f.specialTitle || undefined, body: f.specialBody } : undefined,
  line: f.line || undefined,
  note: f.noteBody ? { title: f.noteTitle || 'פתק מיוחד', body: f.noteBody } : undefined,
  weekend: (f.weekend || undefined) as DayOverride['weekend'],
});

const fmt = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });

/**
 * The admin edits one day. Everything here applies to that day only; at 05:00
 * the next morning the site is back to its regular rotation by itself.
 */
export function DayEditor() {
  const { clock, viewer } = useApp();
  const [date, setDate] = useState(clock.contentDate);
  const [form, setForm] = useState<Form>(EMPTY);
  const [days, setDays] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const ready = viewer.role === 'admin' && viewer.store;

  const refreshDays = () =>
    fetch('/api/days')
      .then((r) => (r.ok ? r.json() : { days: [] }))
      .then((d) => setDays(d.days ?? []))
      .catch(() => {});

  useEffect(() => {
    if (!ready) return;
    setStatus('');
    fetch(`/api/day?date=${date}`)
      .then((r) => r.json())
      .then((d) => setForm(toForm(d.override)))
      .catch(() => setStatus('לא הצלחתי לטעון את היום הזה.'));
  }, [date, ready]);
  useEffect(() => {
    if (ready) refreshDays();
  }, [ready]);

  const save = async (override: DayOverride) => {
    setStatus(a('שומר…', 'שומרת…'));
    const res = await fetch('/api/day', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, override }) }).catch(() => null);
    if (!res?.ok) return setStatus(`השמירה נכשלה. ${a('נסה', 'נסי')} שוב.`);
    const d = await res.json();
    setForm(toForm(d.override));
    setStatus(d.override ? `נשמר ל-${fmt(date)}. ${P} ${p('יראה', 'תראה')} את זה מ-05:00 באותו יום.` : `היום ${fmt(date)} חזר לשגרה.`);
    refreshDays();
  };

  const field = (key: keyof Form) => ({
    id: `day-${key}`,
    value: form[key],
    disabled: !ready,
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });
  const input = 'h-12 w-full rounded-xl border-[1.5px] border-line bg-bg px-3 disabled:opacity-60';
  const area = 'w-full rounded-xl border-[1.5px] border-line bg-bg px-3 py-2.5 leading-relaxed disabled:opacity-60';
  const label = 'mb-1 block text-sm font-bold';

  return (
    <section>
      <SectionTitle>
        <span className="flex items-center gap-2"><Pencil size={18} className="text-accent" /> לערוך יום</span>
      </SectionTitle>
      {!ready && (
        <p className="mb-3 rounded-xl bg-butter px-4 py-3 text-sm">
          {viewer.role === 'admin'
            ? 'כדי לשמור עריכות צריך לחבר מסד נתונים (Upstash) ב-Vercel. ההוראות ב-docs/NEW-CLIENT.md.'
            : 'העריכה עובדת באתר האמיתי, אחרי כניסה עם הסיסמה שלך.'}
        </p>
      )}
      <Paper tape={false} tilt="" className="flex flex-col gap-4 p-4">
        <div>
          <label htmlFor="day-date" className={label}>איזה יום</label>
          <input id="day-date" type="date" value={date} min={clock.contentDate} onChange={(e) => e.target.value && setDate(e.target.value)} className={input} />
          {days.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {days.map((d) => (
                <button key={d} type="button" onClick={() => setDate(d)} className={`h-8 rounded-full px-3 text-xs ${d === date ? 'bg-accent text-white' : 'bg-soft'}`}>
                  {fmt(d)} ✎
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="day-specialBody" className={label}>💌 הודעה מיוחדת (נפתחת בלחיצה, בראש המסך)</label>
          <input {...field('specialTitle')} placeholder="כותרת (לא חובה)" className={`${input} mb-2`} aria-label="כותרת ההודעה המיוחדת" />
          <textarea {...field('specialBody')} rows={4} placeholder={`מה ${a('תרצה', 'תרצי')} להגיד ל${P} היום?`} className={area} />
        </div>

        <div>
          <label htmlFor="day-noteBody" className={label}>📝 פתק נוסף ליום הזה (נשמר אצל {P} ב״הפתקים שלי״)</label>
          <input {...field('noteTitle')} placeholder="כותרת הפתק" className={`${input} mb-2`} aria-label="כותרת הפתק" />
          <textarea {...field('noteBody')} rows={4} placeholder="הפתק עצמו" className={area} />
        </div>

        <div>
          <label htmlFor="day-greeting" className={label}>👋 ברכה במקום הרגילה</label>
          <input {...field('greeting')} placeholder="למשל: בוקר טוב {n}, היום יום גדול" className={input} />
          <p className="mt-1 text-xs text-muted">{'{n}'} = הכינוי של היום</p>
        </div>

        <div>
          <label htmlFor="day-line" className={label}>✨ ״היום {A} רוצה להזכיר לך…״</label>
          <textarea {...field('line')} rows={2} placeholder="משפט משלך במקום המשפט של היום" className={area} />
        </div>

        <div>
          <label htmlFor="day-weekend" className={label}>🏨 מצב סוף שבוע</label>
          <select {...field('weekend')} className={input}>
            <option value="">{client.weekend ? 'אוטומטי (לפי מחזור סופי השבוע)' : 'אוטומטי (בלי באנר)'}</option>
            <option value="togetherHotel">{weekendCopy.togetherHotel.title}</option>
            <option value="togetherHome">{weekendCopy.togetherHome.title}</option>
            <option value="family">{weekendCopy.family.title}</option>
            <option value="none">בלי באנר</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button type="button" disabled={!ready} onClick={() => save(toOverride(form))} className="h-12 flex-1 rounded-xl bg-accent font-bold text-white disabled:opacity-50">
            לשמור ל-{fmt(date)}
          </button>
          <button type="button" disabled={!ready} onClick={() => save({})} aria-label="להחזיר את היום לשגרה" className="flex size-12 items-center justify-center rounded-xl border-[1.5px] border-line text-muted disabled:opacity-50">
            <Trash2 size={18} />
          </button>
        </div>
        <p aria-live="polite" className="min-h-5 text-sm text-muted">{status}</p>
      </Paper>
    </section>
  );
}
