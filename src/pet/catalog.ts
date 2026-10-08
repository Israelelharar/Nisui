import { species } from './species';
import { A, P, a, p } from '../lib/he';

/**
 * Everything the pet can eat, wear and live in, plus the achievements,
 * daily tasks and lines. Prices are in the species' coin (🌻 for a guinea pig).
 */

export const COIN = species.coin;

export type Pattern = 'cap' | 'solid' | 'patches' | 'spots' | 'gradient' | 'stars' | 'hearts' | 'shine' | 'rainbow' | 'stripes' | 'rosettes' | 'sprinkles';

/** The living effect a legendary skin carries (drawn and animated in PigSvg). */
export type Fx = 'holo' | 'fire' | 'nebula' | 'diamond' | 'love';

export interface Skin {
  id: string;
  name: string;
  price: number;
  /** Free pick on adoption. */
  starter?: boolean;
  /** Earned on the year journey, not sold. */
  exclusive?: boolean;
  /** One of the five coveted pigs: locked until its quest is done (see quests.ts). */
  legend?: boolean;
  fx?: Fx;
  fur: string;
  /** Second fur color: patches, spots, gradient end. */
  patch: string;
  belly: string;
  ear: string;
  pattern: Pattern;
}

export const skins: Skin[] = [
  { id: 'classic', name: 'ג׳ינג׳י קלאסי', price: 0, starter: true, fur: '#E8913F', patch: '#5A3626', belly: '#FFF6EA', ear: '#6A4230', pattern: 'cap' },
  { id: 'choco', name: 'שוקולד', price: 0, starter: true, fur: '#7A4A2E', patch: '#5E3720', belly: '#EBD6BF', ear: '#5A321C', pattern: 'solid' },
  { id: 'cream', name: 'וניל', price: 0, starter: true, fur: '#F3DDBD', patch: '#E9C79A', belly: '#FFFFFF', ear: '#D9B58A', pattern: 'solid' },
  { id: 'tricolor', name: 'שלושה צבעים', price: 120, fur: '#F0A35E', patch: '#3B2A25', belly: '#FFF8EE', ear: '#3B2A25', pattern: 'patches' },
  { id: 'gray', name: 'אפרפר', price: 100, fur: '#A9A3A6', patch: '#8B8487', belly: '#F4F1F2', ear: '#7A7376', pattern: 'solid' },
  { id: 'oreo', name: 'אוריאו', price: 150, fur: '#FBF9F7', patch: '#26211F', belly: '#FFFFFF', ear: '#1F1B1C', pattern: 'cap' },
  { id: 'cloud', name: 'ענן', price: 200, fur: '#FFFFFF', patch: '#EEF2F8', belly: '#FFFFFF', ear: '#F2C9D1', pattern: 'solid' },
  { id: 'dalmatian', name: 'דלמטי', price: 300, fur: '#FFFDF9', patch: '#2E2627', belly: '#FFFFFF', ear: '#2E2627', pattern: 'spots' },
  { id: 'strawberry', name: 'תותית', price: 250, fur: '#F59AB8', patch: '#FFF1A6', belly: '#FFE3EC', ear: '#E06C93', pattern: 'spots' },
  { id: 'mint', name: 'מנטה', price: 250, fur: '#9EDDC4', patch: '#7CCBAE', belly: '#F1FFF8', ear: '#62B595', pattern: 'solid' },
  { id: 'lavender', name: 'לבנדר', price: 250, fur: '#BFA8E8', patch: '#A58ADB', belly: '#F6F0FF', ear: '#8E6FCC', pattern: 'solid' },
  { id: 'sky', name: 'כחול שמיים', price: 280, fur: '#9CC7F2', patch: '#3F6FB5', belly: '#F2F8FF', ear: '#5E8FD1', pattern: 'patches' },
  { id: 'sunset', name: 'שקיעה בים', price: 700, fur: '#FF9A62', patch: '#C2385A', belly: '#FFF1E2', ear: '#B8456A', pattern: 'gradient' },
  { id: 'golden', name: 'זהב', price: 600, fur: '#F2C14E', patch: '#D9A955', belly: '#FFF6D6', ear: '#B9862A', pattern: 'shine' },
  { id: 'rainbow', name: 'קשת בענן', price: 800, fur: '#FF8FA3', patch: '#8FD3FF', belly: '#FFFFFF', ear: '#C77DFF', pattern: 'rainbow' },
  { id: 'galaxy', name: 'גלקסיה', price: 1000, fur: '#2B1F4E', patch: '#6B3FA0', belly: '#3E2C6E', ear: '#1B1336', pattern: 'stars' },
  { id: 'love', name: 'מאוהב', price: 900, fur: '#F7C6D3', patch: '#C2385A', belly: '#FFF0F4', ear: '#C2385A', pattern: 'hearts' },
  // The second wave: twenty more, in colors that make you want them.
  { id: 'peach', name: 'אפרסק', price: 160, fur: '#FFC4A3', patch: '#F7A982', belly: '#FFF4EC', ear: '#E8957A', pattern: 'solid' },
  { id: 'caramel', name: 'קרמל מלוח', price: 180, fur: '#F2D3A8', patch: '#B9733F', belly: '#FFF8EF', ear: '#9A5A30', pattern: 'cap' },
  { id: 'cinnamon', name: 'קינמון', price: 200, fur: '#F7E6CF', patch: '#C7743D', belly: '#FFFFFF', ear: '#A85C2C', pattern: 'patches' },
  { id: 'honey', name: 'דבש', price: 220, fur: '#FFD27A', patch: '#E59A2F', belly: '#FFF6DD', ear: '#C7802A', pattern: 'gradient' },
  { id: 'bubblegum', name: 'מסטיק', price: 240, fur: '#FF9ECF', patch: '#FF7DBA', belly: '#FFEAF5', ear: '#E86AA6', pattern: 'solid' },
  { id: 'matcha', name: 'מאצ׳ה לאטה', price: 260, fur: '#C9DDA0', patch: '#8DB360', belly: '#FBFFF0', ear: '#7FA455', pattern: 'cap' },
  { id: 'lemonade', name: 'לימונדה', price: 260, fur: '#FFF0A0', patch: '#FFC93C', belly: '#FFFDF0', ear: '#E8B12A', pattern: 'spots' },
  { id: 'coral', name: 'אלמוג', price: 300, fur: '#FF8C7A', patch: '#FFD3C4', belly: '#FFF5F1', ear: '#E2604E', pattern: 'patches' },
  { id: 'tiger', name: 'טיגריס', price: 320, fur: '#F59B42', patch: '#3A2418', belly: '#FFF5E6', ear: '#3A2418', pattern: 'stripes' },
  { id: 'zebra', name: 'זברה', price: 340, fur: '#FFFFFF', patch: '#26201F', belly: '#FFFFFF', ear: '#26201F', pattern: 'stripes' },
  { id: 'leopard', name: 'נמרה', price: 360, fur: '#E9B85F', patch: '#5B3A1E', belly: '#FFF6E0', ear: '#5B3A1E', pattern: 'rosettes' },
  { id: 'donut', name: 'דונאט', price: 380, fur: '#FFB3CF', patch: '#FF7DAA', belly: '#F3D2A2', ear: '#C77A50', pattern: 'sprinkles' },
  { id: 'cottoncandy', name: 'צמר גפן מתוק', price: 380, fur: '#FFC1E3', patch: '#A8D8FF', belly: '#FFFFFF', ear: '#F29BC8', pattern: 'gradient' },
  { id: 'ocean', name: 'אוקיינוס', price: 400, fur: '#8FE3F0', patch: '#2F6FBF', belly: '#F0FCFF', ear: '#2F6FBF', pattern: 'gradient' },
  { id: 'sakura', name: 'סאקורה', price: 420, fur: '#FFE1EA', patch: '#F79AB6', belly: '#FFFFFF', ear: '#F07FA3', pattern: 'hearts' },
  { id: 'peacock', name: 'טווס', price: 450, fur: '#2BB3A8', patch: '#5B3FB0', belly: '#E8FFF9', ear: '#2D2A7A', pattern: 'gradient' },
  { id: 'midnight', name: 'חצות', price: 520, fur: '#172447', patch: '#3A5BA8', belly: '#2A3A6B', ear: '#0E1730', pattern: 'stars' },
  { id: 'aurora', name: 'זוהר צפוני', price: 650, fur: '#12304A', patch: '#35D3A0', belly: '#1F4A5E', ear: '#0A1E30', pattern: 'stars' },
  { id: 'silver', name: 'כסף', price: 700, fur: '#D9DDE3', patch: '#9BA3AE', belly: '#FFFFFF', ear: '#8A929C', pattern: 'shine' },
  { id: 'rosegold', name: 'רוז גולד', price: 750, fur: '#F4B6A6', patch: '#C98476', belly: '#FFF1EC', ear: '#B66A5E', pattern: 'shine' },
  // The five coveted ones: alive, and opened only by their quests.
  { id: 'unicorn', name: 'חד־קרן', price: 1500, legend: true, fx: 'holo', fur: '#FFF8FC', patch: '#E6D4FF', belly: '#FFFFFF', ear: '#F3B6D9', pattern: 'solid' },
  { id: 'nebula', name: 'ערפילית', price: 1800, legend: true, fx: 'nebula', fur: '#241A55', patch: '#B04BC9', belly: '#3C2A7A', ear: '#150F33', pattern: 'stars' },
  { id: 'phoenix', name: 'עוף החול', price: 2000, legend: true, fx: 'fire', fur: '#FF8A3D', patch: '#D7263D', belly: '#FFE7B8', ear: '#B3122E', pattern: 'gradient' },
  { id: 'diamond', name: 'יהלום', price: 2500, legend: true, fx: 'diamond', fur: '#DDF4FF', patch: '#9FD8F5', belly: '#FFFFFF', ear: '#8CC3E6', pattern: 'shine' },
  { id: 'ours', name: 'שלנו', price: 3000, legend: true, fx: 'love', fur: '#F9C9C9', patch: '#C2385A', belly: '#FFF2F2', ear: '#C2385A', pattern: 'hearts' },
  { id: 'forever', name: 'לב של זהב', price: 0, exclusive: true, fur: '#FFD978', patch: '#C2385A', belly: '#FFF8E1', ear: '#C2385A', pattern: 'hearts' },
];

