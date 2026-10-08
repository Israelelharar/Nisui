import type { WeekendMode } from '../content/types';
import type { Clock } from './time';
import { client } from '../client';

/**
 * An optional weekend cycle (e.g. family → together → family → hotel), shown
 * Thursday evening to Saturday. Needs `client.weekend` with an anchor
 * Saturday that was cycle[0]; otherwise no weekend banner rather than a wrong
 * one. The admin can also set a banner for one day (DayEditor).
 */
export function getWeekendMode(c: Clock): WeekendMode | null {
  const w = client.weekend;
  if (!w || !w.cycle.length) return null;
  const inWeekend = (c.weekday === 4 && c.hour >= 18) || c.weekday === 5 || c.weekday === 6;
  if (!inWeekend) return null;
  const anchorDay = Math.floor(Date.parse(`${w.anchor}T00:00:00Z`) / 86_400_000);
  const daysToSaturday = (6 - c.weekday + 7) % 7;
  const weeks = Math.floor((c.dayIndex + daysToSaturday - anchorDay) / 7);
  const n = w.cycle.length;
  return w.cycle[((weeks % n) + n) % n];
}
