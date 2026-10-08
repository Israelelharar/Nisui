import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Archive, Check, Copy } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { appendToZip, type ZipInput } from '../lib/zip';
import { fetchAllData, fetchKeys, mb, saveFile, today } from '../lib/backup';
import { tap } from '../lib/haptics';
import { tada } from '../pet/sound';
import { SectionTitle } from './Paper';
import { client } from '../client';
import { P, a } from '../lib/he';

/**
 * "הכל בקובץ אחד": one tap, one zip. The whole project as it was built (code,
 * content, photos, docs, skills; packed by scripts/backup-plugin.ts), plus
 * everything on the server right now, plus READ-ME-FIRST.md telling any AI
 * how to bring the site back. Admin only.
 */
const PROMPT = `זה גיבוי מלא של האתר שבניתי ל${P}. תקרא את READ-ME-FIRST.md ותעלה את האתר מחדש, צעד אחרי צעד, כולל הנתונים.`;
const STEPS = ['הקוד והתוכן', 'הנתונים מהשרת', 'אורז'] as const;

export function ProjectBackup() {
  const { viewer, showToast } = useApp();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<number | null>(null);
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState<{ name: string; size: number; data: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (viewer.role !== 'admin') return null;

  const run = async () => {
    tap(10);
    setError(null);
    setDone(null);
    try {
      // 1. the project zip, with download progress
      setStep(0);
      setPct(0);
      const res = await fetch('/backup/project-source.zip', { cache: 'no-store' });
      if (!res.ok || !res.body) throw new Error(res.status === 404 ? 'nozip' : String(res.status));
      const total = Number(res.headers.get('content-length')) || 0;
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let got = 0;
      for (;;) {
        const { done: end, value } = await reader.read();
        if (end) break;
        chunks.push(value);
        got += value.length;
        if (total) setPct(Math.round((got / total) * 100));
      }
      const zip = new Uint8Array(got);
      let o = 0;
      for (const c of chunks) {
        zip.set(c, o);
        o += c.length;
      }

      // 2. everything on the server
      setStep(1);
      setPct(0);
      const extra: ZipInput[] = [];
      let hasData = false;
      if (viewer.store) {
        const keys = await fetchKeys();
        const data = await fetchAllData(keys, setPct);
        extra.push({ name: `${client.slug}-site/data/site-data.json`, data: new TextEncoder().encode(JSON.stringify(data)) });
        hasData = true;
      } else {
        extra.push({ name: `${client.slug}-site/data/NO-DATA.txt`, data: new TextEncoder().encode('The server store was not connected when this backup was made, so there is no data in it.\n') });
      }

      // 3. pack and save
      setStep(2);
      setPct(100);
      const out = appendToZip(zip, extra);
      const name = `${client.slug}-site-everything-${today()}.zip`;
      const blob = new Blob([out as BlobPart], { type: 'application/zip' });
      saveFile(blob, name);
      tap(25);
      tada();
      setDone({ name, size: blob.size, data: hasData });
    } catch (e) {
      setError(e instanceof Error && e.message === 'nozip' ? `הקובץ נבנה רק באתר החי (לא בתצוגה מקדימה). ${a('נסה', 'נסי')} מהכתובת האמיתית של האתר, בעמוד הניהול.` : 'משהו נתקע באמצע. ננסה שוב עוד רגע?');
    }
    setStep(null);
  };

  const copyPrompt = async () => {
    tap(6);
    try {
      await navigator.clipboard.writeText(PROMPT);
      showToast('הועתק. להדביק יחד עם הקובץ 📋');
    } catch {
      showToast('לא הצלחתי להעתיק');
    }
  };

  const busy = step !== null;
  return (
    <section>
      <SectionTitle>
        <span className="flex items-center gap-2">
          <Archive size={18} className="text-accent" /> הכל בקובץ אחד
        </span>
      </SectionTitle>
      <div className="relative overflow-hidden rounded-[18px] bg-[#2a1a1e] px-5 pt-5 pb-4 text-[#f6e9da] shadow-paper">
        <div aria-hidden className="paper-grain pointer-events-none absolute inset-0 opacity-40" />
        <p className="relative font-serif text-[21px] leading-snug">אם חס וחלילה משהו יקרה, מהקובץ הזה האתר חוזר לחיים.</p>
        <p className="relative mt-1.5 text-[14px] leading-relaxed text-[#f6e9da]/75">
          כל הקוד, הספר, המכתבים, התמונות, החבר הקטן, הציורים, היומן של {P}, וההוראות המדויקות לבינה מלאכותית איך להעלות הכל מחדש.
        </p>

        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="relative mt-4 flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-[#f2dfb4] font-bold text-[#3a2228] transition-transform active:scale-[0.98] disabled:cursor-progress"
        >
          {busy && (
            <motion.span
              aria-hidden
              className="absolute inset-y-0 right-0 bg-[#d9b56a]/60"
              initial={false}
              animate={{ width: `${((step! + pct / 100) / STEPS.length) * 100}%` }}
              transition={{ duration: reduce ? 0 : 0.3 }}
            />
          )}
          <span className="relative">{busy ? `${STEPS[step!]}… ${step! < 2 ? `${pct}%` : ''}` : 'להוריד את הכל'}</span>
        </button>

        <ol className="relative mt-3 flex justify-between text-[12px] text-[#f6e9da]/60" aria-label="שלבים">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-1 ${busy && step! >= i ? 'text-[#f2dfb4]' : ''}`}>
              {(busy && step! > i) || done ? <Check size={12} aria-hidden /> : <span aria-hidden className="size-1.5 rounded-full bg-current" />}
              {s}
            </li>
          ))}
        </ol>

        {done && (
          <p className="relative mt-3 rounded-xl bg-white/10 px-3 py-2 text-[13.5px]" role="status">
            ירד: <b dir="ltr">{done.name}</b> ({mb(done.size)}){done.data ? '' : ', בלי נתונים מהשרת'}. כדאי לשמור עותק בדרייב ועוד אחד במייל.
          </p>
        )}
        {error && (
          <p className="relative mt-3 rounded-xl bg-[#c2385a]/30 px-3 py-2 text-[13.5px]" role="alert">
            {error}
          </p>
        )}

        <div className="relative mt-4 border-t border-dashed border-[#f6e9da]/25 pt-3">
          <p className="text-[13px] text-[#f6e9da]/70">ביום שצריך: לפתוח שיחה עם Claude, לצרף את הקובץ, ולכתוב:</p>
          <div className="mt-1.5 flex items-start gap-2">
            <p className="flex-1 font-hand text-[15.5px] leading-snug">״{PROMPT}״</p>
            <button type="button" onClick={copyPrompt} aria-label="להעתיק את המשפט" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Copy size={16} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