export type Slot = 'head' | 'face' | 'neck' | 'room';

export interface Item {
  id: string;
  slot: Slot;
  name: string;
  emoji: string;
  price: number;
  exclusive?: boolean;
}

export const items: Item[] = [
  // On the head
  { id: 'bow', slot: 'head', name: 'סרט ורוד', emoji: '🎀', price: 60 },
  { id: 'party', slot: 'head', name: 'כובע מסיבה', emoji: '🥳', price: 80 },
  { id: 'beanie', slot: 'head', name: 'כובע גרב', emoji: '🧶', price: 120 },
  { id: 'flowers', slot: 'head', name: 'זר פרחים', emoji: '🌸', price: 150 },
  { id: 'chef', slot: 'head', name: 'כובע שף', emoji: '👨‍🍳', price: 180 },
  { id: 'bunny', slot: 'head', name: 'אוזני ארנב', emoji: '🐰', price: 200 },
  { id: 'witch', slot: 'head', name: 'כובע מכשפה', emoji: '🧙', price: 200 },
  { id: 'strawhat', slot: 'head', name: 'כובע תות', emoji: '🍓', price: 220 },
  { id: 'cowboy', slot: 'head', name: 'כובע בוקרים', emoji: '🤠', price: 250 },
  { id: 'headphones', slot: 'head', name: 'אוזניות', emoji: '🎧', price: 260 },
  { id: 'grad', slot: 'head', name: 'כובע סיום', emoji: '🎓', price: 300 },
  { id: 'halo', slot: 'head', name: 'הילה של מלאך', emoji: '😇', price: 350 },
  { id: 'crown', slot: 'head', name: 'כתר', emoji: '👑', price: 400 },
  { id: 'bdayhat', slot: 'head', name: 'כובע יום הולדת', emoji: '🎂', price: 0, exclusive: true },
  { id: 'luckycrown', slot: 'head', name: 'כתר המזל', emoji: '👑', price: 0, exclusive: true },
  // On the face
  { id: 'mustache', slot: 'face', name: 'שפם', emoji: '🥸', price: 60 },
  { id: 'round', slot: 'face', name: 'משקפיים עגולים', emoji: '👓', price: 100 },
  { id: 'sun', slot: 'face', name: 'משקפי שמש', emoji: '🕶️', price: 120 },
  { id: 'hearts', slot: 'face', name: 'משקפי לבבות', emoji: '😍', price: 150 },
  { id: 'stars', slot: 'face', name: 'מדבקות כוכבים', emoji: '✨', price: 90 },
  // Around the neck
  { id: 'bowtie', slot: 'neck', name: 'פפיון', emoji: '🎩', price: 80 },
  { id: 'bell', slot: 'neck', name: 'קולר פעמון', emoji: '🔔', price: 90 },
  { id: 'scarf', slot: 'neck', name: 'צעיף', emoji: '🧣', price: 120 },
  { id: 'heartchain', slot: 'neck', name: 'שרשרת לב', emoji: '💗', price: 200 },
  { id: 'pearls', slot: 'neck', name: 'שרשרת פנינים', emoji: '🦪', price: 320 },
  // Rooms
  { id: 'cozy', slot: 'room', name: 'חדר חמים', emoji: '🏠', price: 0 },
  { id: 'garden', slot: 'room', name: 'גינה', emoji: '🌷', price: 200 },
  { id: 'beach', slot: 'room', name: 'חוף הים', emoji: '🏖️', price: 300 },
  { id: 'night', slot: 'room', name: 'לילה מכוכב', emoji: '🌙', price: 300 },
  { id: 'snow', slot: 'room', name: 'שלג', emoji: '⛄', price: 350 },
  { id: 'cafe', slot: 'room', name: 'בית קפה', emoji: '🧋', price: 400 },
  { id: 'candy', slot: 'room', name: 'ארץ הממתקים', emoji: '🍭', price: 400 },
  { id: 'train', slot: 'room', name: 'ברכבת', emoji: '🚆', price: 450 },
  { id: 'slide', slot: 'room', name: 'המגלשה שלנו', emoji: '🛝', price: 500 },
  { id: 'castle', slot: 'room', name: 'ארמון', emoji: '🏰', price: 0, exclusive: true },
];

