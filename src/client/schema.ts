import type {
  DailyLine,
  EasterEgg,
  FuturePlan,
  Note,
  OpenWhen,
  Photo,
  PhotoCategory,
  Place,
  Slot,
  StrengthState,
  TimelineChapter,
  WeekendMode,
  Word,
} from '../content/types';
import type { BookChapter } from '../content/book';
import type { DateEntry } from '../content/dates';
import type { Moment } from '../content/onThisDay';
import type { Surprise } from '../content/surprises';
import type { SkinId, SkinSetting } from '../lib/skins';
import type { SpeciesId } from '../pet/species/types';

/**
 * Everything that makes one couple's site theirs. Each client is a folder in
 * `clients/<slug>/` whose `index.ts` default-exports a `ClientConfig`; the
 * build picks it with the CLIENT env var (vite.config.ts). See
 * docs/NEW-CLIENT.md for the intake questions that fill it.
 *
 * Only `admin`, `partner`, `dates.together` and `features` are required.
 * Every content list is optional: a module with nothing to show hides itself.
 */

export type Gender = 'm' | 'f';

export interface Person {
  /** As the other one calls them, e.g. "נועה". */
  name: string;
  gender: Gender;
  /** International format, e.g. '+972501234567'. Powers "call / WhatsApp" (admin only). */
  phone?: string;
}

/** Site modules. A module also needs content to show (see src/client/index.ts). */
export interface Features {
  /** The envelope intro once per visit. */
  welcome: boolean;
  /** Daily letters/notes from the admin, plus the partner's own writing. */
  letters: boolean;
  /** "Our book": one chapter a morning. */
  book: boolean;
  /** The dates diary page (one entry unlocks a day). */
  dates: boolean;
  /** The partner writes about each meeting; it reaches the admin. */
  journal: boolean;
  /** The timeline ("our story"). */
  story: boolean;
  /** Photo of the day + gallery. */
  gallery: boolean;
  /** Map of places with pins. */
  places: boolean;
  /** Shared Spotify playlist. */
  music: boolean;
  /** "Things we'll still do". */
  future: boolean;
  /** Secret-language dictionary, translator, word of the day. */
  words: boolean;
  /** "Open when…" cards. */
  openWhen: boolean;
  /** "I need strength" sheet. */
  strength: boolean;
  /** Call / WhatsApp the admin (needs admin.phone). */
  contact: boolean;
  /** Promise vouchers to redeem. The first one is the big ticket. */
  vouchers: boolean;
  /** Surprise of the day. */
  surprises: boolean;
  /** Countdown to the next meeting (set from admin). */
  countdown: boolean;
  /** "On this day" chat moments. */
  onThisDay: boolean;
  /** Chat statistics clock. */
  messageClock: boolean;
  /** Mood check + question of the day on the home page. */
  mood: boolean;
  /** Night page: moon, stars, sleep sounds and night games. */
  night: boolean;
  /** Virtual pet with its games room. */
  pet: boolean;
  /** Hidden little friends and the pet peeking from behind cards (needs pet). */
  friends: boolean;
  /** The sock easter egg. */
  sock: boolean;
}

export interface ClientContent {
  /** Rotate daily in the greeting ("בוקר טוב {n}"). */
  nicknames?: string[];
  greetings?: Partial<Record<Slot, { title: string; sub: string }[]>>;
  /** "Today X wants to remind you…" one a day. */
  dailyLines?: DailyLine[];
  dailyQuestions?: string[];
  weekendCopy?: Partial<Record<WeekendMode, { title: string; sub: string }>>;

  /** Released one a day from the partner's first login, in this order. */
  adminNotes?: Note[];
  /** What the partner wrote (shown as theirs). */
  partnerNotes?: Note[];
  togetherNotes?: Note[];

  bookParts?: { n: number; title: string; line: string }[];
  book?: BookChapter[];

  dates?: DateEntry[];

  photos?: PhotoEntry[];

