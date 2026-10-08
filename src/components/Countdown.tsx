import { useApp } from '../hooks/useApp';
import { has } from '../client';
import { a, p } from '../lib/he';

const dayOf = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);

/** Days until the next meeting set in the admin page. Null when none is set or it passed. */
export function daysToMeeting(date: string | undefined, dayIndex: number) {
  if (!date) return null;
  const n = dayOf(date) - dayIndex;
  return n >= 0 ? n : null;
}

/** "עוד 3 ימים ואנחנו ביחד". Counts content days, so it flips at 05:00 like everything else. */
export function Countdown() {
  const { settings, clock } = useApp();
  const meeting = settings.nextMeeting;
  const n = daysToMeeting(meeting?.date, clock.dayIndex);
  if (!has('countdown') || !meeting || n === null) return null;

  const when = new Date(`${meeting.date}T12:00:00Z`).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric', timeZone: 'UTC' });
  const label = meeting.label ? ` · ${meeting.label}` : '';

  if (n === 0) {
    return (
      <section className="rounded-[22px] bg-accent px-5 py-5 text-center text-white">
        <p className="font-serif text-[28px] leading-tight">היום אנחנו ביחד 🥹</p>
        <p className="mt-1 text-[15px] text-white/90">סוף סוף. {p('תספור', 'תספרי')} את השעות, אני {a('סופר', 'סופרת')} את הדקות.</p>
        {meeting.label && <p className="mt-1 font-hand text-sm text-white/90">{meeting.label}</p>}
      </section>
    );
  }
  return (
    <section className="flex items-center gap-4 rounded-[22px] bg-soft px-5 py-4">
      <div className="flex size-[72px] shrink-0 flex-col items-center justify-center rounded-2xl bg-paper shadow-soft">
        <span className="font-serif text-[34px] leading-none text-accent">{n === 1 ? '1' : n}</span>
        <span className="text-[11px] text-muted">{n === 1 ? 'יום' : 'ימים'}</span>
      </div>
      <div>
        <p className="font-serif text-[21px] leading-snug">{n === 1 ? 'מחר אנחנו ביחד ❤️' : `עוד ${n} ימים ואנחנו ביחד`}</p>
        <p className="text-sm text-muted">
          {when}
          {label}
        </p>
      </div>
    </section>
  );
}
