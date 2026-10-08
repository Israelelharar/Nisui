import { useState } from 'react';
import { Palette } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { SKINS, skinFor, type SkinId, type SkinSetting } from '../lib/skins';
import { tap } from '../lib/haptics';
import { Paper, SectionTitle } from './Paper';
import { P, a, p } from '../lib/he';
import { client } from '../client';

const DAY = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

/** A tiny phone of the site in one look: its ground, a glass card and the bottom bar. */
function Tile({ id, on, label, onPick }: { id: SkinId; on: boolean; label: string; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={on}
      className={`group flex min-w-0 flex-1 flex-col items-center gap-1.5 transition-transform active:scale-95 ${on ? '' : 'opacity-80 hover:opacity-100'}`}
    >
      <span
        data-skin={id}
        className={`skin-ground relative block aspect-[9/15] w-full max-w-[64px] overflow-hidden rounded-[14px] border-[3px] transition-[transform,border-color] duration-300 ${
          on ? '-translate-y-1 border-accent' : 'border-black/70'
        }`}
      >
        <span className="absolute inset-x-2 top-[9%] block h-[6%] w-1/2 rounded-full bg-accent" />
        <span className="absolute inset-x-1.5 top-[22%] block h-[26%] rounded-md border border-line bg-paper backdrop-blur" />
        <span className="absolute inset-x-1.5 top-[53%] block h-[14%] rounded-md border border-line bg-paper backdrop-blur" />
        <span className="skin-nav absolute inset-x-1 bottom-1.5 flex h-4 items-center justify-around rounded-md">
          <i className="block size-1.5 rounded-full" style={{ background: 'var(--nav-active)' }} />
          <i className="block size-1 rounded-full bg-current opacity-60" />
          <i className="block size-1 rounded-full bg-current opacity-60" />
        </span>
      </span>
      <span className={`text-center text-[11px] leading-tight ${on ? 'font-bold text-accent' : 'text-muted'}`}>{label}</span>
    </button>
  );
}

/** The admin picks how the site looks: a different look every day, or one pinned. Only the admin sees this. */
export function SkinPicker() {
  const { clock, viewer, settings, setSettings } = useApp();
  const [status, setStatus] = useState('');
  const ready = viewer.role === 'admin' && viewer.store;
  const mode: SkinSetting = settings.skin ?? client.skin ?? 'auto';
  const today = skinFor(mode, clock.dayIndex);

  const pick = async (next: SkinSetting) => {
    if (next === mode) return;
    tap(8);
    const before = settings;
    // The page re-skins right away, so the change shows while it saves.
    setSettings({ ...settings, skin: next });
    if (!ready) return setStatus('זו רק תצוגה. צריך את מסד הנתונים כדי לשמור.');
    setStatus(a('שומר…', 'שומרת…'));
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { ...before, skin: next } }),
    }).catch(() => null);
    if (!res?.ok) {
      setSettings(before);
      return setStatus(`השמירה נכשלה. ${a('נסה', 'נסי')} שוב.`);
    }
    setSettings((await res.json()).settings);
    setStatus(next === 'auto' ? `נשמר. מחר ${P} ${p('יתעורר', 'תתעורר')} לעיצוב חדש.` : `נשמר. האתר נשאר ב"${SKINS.find((s) => s.id === next)!.name}".`);
  };

  const week = Array.from({ length: 7 }, (_, i) => ({
    day: i === 0 ? 'היום' : i === 1 ? 'מחר' : DAY[(clock.weekday + i) % 7],
    skin: skinFor('auto', clock.dayIndex + i),
  }));

  return (
    <section>
      <SectionTitle>
        <span className="flex items-center gap-2">
          <Palette size={18} className="text-accent" /> עיצוב האתר
        </span>
      </SectionTitle>
      <Paper tape={false} tilt="" className="flex flex-col gap-4 p-4">
        <div className="flex rounded-full border-[1.5px] border-line p-1 text-sm font-bold" role="radiogroup" aria-label="מצב עיצוב">
          {(
            [
              ['auto', 'כל יום אחר'],
              ['pin', 'קבוע'],
            ] as const
          ).map(([k, l]) => {
            const on = k === 'auto' ? mode === 'auto' : mode !== 'auto';
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => pick(k === 'auto' ? 'auto' : today.id)}
                className={`h-10 flex-1 rounded-full transition-colors ${on ? 'bg-accent text-white' : 'text-muted'}`}
              >
                {l}
              </button>
            );
          })}
        </div>

        <div className="flex justify-between gap-2 pt-1">
          {SKINS.map((s) => (
            <Tile key={s.id} id={s.id} label={s.name} on={today.id === s.id} onPick={() => pick(s.id)} />
          ))}
        </div>

        <p className="text-sm text-muted">
          {mode === 'auto' ? (
            <>
              היום {P} רואה <b className="text-ink">{today.name}</b>. {today.desc}.
            </>
          ) : (
            <>
              נעול על <b className="text-ink">{today.name}</b>. לחיצה על "כל יום אחר" מחזירה את הסבב.
            </>
          )}
        </p>

        {mode === 'auto' && (
          <ol className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted" aria-label="השבוע">
            {week.map((w) => (
              <li key={w.day} className="flex items-center gap-1.5">
                <i className="block size-2.5 rounded-full" style={{ background: w.skin.swatch[0], boxShadow: `inset 0 0 0 2px ${w.skin.swatch[1]}` }} />
                <span className={w.day === 'היום' ? 'font-bold text-ink' : ''}>{w.day}</span>
              </li>
            ))}
          </ol>
        )}

        {status && (
          <p role="status" className="text-sm">
            {status}
          </p>
        )}
      </Paper>
    </section>
  );
}
