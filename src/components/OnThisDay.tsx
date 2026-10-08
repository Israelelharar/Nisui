import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { useApp } from '../hooks/useApp';
import { pop } from '../pet/sound';
import type { Moment } from '../content/onThisDay';
import { content, has } from '../client';

/**
 * Home: "היום לפני שנה". The same date in an earlier year of the chat, as the
 * bubbles they actually sent, typed in one by one when scrolled into view.
 * No moment on this exact date? The nearest one that week.
 */
const dayOf = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);
const isoOf = (day: number) => new Date(day * 86_400_000).toISOString().slice(0, 10);
const heDate = (iso: string) => `${Number(iso.slice(8))}.${Number(iso.slice(5, 7))}.${iso.slice(0, 4)}`;

function pick(all: Record<string, Moment>, today: string) {
  const year = Number(today.slice(0, 4));
  // Exact date first (most recent year), then up to 3 days either side.
  for (const shift of [0, -1, 1, -2, 2, -3, 3]) {
    for (let y = year - 1; y >= year - 12; y--) {
      const target = isoOf(dayOf(`${y}${today.slice(4)}`) + shift);
      if (all[target]) return { date: target, years: y === year - 1 ? 1 : year - y, exact: shift === 0, moment: all[target] };
    }
  }
  return null;
}

export function OnThisDay() {
  const { clock } = useApp();
  const [found, setFound] = useState<ReturnType<typeof pick> | undefined>(undefined);
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = content.onThisDay;
    if (!has('onThisDay') || !load) {
      setFound(null);
      return;
    }
    load()
      .then((m) => alive && setFound(pick(m, clock.contentDate)))
      .catch(() => alive && setFound(null));
    return () => {
      alive = false;
    };
  }, [clock.contentDate]);

  // Bubbles arrive one at a time, like the chat itself.
  const total = found?.moment.lines.length ?? 0;
  useEffect(() => {
    if (!seen || !found) return;
    if (reduce) return setShown(total);
    if (shown >= total) return;
    const t = window.setTimeout(
      () => {
        setShown((n) => n + 1);
        pop();
      },
      shown === 0 ? 350 : 650,
    );
    return () => window.clearTimeout(t);
  }, [seen, found, shown, total, reduce]);

  // Nothing for this week of the year: no card at all.
  if (found === null) return null;
  // Still loading: an empty frame of the same size, so the in-view watcher has something to watch.
  if (!found) return <section ref={ref} aria-hidden className="min-h-40" />;
  const { moment, date, years, exact } = found;
  const label = exact ? (years === 1 ? 'היום לפני שנה' : years === 2 ? 'היום לפני שנתיים' : `היום לפני ${years} שנים`) : years === 1 ? 'השבוע לפני שנה' : 'השבוע, לפני שנתיים';

  return (
    <section ref={ref} aria-label={`${label}: ${moment.title}`} className="relative">
      <div className="relative rotate-[0.6deg] rounded-[22px] bg-[#efe3d3] px-3.5 pt-4 pb-3.5 shadow-paper" style={{ colorScheme: 'light' }}>
        <span aria-hidden className="absolute -top-[10px] left-8 h-[20px] w-[84px] -rotate-6 rounded-[2px] bg-soft/90" />
        <div className="flex items-baseline justify-between gap-2 px-1">
          <p className="font-serif text-[19px] leading-tight text-[#3a2228]">{moment.title}</p>
          <p className="shrink-0 text-[12px] text-[#7a5f63]">
            {label} · {heDate(date)}
          </p>
        </div>
        <div className="mt-3 flex min-h-16 flex-col gap-1" aria-live="polite">
          {moment.lines.slice(0, shown).map((l, i) => {
            const him = l.f === 'i';
            const newSpeaker = i === 0 || moment.lines[i - 1].f !== l.f;
            return (
              <motion.div
                key={i}
                initial={reduce ? false : { opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                className={`flex flex-col ${him ? 'items-start' : 'items-end'} ${newSpeaker && i ? 'mt-1.5' : ''}`}
              >
                <span
                  className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[15.5px] leading-snug whitespace-pre-line text-[#3a2228] shadow-[0_1px_0_rgb(0_0_0/0.06)] ${
                    him ? 'rounded-tr-md bg-white' : 'rounded-tl-md bg-[#fbd9e1]'
                  }`}
                >
                  {l.x}
                  <span className="ms-2 align-bottom text-[10.5px] text-[#7a5f63] tabular-nums">{l.t}</span>
                </span>
              </motion.div>
            );
          })}
          {seen && shown < total && (
            <div className={`flex ${moment.lines[shown].f === 'i' ? 'justify-start' : 'justify-end'}`} aria-hidden>
              <span className="flex gap-1 rounded-2xl bg-white/70 px-3 py-2.5">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="size-1.5 animate-bounce rounded-full bg-[#7a5f63]/60" style={{ animationDelay: `${d * 120}ms` }} />
                ))}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
