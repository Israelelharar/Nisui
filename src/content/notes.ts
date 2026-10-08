import type { Note } from './types';
import { content } from '../client';

/**
 * The admin's notes are released one a day in this order (two on days when
 * both are short), see lib/notes.ts. Texts are shown exactly as written.
 */
export const adminNotes: Note[] = content.adminNotes ?? [];
/** What the partner wrote, kept on the site too. */
export const partnerNotes: Note[] = content.partnerNotes ?? [];
export const togetherNotes: Note[] = content.togetherNotes ?? [];
