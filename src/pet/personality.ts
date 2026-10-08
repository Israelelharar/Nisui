import { foodById } from './catalog';
import { species } from './species';
import { p as pp } from '../lib/he';
import type { Notice, PetState } from './engine';

/**
 * Every pet is born with his own personality, seeded from the moment he was
 * adopted: a favorite food, one he can't stand, whether he's an early bird or
 * a night owl, how he feels about baths, a favorite game and one big trait.
 * Nobody gets told any of it. It's found out by living with him, and he
 * drops hints.
 */
export type TraitKey = 'favorite' | 'dislike' | 'clock' | 'bath' | 'game' | 'trait';
export type Trait = 'cuddly' | 'foodie' | 'playful' | 'dreamer';

export interface Personality {
  favorite: string;
  dislike: string;
  clock: 'early' | 'owl';
  bath: 'loves' | 'hates';
  game: 'catch' | 'memory' | 'peek' | 'simon';
  trait: Trait;
}

const FAVS = ['lettuce', 'cucumber', 'parsley', 'carrot', 'pepper', 'corn', 'apple', 'strawberry', 'watermelon'];
const GAMES = ['catch', 'memory', 'peek', 'simon'] as const;
const TRAITS: Trait[] = ['cuddly', 'foodie', 'playful', 'dreamer'];