export const itemById = (id: string | undefined) => items.find((i) => i.id === id);
export const skinById = (id: string | undefined) => skins.find((s) => s.id === id) ?? skins[0];

export interface Food {
  id: string;
  name: string;
  emoji: string;
  /** 0 = free and endless. */
  price: number;
  hunger: number;
  happy: number;
  health: number;
  note?: string;
  /** A potion from the kitchen's potion corner: what it does, and the color of what's in the bottle. */
  potion?: PotionFx;
  color?: string;
}

export type PotionFx = 'full' | 'energy' | 'love' | 'giant' | 'tiny' | 'rainbow' | 'ghost' | 'float';
/** How long a potion's spell lasts (ms); the ones that fill a need also sparkle for a while. */
export const POTION_MS: Record<PotionFx, number> = {
  full: 20_000,
  energy: 30_000,
  love: 45_000,
  giant: 45_000,
  tiny: 45_000,
  rainbow: 90_000,
  ghost: 40_000,
  float: 30_000,
};

export const foods: Food[] = [
  { id: 'hay', name: 'חציר', emoji: '🌾', price: 0, hunger: 12, happy: 1, health: 1, note: 'תמיד יש, בחינם' },
  { id: 'lettuce', name: 'חסה', emoji: '🥬', price: 5, hunger: 18, happy: 4, health: 2 },
  { id: 'cucumber', name: 'מלפפון', emoji: '🥒', price: 6, hunger: 16, happy: 5, health: 2 },
  { id: 'parsley', name: 'פטרוזיליה', emoji: '🌿', price: 7, hunger: 14, happy: 4, health: 5, note: 'מלא ויטמין C' },
  { id: 'carrot', name: 'גזר', emoji: '🥕', price: 8, hunger: 20, happy: 8, health: 2 },
  { id: 'pepper', name: 'פלפל אדום', emoji: '🫑', price: 10, hunger: 15, happy: 6, health: 8, note: 'הכי בריא שיש' },
  { id: 'corn', name: 'תירס', emoji: '🌽', price: 12, hunger: 24, happy: 8, health: 1 },
  { id: 'apple', name: 'תפוח', emoji: '🍎', price: 12, hunger: 18, happy: 10, health: 3 },
  { id: 'strawberry', name: 'תות', emoji: '🍓', price: 15, hunger: 12, happy: 16, health: 3 },
  { id: 'watermelon', name: 'אבטיח', emoji: '🍉', price: 18, hunger: 16, happy: 18, health: 2 },
  { id: 'cake', name: `עוגת ${species.plural}`, emoji: '🎂', price: 60, hunger: 35, happy: 40, health: 0, note: 'לימים מיוחדים' },
  { id: 'vitamin', name: 'ויטמינים', emoji: '💊', price: 25, hunger: 0, happy: 0, health: 35, note: 'כשהוא חולה' },
  // the potion corner
  { id: 'p-full', name: 'שיקוי רעב', emoji: '🧪', price: 30, hunger: 0, happy: 0, health: 0, potion: 'full', color: '#FF9A3C', note: 'מרוקן לו את הבטן, כדי להאכיל אותו עוד' },
  { id: 'p-energy', name: 'שיקוי ברק', emoji: '🧪', price: 45, hunger: 0, happy: 0, health: 0, potion: 'energy', color: '#FFD23F', note: 'אנרגיה 100% וניצוצות' },
  { id: 'p-love', name: 'שיקוי אהבה', emoji: '🧪', price: 50, hunger: 0, happy: 0, health: 0, potion: 'love', color: '#FF5C8A', note: 'שמחה 100% ולבבות באוויר' },
  { id: 'p-giant', name: 'שיקוי ענק', emoji: '🧪', price: 35, hunger: 0, happy: 0, health: 0, potion: 'giant', color: '#6CD36B', note: 'נהיה ענק לכמה רגעים' },
  { id: 'p-tiny', name: 'שיקוי זעיר', emoji: '🧪', price: 35, hunger: 0, happy: 0, health: 0, potion: 'tiny', color: '#45B8F2', note: 'נהיה קטנטן לכמה רגעים' },
  { id: 'p-rainbow', name: 'שיקוי קשת', emoji: '🧪', price: 40, hunger: 0, happy: 0, health: 0, potion: 'rainbow', color: '#A98BFF', note: 'מחליף צבעים דקה וחצי' },
  { id: 'p-ghost', name: 'שיקוי רוח', emoji: '🧪', price: 40, hunger: 0, happy: 0, health: 0, potion: 'ghost', color: '#BFE6F2', note: 'שקוף ומרחף כמו רוח רפאים' },
  { id: 'p-float', name: 'שיקוי הליום', emoji: '🧪', price: 40, hunger: 0, happy: 0, health: 0, potion: 'float', color: '#F7A8C4', note: 'עף למעלה ומתנדנד באוויר' },
];

