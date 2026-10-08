import { useEffect, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { Paper, SectionTitle } from './Paper';
import { P, p } from '../lib/he';

const fmt = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric' });

/**
 * Has the partner started yet? If the admin tested with the partner's password,
 * one tap clears it so everything is still sealed and day 1 starts on the real first login.
 */
export function StartStatus() {
  const { viewer } = useApp();
  const [state, setState] = useState<{ launchDate: string | null; opened: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const ready = viewer.role === 'admin' && viewer.store;

  useEffect(() => {
    if (!ready) return;
    fetch('/api/start')
      .then((r) => (r.ok ? r.json() : null))
      .then(setState)
      .catch(() => {});
  }, [ready]);

  const reset = async () => {
    if (!confirm(`לאפס? כל מה שנפתח יחזור להיות סגור, והיום הראשון יתחיל כש${P} ${p('ייכנס', 'תיכנס')}.`)) return;
    setBusy(true);
    const res = await fetch('/api/start', { method: 'POST' }).catch(() => null);
    if (res?.ok) {
      setState(await res.json());
      try {
        localStorage.removeItem('idw:opened');
        localStorage.removeItem('idw:customNotes');
      } catch {
        /* nothing stored */
      }
    }
    setBusy(false);
  };

  if (!ready || !state) return null;
  const started = !!state.launchDate || state.opened > 0;

  return (
    <section>
      <SectionTitle>
        <span className="flex items-center gap-2"><Sparkles size={18} className="text-accent" /> {P} באתר</span>
      </SectionTitle>
      <Paper tape={false} tilt="" className="flex flex-col gap-3 p-4">
        {started ? (
          <p className="text-[15px]">
            {state.launchDate ? `${p('נכנס', 'נכנסה')} לראשונה ב${fmt(state.launchDate)}` : `עוד לא ${p('נכנס', 'נכנסה')}`} · {p('פתח', 'פתחה')} {state.opened} פתקים
          </p>
        ) : (
          <p className="text-[15px]">{P} עוד לא {p('נכנס', 'נכנסה')}. הכל סגור ומחכה, והיום הראשון יתחיל בכניסה הראשונה. ✨</p>
        )}
        {started && (
          <>
            <p className="text-xs text-muted">אם בדקת בעצמך עם הסיסמה של {P}, אפשר לאפס. אחרי ש{P} {p('מתחיל', 'מתחילה')}, לא ללחוץ.</p>
            <button type="button" disabled={busy} onClick={reset} className="flex h-11 items-center justify-center gap-2 rounded-xl border-[1.5px] border-line font-bold text-muted disabled:opacity-50">
              <RotateCcw size={16} /> לאפס ולהתחיל מאפס
            </button>
          </>
        )}
      </Paper>
    </section>
  );
}
