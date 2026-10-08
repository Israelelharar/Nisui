import { adminNotes } from '../content/notes';
import type { Note } from '../content/types';
import { pickDaily } from './daily';

/** "אם הפתק פחות מ-10 שורות תשים ביום 2 פתקים". Long single lines count too. */
export const isShort = (n: Note) => n.body.split('\n').length < 10 && n.body.length < 350;

/** Queue → daily bundles: one note a day, or two consecutive short ones. */
const bundles: Note[][] = (() => {
  const out: Note[][] = [];
  for (let i = 0; i < adminNotes.length; ) {
    const a = adminNotes[i];
    const b = adminNotes[i + 1];
    if (b && isShort(a) && isShort(b)) {
      out.push([a, b]);
      i += 2;
    } else {
      out.push([a]);
      i += 1;
    }
  }
  return out;
})();

export interface NotesToday {
  /** Today's new note(s). */
  today: Note[];
  /** True once every note was released: today's is a reread. */
  rerun: boolean;
  /** Everything released so far, today included, newest first. */
  released: Note[];
  /** How many are still waiting. */
  remaining: number;
}

export function notesFor(dayIndex: number, launchDay: number): NotesToday {
  const day = Math.max(0, dayIndex - launchDay);
  if (day < bundles.length) {
    const released = bundles.slice(0, day + 1).flat().reverse();
    return {
      today: bundles[day],
      rerun: false,
      released,
      remaining: adminNotes.length - released.length,
    };
  }
  return {
    today: [pickDaily(adminNotes, dayIndex, 'notes-rerun')],
    rerun: true,
    released: adminNotes.slice().reverse(),
    remaining: 0,
  };
}