// The menu follows the animal: same ids and prices, its own names and emoji.
for (const f of foods) {
  if (f.id === 'hay') Object.assign(f, species.staple);
  const swap = species.foods?.[f.id];
  if (swap) Object.assign(f, { note: undefined }, swap);
}

export const foodById = (id: string) => foods.find((f) => f.id === id);
/** A food's name for this animal, for lines like "anyone with a carrot?". */
export function foodName(id: string) {
  return foodById(id)?.name ?? id;
}

export interface Room {
  bg: string;
  floor: string;
  decor: { e: string; x: number; y: number; s: number; r?: number }[];
  dark?: boolean;
}

/** Background, floor and emoji decor per room (x/y in % of the room box). */
export const rooms: Record<string, Room> = {
  cozy: {
    bg: 'linear-gradient(180deg,#FDE3D3 0%,#FBEFC9 100%)',
    floor: '#E9C9A6',
    decor: [
      { e: '🖼️', x: 12, y: 14, s: 34 },
      { e: '🪴', x: 84, y: 50, s: 38 },
      { e: '🏠', x: 10, y: 55, s: 44 },
      { e: '🧸', x: 88, y: 18, s: 26, r: 10 },
    ],
  },
  garden: {
    bg: 'linear-gradient(180deg,#CDEBFF 0%,#EAF8E3 70%)',
    floor: '#9FD58C',
    decor: [
      { e: '☀️', x: 85, y: 10, s: 38 },
      { e: '🌷', x: 8, y: 62, s: 30 },
      { e: '🌻', x: 88, y: 58, s: 36 },
      { e: '🦋', x: 20, y: 20, s: 24, r: -12 },
      { e: '🌼', x: 75, y: 72, s: 22 },
    ],
  },
  beach: {
    bg: 'linear-gradient(180deg,#9FD6F7 0%,#DDF1FF 55%,#9ED3E8 70%)',
    floor: '#F3D9A4',
    decor: [
      { e: '🌞', x: 84, y: 10, s: 40 },
      { e: '⛱️', x: 12, y: 50, s: 46 },
      { e: '🐚', x: 86, y: 74, s: 22 },
      { e: '⛵', x: 30, y: 30, s: 24 },
    ],
  },
  night: {
    bg: 'linear-gradient(180deg,#1C1440 0%,#3B2A6B 100%)',
    floor: '#2A2050',
    dark: true,
    decor: [
      { e: '🌙', x: 82, y: 12, s: 40 },
      { e: '⭐', x: 16, y: 16, s: 18 },
      { e: '✨', x: 40, y: 8, s: 20 },
      { e: '⭐', x: 62, y: 26, s: 14 },
      { e: '🔭', x: 10, y: 56, s: 36 },
    ],
  },
  snow: {
    bg: 'linear-gradient(180deg,#DCE9F7 0%,#F7FBFF 100%)',
    floor: '#FFFFFF',
    decor: [
      { e: '❄️', x: 14, y: 12, s: 22 },
      { e: '❄️', x: 70, y: 20, s: 16 },
      { e: '⛄', x: 86, y: 52, s: 46 },
      { e: '🌲', x: 8, y: 48, s: 44 },
      { e: '❄️', x: 44, y: 6, s: 14 },
    ],
  },
  cafe: {
    bg: 'linear-gradient(180deg,#F3E3D3 0%,#E8CDB3 100%)',
    floor: '#B98A64',
    decor: [
      { e: '🧋', x: 86, y: 52, s: 38 },
      { e: '☕', x: 12, y: 58, s: 30 },
      { e: '🥐', x: 22, y: 20, s: 26 },
      { e: '🪟', x: 80, y: 14, s: 38 },
    ],
  },
  candy: {
    bg: 'linear-gradient(180deg,#FFD6EC 0%,#E7D9FF 100%)',
    floor: '#FFB3D1',
    decor: [
      { e: '🍭', x: 10, y: 50, s: 44 },
      { e: '🧁', x: 86, y: 56, s: 34 },
      { e: '🍬', x: 22, y: 14, s: 24, r: 20 },
      { e: '🍩', x: 78, y: 14, s: 28 },
      { e: '🍫', x: 50, y: 6, s: 18 },
    ],
  },
  train: {
    bg: 'linear-gradient(180deg,#8EC5E8 0%,#CFE8D0 60%)',
    floor: '#7E8BA3',
    decor: [
      { e: '🪟', x: 14, y: 16, s: 40 },
      { e: '🪟', x: 50, y: 16, s: 40 },
      { e: '🪟', x: 86, y: 16, s: 40 },
      { e: '🧳', x: 10, y: 60, s: 32 },
      { e: '🎫', x: 88, y: 66, s: 24, r: -15 },
    ],
  },
  slide: {
    bg: 'linear-gradient(180deg,#BFE3FF 0%,#FFF1D6 80%)',
    floor: '#C9E6A8',
    decor: [
      { e: '🛝', x: 12, y: 46, s: 54 },
      { e: '💙', x: 22, y: 18, s: 24 },
      { e: '🌳', x: 88, y: 44, s: 48 },
      { e: '☁️', x: 62, y: 10, s: 30 },
    ],
  },
  castle: {
    bg: 'linear-gradient(180deg,#F6D9FF 0%,#FFE9C2 100%)',
    floor: '#E7C27D',
    decor: [
      { e: '🏰', x: 12, y: 40, s: 54 },
      { e: '👑', x: 84, y: 14, s: 28 },
      { e: '💎', x: 88, y: 62, s: 26 },
      { e: '🕯️', x: 30, y: 16, s: 22 },
    ],
  },
};

