import { useEffect, useState } from 'react';
import { Database, Download } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { client } from '../client';
import { species } from '../pet/species';
import { Paper, SectionTitle } from './Paper';
import { fetchAllData, fetchKeys, mb, saveFile, today, type KeyInfo } from '../lib/backup';

/** The free Upstash plan's data allowance. If the plan changes, change this number. */
const LIMIT_MB = 256;

const GROUPS: { id: KeyInfo['group']; label: string; color: string }[] = [
  { id: 'photos', label: `תמונות באלבום של ה${species.name}`, color: '#E25A7A' },
  { id: 'art', label: 'ציורים', color: '#F2B544' },
  { id: 'backups', label: `גיבויים יומיים של ה${species.name}`, color: '#7EC8F2' },
  { id: 'pet', label: `ה${species.name} עצמו`, color: '#8FD06A' },
  { id: 'site', label: 'האתר (פתקים, הגדרות, ימים)', color: '#B48CF0' },
];

/**
 * How full the database is, and a button that downloads all of it, every
 * value exactly as stored (photos and drawings included), into one file on
 * the admin's phone. From that file everything can be put back.
 */
export function StorageCard() {
  const { viewer } = useApp();
  const [keys, setKeys] = useState<KeyInfo[] | null>(null);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const ready = viewer.role === 'admin' && viewer.store;

  useEffect(() => {
    if (!ready) return;
    fetchKeys()
      .then(setKeys)
      .catch(() => setError(true));
  }, [ready]);

  if (viewer.role !== 'admin') return null;

  const total = keys?.reduce((s, k) => s + k.bytes, 0) ?? 0;
  const pct = Math.min(100, (total / (LIMIT_MB * 1024 * 1024)) * 100);
  const by = (g: KeyInfo['group']) => keys?.filter((k) => k.group === g) ?? [];
  const photoCount = by('photos').filter((k) => k.key.startsWith('pet:photo:')).length;
  const artCount = by('art').filter((k) => k.key.startsWith('art:img:')).length;

  const backup = async () => {
    if (!keys) return;
    setDone(null);
    setProgress(0);
    try {
      const data = await fetchAllData(keys, setProgress);
      const file = new Blob([JSON.stringify(data)], { type: 'application/json' });
      saveFile(file, `${client.slug}-site-backup-${today()}.json`);
      setDone(`הגיבוי ירד (${mb(file.size)}). כדאי לשמור אותו בדרייב או במייל.`);
    } catch {
      setDone('משהו נתקע באמצע. ננסה שוב עוד רגע?');
    }
    setProgress(null);
  };

  return (
    <section>
      <SectionTitle>
        <span className="flex items-center gap-2">
          <Database size={18} className="text-accent" /> המקום שלנו
        </span>
      </SectionTitle>
      <Paper tape={false} tilt="" className="flex flex-col gap-3 p-4">
        {!ready ? (
          <p className="text-sm text-muted">(בתצוגה המקדימה אין שרת, אז אין מה למדוד.)</p>
        ) : error ? (
          <p className="text-sm text-muted">לא הצלחתי לקרוא כרגע כמה מקום תפוס. ננסה בכניסה הבאה.</p>
        ) : !keys ? (
          <p className="text-sm text-muted">מודד…</p>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-[24px] tabular-nums">{mb(total)}</span>
              <span className="text-sm text-muted">מתוך {LIMIT_MB}MB · נשאר {mb(Math.max(0, LIMIT_MB * 1024 * 1024 - total))}</span>
            </div>
            {/* one bar, split by what fills it */}
            <div className="flex h-3.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${pct.toFixed(1)}% בשימוש`}>
              {GROUPS.map((g) => {
                const b = by(g.id).reduce((s, k) => s + k.bytes, 0);
                return b ? <span key={g.id} style={{ width: `${Math.max(0.6, (b / (LIMIT_MB * 1024 * 1024)) * 100)}%`, background: g.color }} /> : null;
              })}
            </div>
            <ul className="flex flex-col gap-1.5 text-[14px]">
              {GROUPS.map((g) => {
                const b = by(g.id).reduce((s, k) => s + k.bytes, 0);
                const extra = g.id === 'photos' ? ` · ${photoCount} תמונות` : g.id === 'art' ? ` · ${artCount} ציורים` : '';
                return (
                  <li key={g.id} className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: g.color }} />
                    <span className="flex-1">{g.label}</span>
                    <span className="text-muted tabular-nums">
                      {mb(b)}
                      {extra}
                    </span>
                  </li>
                );
              })}
            </ul>
            {pct > 75 && <p className="rounded-xl bg-soft px-3 py-2 text-sm font-bold text-accent">המקום מתמלא. כדאי להוריד גיבוי ולמחוק כמה תמונות ישנות מהאלבום.</p>}
            <button
              type="button"
              onClick={backup}
              disabled={progress !== null}
              className="mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-accent font-bold text-white disabled:opacity-70"
            >
              <Download size={18} />
              {progress !== null ? `מוריד… ${progress}%` : 'להוריד גיבוי של הכל'}
            </button>
            <p className="text-[12.5px] leading-snug text-muted">
              קובץ אחד עם כל מה ששמור: ה{species.name}, התמונות, הציורים, הפתקים שנפתחו וההגדרות. ממנו אפשר להחזיר הכל.
            </p>
            {done && <p className="text-sm font-bold">{done}</p>}
          </>
        )}
      </Paper>
    </section>
  );
}
