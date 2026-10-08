/**
 * "הספר שלנו": the couple's story in chapters, one opening every morning (see
 * lib/book.ts). The chapters themselves come from the client's content.
 */
import { content } from '../client';

export type BookBlock =
  | { t: 'p'; text: string }
  | { t: 'chat'; lines: { from: 'admin' | 'partner'; text: string }[]; time?: string }
  /** A whole letter from content/notes.ts, by id. */
  | { t: 'note'; id: string }
  | { t: 'quote'; text: string; by: 'admin' | 'partner' }
  /** A small handwritten aside in the margin. */
  | { t: 'aside'; text: string };

export interface BookChapter {
  id: string;
  part: number;
  title: string;
  /** Shown under the title, e.g. "25 בינואר 2024". */
  when: string;
  blocks: BookBlock[];
  /** Waiting for content we don't have yet. */
  pending?: boolean;
  /** Written from this entry of her meeting journal (api/_lib/journal.ts). */
  journalId?: string;
}

export const bookParts = content.bookParts ?? [];
export const book: BookChapter[] = content.book ?? [];