/**
 * How big he is, smoothly, day by day: a small pup on day one, full size at a
 * year. `size` is the drawing scale, `grown` his proportions (a pup is mostly
 * head), `cm` his length for the menu.
 */
export function growth(days: number) {
  const x = Math.min(1, Math.max(0, days / 365));
  const ease = 1 - (1 - x) * (1 - x);
  return { size: 0.68 + 0.36 * ease, grown: Math.min(1, days / 180), cm: Math.round(9 + 16 * ease) };
}

/** Life stages over the year. `scale` makes the pig grow. */
export const stages = [
  { from: 0, name: 'גור קטנטן', scale: 0.7 },
  { from: 7, name: 'גור', scale: 0.78 },
  { from: 30, name: `${species.name} צעיר`, scale: 0.86 },
  { from: 90, name: 'מתבגר', scale: 0.93 },
  { from: 180, name: `${species.name} בוגר`, scale: 1 },
  { from: 365, name: `${species.name} בן שנה`, scale: 1.04 },
];

export interface Milestone {
  day: number;
  title: string;
  coins: number;
  /** Exclusive item or skin it unlocks. */
  unlock?: string;
}

/** The year journey: one milestone at a time, claimed on the day he reaches it. */
export const milestones: Milestone[] = [
  { day: 1, title: 'יום ראשון בבית', coins: 30 },
  { day: 3, title: 'כבר מכיר אותך', coins: 40 },
  { day: 7, title: 'שבוע שלם ביחד', coins: 80 },
  { day: 14, title: 'שבועיים', coins: 100 },
  { day: 30, title: 'חודש ראשון!', coins: 150, unlock: 'bdayhat' },
  { day: 50, title: '50 ימים', coins: 150 },
  { day: 60, title: 'חודשיים', coins: 150 },
  { day: 90, title: 'שלושה חודשים, כבר מתבגר', coins: 200 },
  { day: 100, title: `100 ימים של ${species.name}`, coins: 300, unlock: 'castle' },
  { day: 120, title: 'ארבעה חודשים', coins: 200 },
  { day: 150, title: 'חמישה חודשים', coins: 200 },
  { day: 180, title: `חצי שנה! ${species.name} בוגר`, coins: 400 },
  { day: 200, title: '200 ימים', coins: 250 },
  { day: 240, title: 'שמונה חודשים', coins: 250 },
  { day: 270, title: 'תשעה חודשים', coins: 300 },
  { day: 300, title: '300 ימים', coins: 350 },
  { day: 330, title: 'כמעט שנה', coins: 350 },
  { day: 365, title: 'שנה שלמה ביחד 🎂', coins: 1000, unlock: 'forever' },
];

/** The first year above, then one more birthday every year, for as long as the site lives. */
export function milestonesFor(days: number): Milestone[] {
  const years = Math.max(1, Math.floor(days / 365) + 1);
  const birthdays = Array.from({ length: years - 1 }, (_, i) => ({ day: 365 * (i + 2), title: `${i + 2} שנים ביחד 🎂`, coins: 1000 }));
  return [...milestones, ...birthdays];
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  coins: number;
  /** Counter name and target. */
  counter: string;
  target: number;
}

