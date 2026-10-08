import { useMemo, useState } from 'react';
import { ArrowUpDown, Copy } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { tap } from '../lib/haptics';
import { bell } from '../pet/sound';
import { Paper } from './Paper';
import { phrases, words } from '../content/story';
import { a, p } from '../lib/he';

/**
 * The couple's secret language (the client's `words`), both ways. Words they
 * never invented stay as they are, so a sentence half in Hebrew still reads
 * naturally. "אוהב / אוהבת" ↔ "lavi" pairs every form with the secret word
 * (or with its matching form, "פיל / פילי").
 */
const clean = (s: string) => s.replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '').trim();
const PAIRS: [string, string][] = words.flatMap((w) => {
  const he = clean(w.meaning).split(/\s*\/\s*/).filter(Boolean);
  const secret = clean(w.he ?? w.word).split(/\s*\/\s*/).filter(Boolean);
  return he.map((h, i) => [h, secret[Math.min(i, secret.length - 1)]] as [string, string]);
});
const toSecret = new Map(PAIRS);
const toHebrew = new Map(PAIRS.map(([he, s]) => [s, he] as const));

function translate(text: string, dir: 'he' | 'secret') {
  const map = dir === 'he' ? toSecret : toHebrew;
  return text
    .split(/(\s+|[.,!?״"'׳…]+)/)
    .map((w) => map.get(w) ?? map.get(w.replace(/^ו/, '')) ?? w)
    .join('');
}

const EXAMPLES = phrases.length ? phrases.slice(0, 4).map((x) => x.he) : PAIRS.slice(0, 4).map(([he]) => he);

export function Translator() {
  const { showToast } = useApp();
  const [dir, setDir] = useState<'he' | 'secret'>('he');
  const [text, setText] = useState('');
  const out = useMemo(() => translate(text.trim(), dir), [text, dir]);

  const copy = async () => {
    tap(8);
    try {
      await navigator.clipboard.writeText(out);
      bell(1318, 0, 0.04, 0.5);
      showToast(`הועתק. עכשיו לשלוח ל${a('ו', 'ה')} בוואטסאפ 😉`);
    } catch {
      showToast('לא הצלחתי להעתיק. אפשר לסמן ולהעתיק ידנית');
    }
  };

  return (
    <Paper tilt="rotate-[0.5deg]" className="mb-6 px-5 pt-6 pb-5">
      <div className="flex items-center justify-between">
        <p className="font-serif text-[20px]">המתרגם הסודי</p>
        <button
          type="button"
          onClick={() => {
            tap(6);
            setDir((d) => (d === 'he' ? 'secret' : 'he'));
            setText(out);
          }}
          className="flex h-10 items-center gap-1.5 rounded-full bg-sky px-3.5 text-[14px] font-bold text-blue"
        >
          <ArrowUpDown size={16} aria-hidden />
          {dir === 'he' ? 'עברית ← שלנו' : 'שלנו ← עברית'}
        </button>
      </div>
      <label className="mt-3 block">
        <span className="sr-only">{dir === 'he' ? 'מה לתרגם לשפה שלנו' : 'מה לתרגם לעברית'}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={dir === 'he' ? `${p('כתוב', 'כתבי')} משהו בעברית…` : `${p('כתוב', 'כתבי')} בשפה שלנו…`}
          className="w-full resize-none rounded-xl border border-line bg-bg px-3 py-2.5 text-[17px] outline-none focus:border-accent"
        />
      </label>
      {!text && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLES.map((e) => (
            <button key={e} type="button" onClick={() => (tap(5), setDir('he'), setText(e))} className="min-h-9 rounded-full bg-soft px-3 text-[13px]">
              {e}
            </button>
          ))}
        </div>
      )}
      {text.trim() && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-butter px-3.5 py-3">
          <p aria-live="polite" className="min-w-0 flex-1 font-hand text-[21px] leading-snug">{out}</p>
          <button type="button" onClick={copy} aria-label="להעתיק" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/70">
            <Copy size={17} aria-hidden />
          </button>
        </div>
      )}
    </Paper>
  );
}
