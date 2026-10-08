/**
 * The admin's edits for one day. Keyed by the content day (a day starts at
 * 05:00 local time), so at 05:00 the next morning everything is back to the
 * regular daily rotation by itself.
 */
export interface DayOverride {
  /** Replaces the greeting title. `{n}` = the nickname of the day. */
  greeting?: string;
  /** A special message shown at the top of the home screen, sealed until opened. */
  special?: { title?: string; body: string };
  /** Replaces the daily "want to remind you" line. */
  line?: string;
  /** An extra note for this day, on top of the regular one. Saved in "הפתקים שלי" once opened. */
  note?: { title: string; body: string };
  /** Weekend banner for this day ('none' hides it). */
  weekend?: 'family' | 'togetherHome' | 'togetherHotel' | 'none';
  updatedAt?: string;
}

export const DAY_KEY = (date: string) => `day:${date}`;
export const DAYS_SET = 'days';
export const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Today's content date locally (a day starts at 05:00). */
export function contentDateNow(now = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: process.env.SITE_TZ ?? 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(now - 5 * 60 * 60 * 1000),
  );
}

const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);

/** Keeps only known fields with sane lengths. Returns null when nothing is left. */
export function sanitize(input: unknown): DayOverride | null {
  const o = (input ?? {}) as Record<string, any>;
  const out: DayOverride = {};
  const greeting = str(o.greeting, 80);
  if (greeting) out.greeting = greeting;
  const line = str(o.line, 300);
  if (line) out.line = line;
  const specialBody = str(o.special?.body, 3000);
  if (specialBody) out.special = { title: str(o.special?.title, 80), body: specialBody };
  const noteBody = str(o.note?.body, 6000);
  if (noteBody) out.note = { title: str(o.note?.title, 80) ?? 'פתק מיוחד', body: noteBody };
  if (['family', 'togetherHome', 'togetherHotel', 'none'].includes(o.weekend)) out.weekend = o.weekend;
  return Object.keys(out).length ? out : null;
}