export const achievements: Achievement[] = [
  { id: 'feed1', title: 'ארוחה ראשונה', desc: 'להאכיל פעם ראשונה', emoji: '🥕', coins: 10, counter: 'feeds', target: 1 },
  { id: 'feed50', title: p('שף', 'שפית'), desc: 'להאכיל 50 פעם', emoji: '👩‍🍳', coins: 80, counter: 'feeds', target: 50 },
  { id: 'feed300', title: 'מסעדת חמישה כוכבים', desc: 'להאכיל 300 פעם', emoji: '⭐', coins: 250, counter: 'feeds', target: 300 },
  { id: 'pet100', title: 'ידיים של זהב', desc: 'ללטף 100 פעם', emoji: '🤲', coins: 60, counter: 'pets', target: 100 },
  { id: 'pet1000', title: 'מכונת ליטופים', desc: 'ללטף 1,000 פעם', emoji: '💞', coins: 300, counter: 'pets', target: 1000 },
  { id: 'bath10', title: 'מבריק מניקיון', desc: '10 אמבטיות', emoji: '🛁', coins: 60, counter: 'baths', target: 10 },
  { id: 'poop50', title: p('גיבור הניקיון', 'גיבורת הניקיון'), desc: 'לנקות 50 קקים', emoji: '🧹', coins: 80, counter: 'poops', target: 50 },
  { id: 'game1', title: 'משחק ראשון', desc: 'לשחק משחק אחד', emoji: '🎮', coins: 10, counter: 'games', target: 1 },
  { id: 'game50', title: p('גיימר', 'גיימרית'), desc: 'לשחק 50 משחקים', emoji: '🕹️', coins: 200, counter: 'games', target: 50 },
  { id: 'catch30', title: 'ידיים מהירות', desc: '30 נקודות בתופסים ירקות', emoji: '🧺', coins: 80, counter: 'best:catch', target: 30 },
  { id: 'peek25', title: 'עין של נשר', desc: `25 נקודות באיפה ה${species.name}`, emoji: '👀', coins: 80, counter: 'best:peek', target: 25 },
  { id: 'simon8', title: 'זיכרון של פיל', desc: `רצף של 8 ב${species.name} אומר`, emoji: '🐘', coins: 100, counter: 'best:simon', target: 8 },
  { id: 'memory', title: p('מכיר כל תמונה', 'מכירה כל תמונה'), desc: 'לנצח בזיכרון ב-10 מהלכים או פחות', emoji: '📸', coins: 120, counter: 'memoryPerfect', target: 1 },
  { id: 'rich', title: p('עשיר', 'עשירה'), desc: `להרוויח 2,000 ${species.coin} בסך הכל`, emoji: '💰', coins: 150, counter: 'earned', target: 2000 },
  { id: 'shop5', title: p('קניוניסט', 'קניוניסטית'), desc: 'לקנות 5 פריטים', emoji: '🛍️', coins: 60, counter: 'purchases', target: 5 },
  { id: 'skins3', title: p('אופנאי', 'אופנאית'), desc: 'לאסוף 3 סקינים שקנית', emoji: '🎨', coins: 150, counter: 'skinsBought', target: 3 },
  { id: 'streak7', title: 'שבוע ברצף', desc: 'לבקר 7 ימים ברצף', emoji: '🔥', coins: 150, counter: 'streak', target: 7 },
  { id: 'streak30', title: 'חודש ברצף', desc: 'לבקר 30 ימים ברצף', emoji: '🏆', coins: 600, counter: 'streak', target: 30 },
  { id: 'level5', title: 'רמה 5', desc: 'להגיע לרמה 5', emoji: '🎖️', coins: 100, counter: 'level', target: 5 },
  { id: 'level15', title: 'רמה 15', desc: 'להגיע לרמה 15', emoji: '🥇', coins: 400, counter: 'level', target: 15 },
  { id: 'photo1', title: p('צלם', 'צלמת'), desc: 'לצלם תמונה ראשונה לאלבום', emoji: '📸', coins: 20, counter: 'photos', target: 1 },
  { id: 'photo20', title: p('צלם מקצועי', 'צלמת מקצועית'), desc: '20 תמונות באלבום', emoji: '🎞️', coins: 150, counter: 'photos', target: 20 },
  { id: 'spin20', title: 'מזל של מתחילים', desc: 'לסובב את הגלגל 20 פעם', emoji: '🎡', coins: 100, counter: 'spins', target: 20 },
  { id: 'care1', title: p('גם אתה חשוב', 'גם את חשובה'), desc: 'לדאוג לעצמך פעם ראשונה', emoji: '🌱', coins: 15, counter: 'care', target: 1 },
  { id: 'care30', title: p('מטפל בעצמו', 'מטפלת בעצמה'), desc: '30 פעמים של דאגה לעצמך', emoji: '🌷', coins: 120, counter: 'care', target: 30 },
  { id: 'care150', title: `${species.name} ובעלים מאושרים`, desc: '150 פעמים של דאגה לעצמך', emoji: '🌻', coins: 400, counter: 'care', target: 150 },
  { id: 'water7', title: 'מעיין', desc: '7 ימים של 8 כוסות מים', emoji: '💧', coins: 150, counter: 'waterDays', target: 7 },
  { id: 'breath10', title: p('נושם עמוק', 'נושמת עמוק'), desc: `לנשום עם ה${species.name} 10 פעמים`, emoji: '🫧', coins: 100, counter: 'breaths', target: 10 },
  // Tricks (the secret gestures)
  { id: 'tricksAll', title: 'ספר הטריקים המלא', desc: 'לגלות את כל 9 הטריקים', emoji: '📖', coins: 300, counter: 'tricksKnown', target: 9 },
  { id: 'flip10', title: p('אקרובט', 'אקרובטית'), desc: '10 סלטות באוויר', emoji: '🤸', coins: 80, counter: 'trick:flip', target: 10 },
  { id: 'hug25', title: p('חיבוקי', 'חיבוקית'), desc: '25 חיבוקים ארוכים', emoji: '🤗', coins: 100, counter: 'trick:hug', target: 25 },
  { id: 'tickle20', title: p('מלך הדגדוגים', 'מלכת הדגדוגים'), desc: 'לדגדג אותו 20 פעם', emoji: '🪶', coins: 80, counter: 'trick:tickle', target: 20 },
  { id: 'dance10', title: 'מורה לריקוד', desc: 'לגרום לו לרקוד 10 פעמים', emoji: '💃', coins: 80, counter: 'trick:dance', target: 10 },
  { id: 'dizzy5', title: 'קרוסלה', desc: 'לסחרר אותו 5 פעמים', emoji: '🌀', coins: 60, counter: 'trick:dizzy', target: 5 },
  { id: 'makeup', title: 'סליחה, חמוד', desc: 'ללטף אותו אחרי שהוא בכה', emoji: '🩹', coins: 40, counter: 'makeups', target: 1 },
  { id: 'combo1', title: 'קומבו!', desc: '3 טריקים שונים תוך 10 שניות', emoji: '🔥', coins: 50, counter: 'combos', target: 1 },
  { id: 'combo10', title: p('מאסטר קומבו', 'מאסטרית קומבו'), desc: '10 קומבואים', emoji: '⚡', coins: 200, counter: 'combos', target: 10 },
  { id: 'tricks100', title: `קרקס ${species.plural}`, desc: '100 טריקים', emoji: '🎪', coins: 250, counter: 'tricks', target: 100 },
  // Around the whole site
  { id: 'detective', title: p('בלש', 'בלשית'), desc: 'למצוא את כל החברים המתחבאים', emoji: '🕵️', coins: 200, counter: 'q:find', target: 9 },
  { id: 'plans3', title: p('הרפתקן', 'הרפתקנית'), desc: 'לסיים 3 הרפתקאות יומיות', emoji: '🗺️', coins: 120, counter: 'q:plans', target: 3 },
  { id: 'shepherd', title: p('רועה כבשים', 'רועת כבשים'), desc: 'לספור כבשים עד הסוף 10 פעמים', emoji: '🐑', coins: 150, counter: 'q:sheep', target: 10 },
  { id: 'roadQueen', title: p('מלך הכביש', 'מלכת הכביש'), desc: `להגיע ל${A} 5 פעמים`, emoji: '🚗', coins: 150, counter: 'q:road', target: 5 },
];

