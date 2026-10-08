import type { Slot } from '../content/types';
import { client } from '../client';

export interface Clock {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  hour: number;
  minute: number;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  /**
   * The "content day" that drives every daily rotation. A new day starts at
   * 05:00, not midnight: 00:00–04:59 still belongs to the previous day, so
   * nothing changes in the middle of the night.
   */
  dayIndex: number;
  /** `dayIndex` as a date (YYYY-MM-DD). Key for the admin's per-day edits. */
  contentDate: string;
  label: string;
}

/** Hour at which a new day's notes, photo and surprise open. */
export const DAY_STARTS_AT = 5;

const WEEKDAYS = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'];

/**
 * `?at=2026-09-25T06:00` previews the site at another time (for the admin to
 * check what the partner will see). Interpreted as the site's local time.
 */
function overrideFromUrl(): { date: string; hour: number; minute: number } | null {
  if (typeof window === 'undefined') return null;
  const at = new URLSearchParams(window.location.search).get('at');
  const m = at?.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?$/);
  if (!m) return null;
  return { date: m[1], hour: Number(m[2] ?? 12), minute: Number(m[3] ?? 0) };
}

export function getClock(now = new Date()): Clock {
  const o = overrideFromUrl();
  let date: string;
  let hour: number;
  let minute: number;
  if (o) {
    ({ date, hour, minute } = o);
  } else {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: client.timeZone ?? 'Asia/Jerusalem',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(now)
        .map((p) => [p.type, p.value]),
    );
    date = `${parts.year}-${parts.month}-${parts.day}`;
    hour = Number(parts.hour);
    minute = Number(parts.minute);
  }
  const utcMidnight = Date.parse(`${date}T00:00:00Z`);
  const dayIndex = Math.floor(utcMidnight / 86_400_000) - (hour < DAY_STARTS_AT ? 1 : 0);
  const contentDate = new Date(dayIndex * 86_400_000).toISOString().slice(0, 10);
  const weekday = new Date(utcMidnight).getUTCDay();
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return { date, hour, minute, weekday, dayIndex, contentDate, label: `${WEEKDAYS[weekday]} · ${hh}:${mm}` };
}

/** Parts of the day: morning, noon (from 11:00, Fri 10:00), evening, own time 20:45–22:25, night, late. */
export function getSlot(c: Clock): Slot {
  const t = c.hour * 60 + c.minute;
  const noonStart = c.weekday === 5 ? 10 * 60 : 11 * 60;
  if (t >= 5 * 60 + 30 && t < noonStart) return 'morning';
  if (t >= noonStart && t < 18 * 60) return 'noon';
  if (t >= 18 * 60 && t < 20 * 60 + 45) return 'evening';
  if (t >= 20 * 60 + 45 && t < 22 * 60 + 25) return 'ts';
  if (t >= 22 * 60 + 25) return 'night';
  return 'late';
}

export const isNightish = (s: Slot) => s === 'night' || s === 'late';
