import { Link } from 'react-router';
import { useApp } from '../hooks/useApp';
import { dates, datesFinished, unlockedCount } from '../content/dates';
import { pickDaily } from '../lib/daily';
import { has } from '../client';
import { P, p } from '../lib/he';

/** Home: today's newly unlocked date from the diary. */
export function NewDateCard() {
  const { clock, launchDay, viewer } = useApp();
  const isAdmin = viewer.role === 'admin';
  if (!has('dates') || (isAdmin && !viewer.launchDate)) return null;
  if (!dates.length) return null;
  const again = datesFinished(clock.dayIndex, launchDay);
  const d = again ? pickDaily(dates, clock.dayIndex, 'date-again') : dates[unlockedCount(clock.dayIndex, launchDay, false) - 1];
  return (
    <Link to="/dates" className="flex items-center gap-3 rounded-[22px] bg-paper px-4 py-3.5 no-underline shadow-soft">
      <span aria-hidden className="sticker flex size-12 shrink-0 items-center justify-center rounded-2xl bg-soft text-2xl" style={{ ['--tilt' as string]: '6deg' }}>
        {d.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold tracking-[1.5px] text-accent">{again ? (isAdmin ? `חוזרת היום ל${P} מהיומן` : `${p('זוכר', 'זוכרת')} את הפגישה הזאת?`) : isAdmin ? `היום נפתחה ל${P} ביומן 🔓` : 'נפתחה לך היום ביומן 🔓'}</span>
        <span className="block truncate font-serif text-lg">{d.title}</span>
      </span>
      <span aria-hidden className="text-accent">←</span>
    </Link>
  );
}