/**
 * The secret tricks: gestures on the pet (PigActor). The partner discovers
 * them by playing; the tricks book gives half a clue, the admin sees the answer.
 */
export interface Trick {
  id: TrickId;
  name: string;
  /** The answer (the admin's view). */
  how: string;
  /** Half a clue (the partner's). */
  half: string;
}
export type TrickId = 'jump' | 'flip' | 'slap' | 'pancake' | 'dizzy' | 'sneeze' | 'tickle' | 'dance' | 'hug';
export const tricks: Trick[] = [
  { id: 'jump', name: 'קפיצה לשמיים', how: 'שתי נגיעות מהירות עליו', half: 'מתופפים עליו פעמיים, והוא כבר באוויר' },
  { id: 'flip', name: 'סלטה', how: 'החלקה מהירה של האצבע כלפי מעלה', half: 'אם זורקים אותו לשמיים, הוא מתהפך' },
  { id: 'hug', name: 'חיבוק', how: 'להחזיק עליו את האצבע שנייה, בלי לזוז', half: 'לפעמים הוא רק רוצה שיחזיקו אותו קצת' },
  { id: 'dance', name: 'ריקוד', how: 'נגיעה ברגליים שלו', half: 'הרגליים שלו רק מחכות לסיבה' },
  { id: 'sneeze', name: 'אפצ׳י', how: 'נגיעה באף', half: 'משהו מדגדג לו באף…' },
  { id: 'tickle', name: 'דגדוגים', how: 'שלוש נגיעות מהירות בבטן', half: 'יש לו נקודה רגישה, איפשהו למטה' },
  { id: 'pancake', name: 'פנקייק', how: 'החלקה מהירה כלפי מטה', half: 'מה קורה אם לוחצים אותו מלמעלה?' },
  { id: 'dizzy', name: 'סחרחורת', how: 'לסובב את האצבע סביבו פעמיים בלי להרים', half: 'סיבובים, סיבובים… עד שהראש מסתובב' },
  { id: 'slap', name: 'סטירה (ובכי)', how: 'החלקה מהירה לרוחב הפנים. הוא בוכה 3 שניות; ליטוף אחרי זה = סליחה', half: 'לא יפה… אבל מה קורה כשמעבירים לו יד מהר על הפנים?' },
];
export const trickById = (id: string) => tricks.find((t) => t.id === id);

export interface TaskDef {
  id: string;
  text: string;
  counter: string;
  target: number;
  coins: number;
}

