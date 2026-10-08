export type SpeciesId = 'guineaPig' | 'cat' | 'dog' | 'bunny';

/**
 * What changes from one animal to another. The drawing (PetSvg), the game
 * engine and the rooms are shared; only these words, sounds and a few foods
 * differ. All Hebrew here is about the pet (male), and the site follows it.
 */
export interface Species {
  id: SpeciesId;
  /** "שרקן", "חתול"… */
  name: string;
  /** "שרקנים" */
  plural: string;
  /** "שרקן קטן מציץ" style: a small one. */
  small: string;
  /** What it says when happy: "ויק ויק!" */
  sound: string;
  /** Its happy dance: "קופץ פופקורן" */
  happyMove: string;
  /** Its coin: an emoji and a name ("גרעיני חמנייה"). */
  coin: string;
  coinName: string;
  /** The always-free staple food (food id 'hay'). */
  staple: { name: string; emoji: string };
  /** Replaces the default fruit-and-veg menu (ids are stable; names/emoji change). */
  foods?: Record<string, { name: string; emoji: string }>;
  /** Little true facts, used in toasts and trivia. */
  facts: string[];
  /** A suggested name on the adoption screen. */
  names: string[];
}
