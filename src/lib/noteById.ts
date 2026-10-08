import { adminNotes, partnerNotes, togetherNotes } from '../content/notes';
import type { Note } from '../content/types';

const all = new Map<string, Note>([...adminNotes, ...partnerNotes, ...togetherNotes].map((n) => [n.id, n]));

export const getNote = (id: string) => all.get(id);
