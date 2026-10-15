import { book, type BookChapter } from '../content/book';
import { getNote } from './noteById';
import { client } from '../client';

/**
 * The first chapter opens on `bookStart` (or, without one, on the partner's first visit,
 * `launchDay`); one more every morning after.
 */
const fixedStart = client.bookStart ? Math.floor(Date.parse(`${client.bookStart}T00:00:00Z`) / 86_400_000) : null;
const startOf = (launchDay: number) => fixedStart ?? launchDay;

/** How many chapters are open. The admin sees all of them. */
export const chaptersOpen = (dayIndex: number, all: boolean, launchDay: number) => (all ? book.length : Math.max(1, Math.min(book.length, dayIndex - startOf(launchDay) + 1)));

/** Every chapter is out: from now on the home card brings back an old one each day. */
export const bookFinished = (dayIndex: number, launchDay: number) => dayIndex - startOf(launchDay) + 1 > book.length;

/** Hebrew numerals, the way a real Hebrew book numbers its chapters: א׳, ט״ו, כ״ח. */
export function heNum(n: number) {
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ'];
  let s = tens[Math.floor(n / 10)] + ones[n % 10];
  s = s.replace('יה', 'טו').replace('יו', 'טז');
  return s.length === 1 ? `${s}׳` : `${s.slice(0, -1)}״${s.slice(-1)}`;
}

/** Roughly how long a chapter takes to read, in minutes (letters included). */
export function minutesToRead(c: BookChapter) {
  let chars = 0;
  for (const b of c.blocks) {
    if (b.t === 'p' || b.t === 'quote' || b.t === 'aside') chars += b.text.length;
    else if (b.t === 'chat') chars += b.lines.reduce((a, l) => a + l.text.length, 0);
    else if (b.t === 'note') chars += getNote(b.id)?.body.length ?? 0;
  }
  return Math.max(2, Math.round(chars / 900));
}
