import { useState } from 'react';
import { Copy, Link2, MessageCircle } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { tap } from '../lib/haptics';
import { SectionTitle } from './Paper';
import { a } from '../lib/he';

/**
 * Demo deployments only (DEMO=1), for the owner: a personal link per person he shows the site to.
 * It logs them in as a guest who can look around but not change anything, and it stops working
 * after the days chosen here. Opening it sends the owner a notification.
 */
type Made = { label: string; role: 'partner' | 'admin'; url: string; expires: number };
const KEY = 'demo:links';
const load = (): Made[] => {
  try {
    return (JSON.parse(localStorage.getItem(KEY) ?? '[]') as Made[]).filter((m) => m.expires > Date.now());
  } catch {
    return [];
  }
};

export function DemoLinks() {
  const { viewer, showToast } = useApp();
  const [label, setLabel] = useState('');
  const [days, setDays] = useState(3);
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState<Made[]>(load);
  if (!viewer.demo || viewer.guest || viewer.role !== 'admin') return null;

  const mint = async (role: Made['role']) => {
    tap(8);
    setBusy(true);
    try {
      const r = await fetch('/api/login?mint', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label, days, role }) });
      if (!r.ok) throw new Error(String(r.status));
      const { url, expires } = (await r.json()) as { url: string; expires: number };
      const next = [{ label: label.trim() || 'דמו', role, url, expires }, ...made].slice(0, 20);
      setMade(next);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* fine */
      }
      await copy(url);
    } catch {
      showToast('לא הצלחתי ליצור לינק. ננסה שוב?');
    }
    setBusy(false);
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('הלינק הועתק 📋');
    } catch {
      showToast('לא הצלחתי להעתיק, אפשר לסמן ולהעתיק ידנית');
    }
  };

  const until = (t: number) => new Date(t).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });

  return (
    <section>
      <SectionTitle>
        <span className="flex items-center gap-2">
          <Link2 size={18} className="text-accent" /> לינקים לדמו
        </span>
      </SectionTitle>
      <div className="rounded-[18px] bg-paper p-4 shadow-paper">
        <p className="text-[14px] leading-relaxed text-muted">
          לינק אישי לכל {a('מי שאתה מראה', 'מי שאת מראה')} לו את האתר. הוא יכול להסתכל על הכל אבל לא לשנות כלום, הלינק מפסיק לעבוד לבד, ו{a('אתה מקבל', 'את מקבלת')} הודעה כשהוא נפתח.
        </p>
        <label className="mt-3 block text-[13px] font-bold" htmlFor="demo-label">
          למי הלינק?
        </label>
        <input
          id="demo-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="למשל: דני מטיקטוק"
          maxLength={40}
          className="mt-1 h-11 w-full rounded-xl border border-line bg-white/70 px-3 text-[15px] outline-none focus-visible:border-accent"
        />
        <div className="mt-3 flex items-center gap-2 text-[13px]" role="radiogroup" aria-label="כמה זמן הלינק עובד">
          <span className="font-bold">עובד:</span>
          {[1, 3, 7].map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={days === d}
              onClick={() => setDays(d)}
              className={`rounded-full px-3 py-1.5 font-bold transition-transform active:scale-95 ${days === d ? 'bg-accent text-white' : 'bg-line/60'}`}
            >
              {d === 1 ? 'יום' : `${d} ימים`}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" disabled={busy} onClick={() => mint('partner')} className="h-12 rounded-full bg-accent px-3 text-[14px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60">
            לינק לאתר שלה
          </button>
          <button type="button" disabled={busy} onClick={() => mint('admin')} className="h-12 rounded-full bg-ink px-3 text-[14px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60">
            לינק לעמוד הניהול
          </button>
        </div>

        {made.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2 border-t border-dashed border-line pt-3">
            {made.map((m) => (
              <li key={m.url} className="flex items-center gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold">{m.label}</span>
                  <span className="block text-[12px] text-muted">
                    {m.role === 'admin' ? 'עמוד הניהול' : 'האתר שלה'} · עד {until(m.expires)}
                  </span>
                </span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(m.url)}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="לשלוח בוואטסאפ"
                  className="flex size-10 items-center justify-center rounded-full bg-line/60"
                >
                  <MessageCircle size={17} aria-hidden />
                </a>
                <button type="button" onClick={() => copy(m.url)} aria-label="להעתיק את הלינק" className="flex size-10 items-center justify-center rounded-full bg-line/60">
                  <Copy size={17} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