function rng(seed: number) {
  let h = seed >>> 0 || 1;
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function personalityOf(s: Pick<PetState, 'adoptedAt'>): Personality {
  const r = rng(Math.floor(s.adoptedAt / 1000));
  const favorite = FAVS[Math.floor(r() * FAVS.length)];
  const rest = FAVS.filter((f) => f !== favorite);
  return {
    favorite,
    dislike: rest[Math.floor(r() * rest.length)],
    clock: r() < 0.5 ? 'early' : 'owl',
    bath: r() < 0.55 ? 'loves' : 'hates',
    game: GAMES[Math.floor(r() * GAMES.length)],
    trait: TRAITS[Math.floor(r() * TRAITS.length)],
  };
}

export const traitInfo: Record<Trait, { name: string; desc: string }> = {
  cuddly: { name: 'חיבוקי', desc: 'ליטוף שווה אצלו כפול' },
  foodie: { name: 'גורמה', desc: 'נהיה רעב מהר, אבל כל ביס משמח אותו יותר' },
  playful: { name: 'שובב', desc: 'משחקים משמחים אותו במיוחד' },
  dreamer: { name: 'חולמני', desc: 'אוהב לישון, ומתמלא אנרגיה מהר' },
};

const gameNames = { catch: 'לתפוס אוכל', memory: 'זיכרון', peek: 'קוקו', simon: 'סיימון' } as const;

/** What the card in "מה גיליתי עליו" says, once a thing is known. */
export function describe(p: Personality, key: TraitKey): string {
  switch (key) {
    case 'favorite':
      return `${foodById(p.favorite)!.emoji} ${foodById(p.favorite)!.name}`;
    case 'dislike':
      return `${foodById(p.dislike)!.emoji} ${foodById(p.dislike)!.name}`;
    case 'clock':
      return p.clock === 'early' ? 'ציפור בוקר' : 'ינשוף לילה';
    case 'bath':
      return p.bath === 'loves' ? 'מת על אמבטיות' : 'שונא אמבטיות (אבל מתרחץ)';
    case 'game':
      return gameNames[p.game];
    case 'trait':
      return traitInfo[p.trait].name;
  }
}

export const traitSlots: { key: TraitKey; title: string; how: string }[] = [
  { key: 'favorite', title: 'המאכל האהוב', how: 'לנסות להאכיל אותו דברים שונים. הוא גם רומז' },
  { key: 'dislike', title: 'מה הוא לא סובל', how: 'יתגלה בדרך הקשה' },
  { key: 'clock', title: 'בוקר או לילה', how: 'לבקר אותו מוקדם בבוקר או מאוחר בלילה' },
  { key: 'bath', title: 'אמבטיות', how: 'לרחוץ אותו פעם אחת' },
  { key: 'game', title: 'המשחק האהוב', how: 'לשחק איתו בכל המשחקים' },
  { key: 'trait', title: 'האופי שלו', how: 'מתגלה אחרי שמכירים אותו קצת' },
];

/** He hints at his favorite, in riddles. */
const foodHints: Record<string, string> = {
  lettuce: 'חלמתי על משהו ירוק ופריך שיש לו המון שכבות…',
  cucumber: 'בא לי משהו ירוק, ארוך ומלא מים 💭',
  parsley: 'יש עלה קטן שמריח כמו גן ירק… אני חושב עליו כל הזמן',
  carrot: 'מה כתום, ארוך ועושה קראנץ׳? (רמז: אני רוצה אותו)',
  pepper: 'משהו אדום, פריך ומלא ויטמינים… לא שאני רומז',
  corn: 'חלמתי על משהו צהוב עם המון גרגרים קטנים 🌝',
  apple: `עגול, מתוק, ויש לו גבעול קטן למעלה… ${pp('מכיר', 'מכירה')}?`,
  strawberry: 'חלמתי על משהו אדום וקטן עם נקודות 💭',
  watermelon: 'ירוק מבחוץ, אדום מבפנים, ויש בו גרעינים שחורים 😋',
};

const clockLines = {
  earlyMorning: ['בוקר!!! קמתי לפני השמש ☀️', `הבוקר זה הזמן הכי טוב ביום. ${pp('מסכים', 'מסכימה')}?`],
  earlyNight: ['פהההה… כבר מאוחר בשבילי 🥱', `${species.plural} של בוקר הולכים לישון מוקדם…`],
  owlMorning: ['עוד חמש דקות… 😪', 'בוקר? מה זה בוקר?'],
  owlNight: ['הלילה רק מתחיל! 🌙', 'בלילה אני הכי ער בעולם ✨'],
};

/** A line that fits his personality and the hour, or null to use a regular one. */
export function personalLine(s: PetState, hour: number): string | null {
  const p = personalityOf(s);
  const known = s.known ?? [];
  const morning = hour >= 6 && hour < 10;
  const night = hour >= 22 || hour < 2;
  const roll = Math.random();
  if (!known.includes('favorite') && roll < 0.3) {
    // An animal with its own menu gets a first-letter riddle instead of the veggie ones.
    const name = foodById(p.favorite)?.name ?? '';
    return species.foods?.[p.favorite] ? `חלמתי על משהו טעים שמתחיל ב־${name[0]}… 💭` : foodHints[p.favorite];
  }
  if (morning && roll < 0.6) return pickOne(p.clock === 'early' ? clockLines.earlyMorning : clockLines.owlMorning);
  if (night && roll < 0.6) return pickOne(p.clock === 'early' ? clockLines.earlyNight : clockLines.owlNight);
  return null;
}
const pickOne = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function learn(s: PetState, key: TraitKey, out: Notice[], text: string) {
  s.known ??= [];
  if (s.known.includes(key)) return false;
  s.known.push(key);
  out.push({ text: `🔎 גילית: ${text}`, big: true });
  return true;
}

/** Feeding: the favorite delights him, the hated one gets a sniff and a turned back. Returns how he took it. */
export function tasteOf(s: PetState, foodId: string, out: Notice[]): 'love' | 'hate' | null {
  const p = personalityOf(s);
  if (foodId === p.favorite) {
    s.stats.happy = Math.min(100, s.stats.happy + 12);
    learn(s, 'favorite', out, `${s.name} מת על ${foodById(foodId)!.name}!`);
    return 'love';
  }
  if (foodId === p.dislike) {
    s.stats.happy = Math.max(0, s.stats.happy - 4);
    s.stats.hunger = Math.max(0, s.stats.hunger - foodById(foodId)!.hunger / 2);
    learn(s, 'dislike', out, `${s.name} לא סובל ${foodById(foodId)!.name} 🙅`);
    return 'hate';
  }
  return null;
}

export function bathMood(s: PetState, out: Notice[]) {
  const p = personalityOf(s);
  s.stats.happy = Math.max(0, Math.min(100, s.stats.happy + (p.bath === 'loves' ? 8 : -3)));
  learn(s, 'bath', out, p.bath === 'loves' ? `${s.name} מת על אמבטיות 🛁` : `${s.name} שונא אמבטיות (אבל נהיה נקי) 😤`);
  return p.bath;
}

export function gameMood(s: PetState, game: string, out: Notice[]) {
  const p = personalityOf(s);
  if (game !== p.game) return false;
  s.stats.happy = Math.min(100, s.stats.happy + 8);
  learn(s, 'game', out, `המשחק האהוב על ${s.name} הוא ${gameNames[p.game]} 🎮`);
  return true;
}

export function visitHour(s: PetState, hour: number, out: Notice[]) {
  const p = personalityOf(s);
  const morning = hour >= 6 && hour < 10;
  const night = hour >= 22 || hour < 2;
  if (morning || night) learn(s, 'clock', out, `${s.name} הוא ${p.clock === 'early' ? 'ציפור בוקר ☀️' : 'ינשוף לילה 🌙'}`);
}

/** The big trait shows itself after some time together. */
export function revealTrait(s: PetState, out: Notice[]) {
  const c = s.counters;
  const time = (c.pets ?? 0) >= 25 || (c.feeds ?? 0) >= 12 || (c.games ?? 0) >= 4 || (c.naps ?? 0) >= 3;
  if (time) learn(s, 'trait', out, `${s.name} ${traitInfo[personalityOf(s).trait].name}. ${traitInfo[personalityOf(s).trait].desc}`);
}

/** Trait multipliers used by the engine. */
export function traitOf(s: PetState) {
  return personalityOf(s).trait;
}