  /** A short paragraph in the partner's own words, shown at the top of the story. */
  storyInWords?: string;
  timeline?: TimelineChapter[];
  /** Extra lines for a chapter in the spotlight. */
  chapterMemories?: Record<string, string[]>;
  /** "Day N together. …" */
  todayLines?: string[];
  places?: Place[];
  futurePlans?: FuturePlan[];

  /** The secret language. */
  words?: Word[];
  /** When the language was born, shown under the dictionary title. */
  wordsOrigin?: string;
  ourWords?: { word: string; meaning: string; origin: string; when: string }[];
  phrases?: { text: string; he: string }[];

  openWhen?: OpenWhen[];
  strength?: StrengthState[];
  surprises?: Surprise[];
  vouchers?: Voucher[];

  /** Tap-to-reveal toasts. Keys used by the site: see src/client/defaults.ts. */
  easterEggs?: Record<string, EasterEgg>;
  /** A two-bubble private joke on the home page, one a day. */
  jokes?: { egg?: string; bubbles: { from: 'admin' | 'partner'; text: string }[] }[];
  /** A tilted sticker next to the greeting that plays an easter egg. */
  homeSticker?: { label: string; egg: string };

  chatStats?: ChatStats;
  /** Big; loaded only when needed. */
  onThisDay?: () => Promise<Record<string, Moment>>;

  /** Pet games: couple trivia and the words game. */
  trivia?: TriviaQuestion[];
  /** [word, clue] for the words game. Hebrew letters only, 2–9 letters. */
  wordGame?: [string, string][];
}

export interface PhotoEntry extends Omit<Photo, 'src' | 'srcSmall' | 'width' | 'height'> {
  /** File name in clients/<slug>/photos/ without extension; `<file>-sm.webp` is the small one. Defaults to id. */
  file?: string;
  width: number;
  height: number;
}

export interface Voucher {
  id: string;
  title: string;
  line: string;
  /** Where the promise came from: a date, a quote. Handwritten at the bottom. */
  from: string;
}

/** [level 1-3, question, the right answer, three wrong ones]. Level 1 = easy. */
export type TriviaQuestion = [1 | 2 | 3, string, string, string, string, string];

export interface ChatStats {
  total: number;
  admin: number;
  partner: number;
  first: string;
  exportedOn: string;
  busiestDay: { date: string; count: number };
  months: Record<string, number>;
  /** Messages by hour of the day, 0–23. */
  hours: number[];
}

export interface ClientConfig {
  /** Folder name, also the backup zip name. */
  slug: string;
  /** Browser title and home-screen name, e.g. "העולם של נועה ויואב". */
  title: string;
  /** Short home-screen name (≤ 12 chars). */
  shortTitle?: string;
  /** The buyer: manages the site from /admin. */
  admin: Person;
  /** The one the site is for. */
  partner: Person;
  timeZone?: string;
  /** Fallback first day of the daily rotation; the real one is the partner's first login. */
  launchDate?: string;
  /** First book chapter opens this morning; one more each morning. */
  bookStart?: string;
  /** The partner's birthday. hebrew: day and month as Intl names it ('Adar', 'Adar II', 'Nisan'…). */
  birthday?: { gregorian: string; hebrewDay?: number; hebrewMonth?: string };
  dates: {
    together: string;
    met?: string;
    /** How they met, for anniversary lines ("מאז שהכרנו בחתונה של רוני"). */
    metLabel?: string;
  };
  /** Shared playlist id from the Spotify share link. */
  spotifyPlaylist?: string;
  /** Weekend banner cycle (optional). anchor = a Saturday that was cycle[0]. */
  weekend?: { anchor: string; cycle: WeekendMode[] };
  /** Default look; the admin can change it. 'auto' = a different one every day. */
  skin?: SkinSetting;
  /** Which looks are in the daily rotation. Defaults to all. */
  skins?: SkinId[];
  features: Features;
  pet?: {
    species: SpeciesId;
    /** Suggested name on the adoption screen. */
    suggestedName?: string;
  };
  /** Small round face photos (imported images) for the night games' sheep. */
  faces?: { admin?: string; partner?: string };
  /** A drawing of the two of them for the top of the home page (imported image). */
  usDrawing?: string;
  content: ClientContent;
}

export type { PhotoCategory };
