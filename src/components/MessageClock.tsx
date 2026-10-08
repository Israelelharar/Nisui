import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import { chatStats as stats } from '../content/chatStats';
import { A, P, a, p } from '../lib/he';
import { tap } from '../lib/haptics';
import { Paper } from './Paper';

/**
 * "שעון ההודעות": every message from the WhatsApp export, as a year-by-month
 * strip that grows when scrolled to, and a 24-hour clock of when they talk.
 * Tap any bar for its number. Only rendered when the client has chatStats.
 */
const chatStats: NonNullable<typeof stats> = stats ?? { total: 0, admin: 0, partner: 0, first: '2024-01-01', exportedOn: '2024-01-01', busiestDay: { date: '2024-01-01', count: 0 }, months: {}, hours: Array(24).fill(0) };
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const fmt = (n: number) => n.toLocaleString('en-US');
const heDay = (iso: string) => `${Number(iso.slice(8))}.${Number(iso.slice(5, 7))}.${iso.slice(0, 4)}`;

/** Every month from the first to the export, gap months included (count null). */
const months = (() => {
  const out: { ym: string; count: number | null }[] = [];
  let [y, m] = [Number(chatStats.first.slice(0, 4)), Number(chatStats.first.slice(5, 7))];
  const [ey, em] = [Number(chatStats.exportedOn.slice(0, 4)), Number(chatStats.exportedOn.slice(5, 7))];
  while (y < ey || (y === ey && m <= em)) {
    const ym = `${y}-${String(m).padStart(2, '0')}`;
    out.push({ ym, count: chatStats.months[ym] ?? null });
    m === 12 ? ((y += 1), (m = 1)) : (m += 1);
  }
  return out;
})();
const peak = months.reduce((a, b) => ((b.count ?? 0) > (a.count ?? 0) ? b : a));
const monthName = (ym: string) => `${MONTHS[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;

function CountUp({ to, run }: { to: number; run: boolean }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!run || reduce) return setN(to);
    const c = animate(0, to, { duration: 1.8, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [run, to, reduce]);
  return <>{fmt(n)}</>;
}

export function MessageClock() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.3 });
  const lead = Math.abs(chatStats.partner - chatStats.admin);
  const leader = chatStats.partner >= chatStats.admin ? 'partner' : 'admin';
  const herShare = (chatStats.partner / Math.max(1, chatStats.total)) * 100;

  return (
    <div ref={ref}>
      <Paper tilt="rotate-[0.4deg]" className="px-5 pt-6 pb-5">
        <p className="font-serif text-[20px]">שעון ההודעות</p>
        <p className="mt-1 font-serif text-[44px] leading-none tabular-nums text-accent">
          <CountUp to={chatStats.total} run={seen} />
        </p>
        <p className="mt-1 text-[14.5px] text-muted">הודעות שכתבנו אחד לשנייה, מ־{heDay(chatStats.first)} ועד שהעתקנו את הצ׳אט.</p>

        <Months run={seen} />

        {/* her / him */}
        <div className="mt-6">
          <div className="flex justify-between text-[13.5px]">
            <span>
              <b>{P}</b> <span className="tabular-nums text-muted">{fmt(chatStats.partner)}</span>
            </span>
            <span>
              <b>{A}</b> <span className="tabular-nums text-muted">{fmt(chatStats.admin)}</span>
            </span>
          </div>
          <div className="mt-1.5 flex h-3 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={`${P} ${fmt(chatStats.partner)}, ${A} ${fmt(chatStats.admin)}`}>
            <motion.span className="h-full rounded-s-full bg-accent" initial={{ width: '50%' }} animate={{ width: seen ? `${herShare}%` : '50%' }} transition={{ duration: 1.4, delay: 0.6 }} />
            <span className="h-full flex-1 rounded-e-full bg-blue" />
          </div>
          <p className="mt-1.5 font-hand text-[15px]">
            {leader === 'partner' ? `${P} ${p('מוביל', 'מובילה')}` : `${A} ${a('מוביל', 'מובילה')}`} ב־{fmt(lead)} הודעות. (לא שמישהו סופר.)
          </p>
        </div>

        <HourClock run={seen} />

        <p className="mt-4 rounded-xl bg-butter px-3.5 py-2.5 text-[14.5px]">
          היום הכי מדובר: <b>{heDay(chatStats.busiestDay.date)}</b>, עם <b className="tabular-nums">{fmt(chatStats.busiestDay.count)}</b> הודעות ביום אחד.
        </p>
      </Paper>
    </div>
  );
}

function Months({ run }: { run: boolean }) {
  const reduce = useReducedMotion();
  const [pick, setPick] = useState<number | null>(null);
  const W = 340;
  const H = 130;
  const top = 18;
  const gap = 2;
  const bw = (W - gap * (months.length - 1)) / months.length;
  const max = peak.count!;
  const x = (i: number) => i * (bw + gap);
  const gapStart = months.findIndex((m) => m.count === null);
  const gapEnd = months.length - 1 - [...months].reverse().findIndex((m) => m.count === null);
  const shown = pick !== null ? months[pick] : null;

  return (
    <figure className="mt-5">
      <div className="relative h-6 text-center text-[13.5px]" aria-live="polite">
        {shown ? (
          shown.count === null ? (
            <span className="text-muted">{monthName(shown.ym)}: החודשים האלה חסרים בייצוא</span>
          ) : (
            <span>
              {monthName(shown.ym)}: <b className="tabular-nums">{fmt(shown.count)}</b> הודעות
            </span>
          )
        ) : (
          <span className="text-muted">לגעת בעמודה כדי לראות כמה</span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full overflow-visible" style={{ direction: 'ltr' }} role="img" aria-label={`הודעות בכל חודש, מ${monthName(months[0].ym)} עד ${monthName(months[months.length - 1].ym)}`}>
        <defs>
          <pattern id="gap-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-muted)" strokeOpacity="0.35" strokeWidth="2" />
          </pattern>
        </defs>
        <line x1="0" x2={W} y1={H} y2={H} stroke="var(--color-line)" strokeWidth="1" />
        {/* the missing months, if the export has a hole */}
        {gapStart >= 0 && (
          <>
            <rect x={x(gapStart)} y={top + 30} width={x(gapEnd) + bw - x(gapStart)} height={H - top - 30} rx="4" fill="url(#gap-hatch)" />
            <text x={x(gapStart) + (x(gapEnd) + bw - x(gapStart)) / 2} y={top + 22} textAnchor="middle" fontSize="10.5" fill="var(--color-muted)">
              חסר בייצוא
            </text>
          </>
        )}
        {months.map((m, i) => {
          if (m.count === null) return null;
          const h = Math.max(2, ((H - top) * m.count) / max);
          return (
            <motion.rect
              key={m.ym}
              x={x(i)}
              width={bw}
              rx={Math.min(3, bw / 2)}
              fill="var(--color-accent)"
              fillOpacity={pick === null || pick === i ? 1 : 0.45}
              initial={reduce ? false : { y: H, height: 0 }}
              animate={run ? { y: H - h, height: h } : { y: H, height: 0 }}
              transition={{ duration: 0.7, delay: reduce ? 0 : 0.25 + i * 0.035, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}
        {/* direct label on the peak */}
        <text x={x(months.indexOf(peak)) + bw / 2} y={top - 6} textAnchor="middle" fontSize="10.5" fill="var(--color-ink)">
          {fmt(peak.count!)}
        </text>
        {/* year marks */}
        {months.map((m, i) =>
          m.ym.endsWith('-01') ? (
            <text key={m.ym} x={x(i)} y={H + 15} fontSize="11" fill="var(--color-muted)">
              {m.ym.slice(0, 4)}
            </text>
          ) : null,
        )}
        {/* hit targets: full columns, wider than the bars */}
        {months.map((m, i) => (
          <rect
            key={`hit-${m.ym}`}
            x={x(i) - gap / 2}
            y={0}
            width={bw + gap}
            height={H}
            fill="transparent"
            className="cursor-pointer"
            onPointerEnter={(e) => e.pointerType === 'mouse' && setPick(i)}
            onPointerLeave={(e) => e.pointerType === 'mouse' && setPick(null)}
            onClick={() => (tap(5), setPick((p) => (p === i ? null : i)))}
          />
        ))}
      </svg>
      <figcaption className="sr-only">
        {months.map((m) => `${monthName(m.ym)}: ${m.count === null ? 'אין נתונים' : fmt(m.count)}`).join('. ')}
      </figcaption>
    </figure>
  );
}

function HourClock({ run }: { run: boolean }) {
  const reduce = useReducedMotion();
  const [pick, setPick] = useState<number | null>(null);
  const hours = chatStats.hours;
  const max = Math.max(...hours);
  const best = hours.indexOf(max);
  const R0 = 46;
  const LEN = 58;
  const C = 110;
  const at = (h: number, r: number) => {
    const a = ((h + 0.5) / 24) * Math.PI * 2 - Math.PI / 2;
    return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
  };
  const sel = pick ?? best;

  return (
    <figure className="mt-6 flex flex-col items-center">
      <svg viewBox="-16 -16 252 252" className="w-[250px]" style={{ direction: 'ltr' }} role="img" aria-label={`הודעות לפי שעה ביום. הכי הרבה ב־${best}:00`}>
        <circle cx={C} cy={C} r={R0 + LEN + 6} fill="none" stroke="var(--color-line)" strokeDasharray="2 5" />
        <circle cx={C} cy={C} r={R0 - 6} fill="var(--color-soft)" />
        {hours.map((n, h) => {
          const [x1, y1] = at(h, R0);
          const [x2, y2] = at(h, R0 + Math.max(3, (LEN * n) / max));
          return (
            <g key={h}>
              <motion.line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--color-accent)"
                strokeOpacity={h === sel ? 1 : 0.5}
                strokeWidth="7"
                strokeLinecap="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: run ? 1 : 0 }}
                transition={{ duration: 0.6, delay: reduce ? 0 : 0.8 + h * 0.03 }}
              />
              {/* hit target: the whole slice */}
              <line
                x1={x1}
                y1={y1}
                x2={at(h, R0 + LEN + 8)[0]}
                y2={at(h, R0 + LEN + 8)[1]}
                stroke="transparent"
                strokeWidth="16"
                className="cursor-pointer"
                onPointerEnter={(e) => e.pointerType === 'mouse' && setPick(h)}
                onPointerLeave={(e) => e.pointerType === 'mouse' && setPick(null)}
                onClick={() => (tap(5), setPick((p) => (p === h ? null : h)))}
              />
            </g>
          );
        })}
        {[0, 6, 12, 18].map((h) => {
          const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
          const r = R0 + LEN + 15;
          return (
            <text key={h} x={C + r * Math.cos(a)} y={C + r * Math.sin(a) + 4} textAnchor="middle" fontSize="11" fill="var(--color-muted)">
              {String(h).padStart(2, '0')}
            </text>
          );
        })}
        <text x={C} y={C - 2} textAnchor="middle" fontSize="19" fontWeight="700" fill="var(--color-ink)">
          {String(sel).padStart(2, '0')}:00
        </text>
        <text x={C} y={C + 15} textAnchor="middle" fontSize="10.5" fill="var(--color-muted)">
          {fmt(hours[sel])}
        </text>
      </svg>
      <figcaption className="mt-1 text-center text-[14.5px]">
        {pick === null ? (
          <>
            הכי הרבה כתבנו ב־<b>23:00</b>, והכי מעט ב־06:00.
            <br />
            <span className="font-hand text-[15px] text-muted">(כלומר, ״לילה טוב״ זה רק תחילת השיחה.)</span>
          </>
        ) : (
          <>
            בין {String(pick).padStart(2, '0')}:00 ל־{String((pick + 1) % 24).padStart(2, '0')}:00 כתבנו <b className="tabular-nums">{fmt(hours[pick])}</b> הודעות
          </>
        )}
      </figcaption>
    </figure>
  );
}
