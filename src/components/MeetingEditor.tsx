import { useEffect, useState } from 'react';
import { CalendarHeart } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { daysToMeeting } from './Countdown';
import { Paper, SectionTitle } from './Paper';
import { P, a, p } from '../lib/he';

const input = 'h-12 w-full rounded-xl border-[1.5px] border-line bg-bg px-3 disabled:opacity-60';

/** The admin sets the next time they meet; the partner sees "עוד 3 ימים ואנחנו ביחד" at home. */
export function MeetingEditor() {
  const { clock, viewer, settings, setSettings } = useApp();
  const [date, setDate] = useState(settings.nextMeeting?.date ?? '');
  const [label, setLabel] = useState(settings.nextMeeting?.label ?? '');
  const [status, setStatus] = useState('');
  const ready = viewer.role === 'admin' && viewer.store;

  useEffect(() => {
    setDate(settings.nextMeeting?.date ?? '');
    setLabel(settings.nextMeeting?.label ?? '');
  }, [settings.nextMeeting?.date, settings.nextMeeting?.label]);

  const save = async (next: { date: string; label: string } | null) => {
    setStatus(a('שומר…', 'שומרת…'));
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { ...settings, nextMeeting: next ?? undefined } }),
    }).catch(() => null);
    if (!res?.ok) return setStatus(`השמירה נכשלה. ${a('נסה', 'נסי')} שוב.`);
    const d = await res.json();
    setSettings(d.settings);
    setStatus(next ? `נשמר. ${P} ${p('יראה', 'תראה')} את הספירה במסך הבית.` : 'הספירה הוסרה.');
  };

  const n = daysToMeeting(settings.nextMeeting?.date, clock.dayIndex);

  return (
    <section>
      <SectionTitle>
        <span className="flex items-center gap-2"><CalendarHeart size={18} className="text-accent" /> הפגישה הבאה</span>
      </SectionTitle>
      <Paper tape={false} tilt="" className="flex flex-col gap-3 p-4">
        <p className="text-sm text-muted">
          {n === null ? `לא מוגדר. ${a('קבע', 'קבעי')} תאריך ו${P} ${p('יראה', 'תראה')} ספירה לאחור.` : n === 0 ? `היום! ${P} רואה "היום אנחנו ביחד" עם קונפטי.` : `${P} רואה עכשיו: עוד ${n} ימים ואנחנו ביחד.`}
        </p>
        <label htmlFor="meet-date" className="text-sm font-bold">מתי</label>
        <input id="meet-date" type="date" value={date} min={clock.contentDate} onChange={(e) => setDate(e.target.value)} disabled={!ready} className={input} />
        <label htmlFor="meet-label" className="text-sm font-bold">איפה / מה (לא חובה)</label>
        <input id="meet-label" value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} placeholder="למשל: שבת אצלך, אילת" disabled={!ready} className={input} />
        <div className="flex gap-2">
          <button type="button" disabled={!ready || !date} onClick={() => save({ date, label: label.trim() })} className="h-12 flex-1 rounded-xl bg-accent font-bold text-white disabled:opacity-50">
            שמירה
          </button>
          {settings.nextMeeting && (
            <button type="button" disabled={!ready} onClick={() => save(null)} className="h-12 rounded-xl border-[1.5px] border-line px-4 text-muted">
              הסרה
            </button>
          )}
        </div>
        {!ready && <p className="text-sm text-muted">צריך את מסד הנתונים (Upstash) כדי לשמור.</p>}
        {status && <p role="status" className="text-sm">{status}</p>}
      </Paper>
    </section>
  );
}
