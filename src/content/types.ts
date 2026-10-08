/**
 * Content model. Everything the partner sees comes from typed data in the
 * client's folder (clients/<slug>/content, see src/client/schema.ts), never
 * hard-coded in components, so a couple can have hundreds of items without
 * touching UI code. The modules in this folder adapt it for the site.
 */

export type Slot = 'morning' | 'noon' | 'evening' | 'ts' | 'night' | 'late';

export type Mood =
  | 'tired'
  | 'missing'
  | 'sad'
  | 'stressed'
  | 'doubt'
  | 'hearYou'
  | 'smile'
  | 'hug'
  | 'rememberLove';

export type WeekendMode = 'family' | 'togetherHome' | 'togetherHotel';

export interface DailyLine {
  text: string;
  /** Limit to certain parts of the day; omit for any time. */
  slots?: Slot[];
}

export interface Note {
  id: string;
  kind: 'letter' | 'note' | 'song' | 'message';
  title: string;
  /** Verbatim text as written. Never rewrite. */
  body: string;
  author: 'admin' | 'partner' | 'both';
  /** When it was written (YYYY-MM-DD), if known. */
  writtenOn?: string;
}

export type PhotoCategory = 'us' | 'funny' | 'moments';

export interface Photo {
  id: string;
  src: string;
  srcSmall: string;
  width: number;
  height: number;
  alt: string;
  /** The admin's caption (funny, not a description). */
  caption: string;
  categories: PhotoCategory[];
  takenOn?: string;
}

export interface TimelineChapter {
  id: string;
  title: string;
  body?: string;
  /** Chat bubbles for chapters that were a conversation. */
  chat?: { from: 'admin' | 'partner'; text: string }[];
  quote?: { text: string; by: string };
  photoId?: string;
  date?: string;
  /** Chapters not written yet. Shown as dashed, never as fact. */
  future?: boolean;
  icon: string;
}

export interface Place {
  id: string;
  name: string;
  detail: string;
  note: string;
  photoIds?: string[];
  /** Where to put the pin on "המפה שלנו". City level only. */
  lat: number;
  lng: number;
}

export interface FuturePlan {
  id: string;
  title: string;
  line: string;
  fromAdminsList?: boolean;
}

export interface OpenWhen {
  id: string;
  label: string;
  emoji: string;
  tint: 'peach' | 'sky' | 'butter' | 'soft';
  kind: 'מכתב' | 'פתק' | 'תזכורת' | 'תמונה' | 'הקלטה';
  body: string;
  photoId?: string;
  /** ISO date. Until then the card shows a lock and no content. */
  unlockAt?: string;
  locked?: boolean;
}

export interface StrengthState {
  mood: Mood;
  label: string;
  emoji: string;
  /** Several responses; one is picked per day, "עוד אחד" cycles. */
  responses: string[];
}

export interface Word {
  word: string;
  he?: string;
  meaning: string;
  example?: string;
}

export interface EasterEgg {
  id: string;
  lines: string[];
}

/** the admin's edits for one content day. Mirrors api/_lib/day.ts. */
export interface DayOverride {
  greeting?: string;
  special?: { title?: string; body: string };
  line?: string;
  note?: { title: string; body: string };
  weekend?: WeekendMode | 'none';
  updatedAt?: string;
}
