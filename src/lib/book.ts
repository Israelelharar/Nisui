import { book, type BookChapter } from '../content/book';
import { getNote } from './noteById';
import { client } from '../client';

/** The first chapter opens this morning; one more every morning after. */
export const BOOK_START = client.bookStart ?? client.launchDate ?? '2026-01-01';
const startDay = Math.floor(Date.parse(`${BOOK_START}T00:00:00Z`) / 86_400_000);

/** How many chapters are open. The admin sees all of them. */
export const chaptersOpen = (dayIndex: number, all: boolean) => (all ? book.length : Math.max(1, Math.min(book.length, dayIndex - startDay + 1)));

/** For the admin's "not open yet" marks: what the partner has today. */
/** Every chapter is out: from now on the home card brings back an old one each day. */
export const bookFinished = (dayIndex: number) => dayIndex - startDay + 1 > book.length;

export const chaptersOpenForPartner = (dayIndex: number) => chaptersOpen(dayIndex, false);

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