/** Three of these a day, the same three all day. */
export const taskPool: TaskDef[] = [
  { id: 'feed3', text: 'להאכיל 3 פעמים', counter: 'feeds', target: 3, coins: 20 },
  { id: 'feedVeg', text: `לתת ${foodName('pepper')} או ${foodName('parsley')} (ויטמינים!)`, counter: 'vitC', target: 1, coins: 25 },
  { id: 'pet15', text: 'ללטף 15 פעם', counter: 'pets', target: 15, coins: 20 },
  { id: 'pet40', text: 'ללטף 40 פעם (הוא אוהב את זה)', counter: 'pets', target: 40, coins: 35 },
  { id: 'games2', text: 'לשחק 2 משחקים', counter: 'games', target: 2, coins: 30 },
  { id: 'bath', text: 'לעשות לו אמבטיה', counter: 'baths', target: 1, coins: 25 },
  { id: 'poop3', text: 'לנקות 3 קקים', counter: 'poops', target: 3, coins: 25 },
  { id: 'earn60', text: `להרוויח 60 ${species.coin} במשחקים`, counter: 'gameCoins', target: 60, coins: 30 },
  { id: 'treat', text: `לפנק ב${foodName('strawberry')} או ${foodName('watermelon')}`, counter: 'treats', target: 1, coins: 20 },
  { id: 'buy', text: 'לקנות משהו בחנות', counter: 'purchases', target: 1, coins: 20 },
  { id: 'dress', text: 'להחליף לו בגד', counter: 'dress', target: 1, coins: 15 },
  { id: 'nap', text: 'להשכיב אותו לישון', counter: 'naps', target: 1, coins: 15 },
  { id: 'trick3', text: 'לגרום לו לעשות 3 טריקים', counter: 'tricks', target: 3, coins: 25 },
  { id: 'flip2', text: 'שתי סלטות באוויר', counter: 'trick:flip', target: 2, coins: 25 },
  { id: 'hug2', text: '2 חיבוקים ארוכים', counter: 'trick:hug', target: 2, coins: 20 },
  { id: 'combo', text: 'קומבו: 3 טריקים שונים תוך 10 שניות', counter: 'combos', target: 1, coins: 35 },
  { id: 'dance1', text: 'לגרום לו לרקוד', counter: 'trick:dance', target: 1, coins: 20 },
  { id: 'tickle1', text: 'לדגדג אותו בבטן', counter: 'trick:tickle', target: 1, coins: 20 },
];

export const DAILY_ALL_BONUS = 50;
/** Daily visit bonus by streak day (1-based, the 7th repeats). */
export const streakBonus = [20, 30, 40, 50, 60, 80, 150];

export type WheelKind = 'coins' | 'food' | 'boost' | 'mystery' | 'xp' | 'again' | 'crown';
export interface WheelSlice {
  kind: WheelKind;
  label: string;
  /** Relative chance. */
  w: number;
  color: string;
  coins?: number;
  food?: string;
  qty?: number;
}

/** The only place in the world to get it. */
export const LUCKY_CROWN = 'luckycrown';
/** After this many spins without it, the crown is guaranteed. */
export const CROWN_PITY = 24;

export const wheel: WheelSlice[] = [
  { kind: 'coins', label: '15', coins: 15, w: 7, color: '#FDE3D3' },
  { kind: 'food', label: '×3', food: 'carrot', qty: 3, w: 6, color: '#DDEBFA' },
  { kind: 'boost', label: 'פינוק', w: 5, color: '#FBE1E6' },
  { kind: 'coins', label: '40', coins: 40, w: 5, color: '#FBEFC9' },
  { kind: 'mystery', label: 'הפתעה', w: 3, color: '#E6DDF7' },
  { kind: 'xp', label: '+40', w: 4, color: '#DDF2E3' },
  { kind: 'crown', label: 'כתר', w: 0.6, color: '#3A2238' },
  { kind: 'coins', label: '100', coins: 100, w: 3, color: '#FDE3D3' },
  { kind: 'again', label: 'שוב!', w: 3, color: '#DDEBFA' },
  { kind: 'coins', label: '250', coins: 250, w: 1, color: '#F2C14E' },
];

export const nameIdeas = [...species.names, 'פיסטוק', 'קינמון', 'בוטן', 'נוגט', 'דובי', 'טופי'];

/** What he says, by mood. `{name}` is his name. */
export const lines = {
  hungry: [`${species.sound} יש פה מישהו עם ${foodName('carrot')}?`, `הבטן שלי עושה רעשים של ${species.name} רעב 🥺`, `אני לא אומר כלום… אבל ${foodName('lettuce')} זה תמיד רעיון טוב`, 'רעב. רעב רעב רעב.'],
  dirty: ['אני קצת… מסריח? 🫣', 'יש פה קקי. זה לא שלי. (זה שלי)', 'אמבטיה? אולי? רק קצת?'],
  sleepy: ['אני כל כך עייף… 😴', 'עוד חמש דקות שינה ואני חוזר', `פהההה (פיהוק של ${species.name})`],
  sick: ['לא מרגיש טוב 🤒 אולי ויטמין?', 'קצת חולה. חיבוק יעזור.'],
  sad: [`התגעגעתי ${p('אליך', 'אלייך')} 🥺`, `${p('שחק', 'שחקי')} איתי קצת? 🎾`, `${p('בוא', 'בואי')} נשחק משהו… אני משתעמם`, 'צריך חיבוק. דחוף.'],
  happy: [
    `${species.sound} (בשפת ${species.plural}: אני אוהב אותך)`,
    `${A} ${a('ביקש', 'ביקשה')} שאגיד לך ש${p('אתה יפה', 'את יפה')} היום. ${a('הוא צודק', 'היא צודקת')}.`,
    `ראיתי את ${A} ${a('מתגעגע', 'מתגעגעת')} ${p('אליך', 'אלייך')}. ${a('הוא לא יודע', 'היא לא יודעת')} להסתיר.`,
    'אני הכי מאושר בעולם 🧡',
    `אני ${species.happyMove}! (ככה ${species.plural} עושים כשהם שמחים)`,
    'הייתי מגיש לך פרח, אבל אכלתי אותו.',
    `${p('אתה יודע שאתה', 'את יודעת שאת')} הבן אדם האהוב עליי?`,
    `סוד: ${A} ${a('מדבר', 'מדברת')} ${p('עליך', 'עלייך')} כל הזמן 🤫`,
  ],
  night: [`לילה טוב ${P} 🌙`, `חלמתי שאכלתי ${foodName('watermelon')} בגודל של בית`],
  missed: ['חזרת!!! חיכיתי לך כל היום 🥹', 'איפה היית? ספרתי את השניות'],
  asleep: ['ז׳ז׳ז׳… 💤', `(חולם על ${foodName('carrot')})`, 'ששש… הוא ישן'],
};

export const pick = <T>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
