import { bathMood, gameMood, revealTrait, tasteOf, traitOf, type TraitKey } from './personality';
import { checkLegends, legendReady, planProgress, type Plan } from './quests';
import {
  achievements,
  COIN,
  DAILY_ALL_BONUS,
  foodById,
  itemById,
  items,
  milestones,
  skinById,
  stages,
  streakBonus,
  taskPool,
  trickById,
  tricks as allTricks,
  POTION_MS,
  type PotionFx,
  wheel,
  LUCKY_CROWN,
  CROWN_PITY,
  type Slot,
  type TrickId,
} from './catalog';
import { species } from './species';
import { A } from '../lib/he';

/**
 * The pet's whole life as plain data, and the rules that change it.
 * Stats move with real time (even while the site is closed), but gently: he
 * gets hungry and lonely, never dies.
 */
export type AnimStyle = 'alive' | 'bouncy' | 'soft' | 'magic';

export type Stat = 'hunger' | 'happy' | 'energy' | 'clean' | 'health';

export interface PetState {
  v: 1;
  name: string;
  skin: string;
  adoptedAt: number;
  /** Last time stats were advanced. */
  tickedAt: number;
  /** Last change, for picking the newest copy between devices. */
  savedAt: number;
  stats: Record<Stat, number>;
  asleep: boolean;
  poops: { id: number; x: number }[];
  /** A potion's spell on him right now. */
  potion?: { fx: PotionFx; until: number };
  /** Hours awake since the last poop. */
  poopClock: number;
  coins: number;
  xp: number;
  level: number;
  /** Bought skins and items (starters and the free room are implied). */
  owned: string[];
  food: Record<string, number>;
  wear: Partial<Record<Exclude<Slot, 'room'>, string>> & { room: string };
  counters: Record<string, number>;
  achievements: string[];
  milestones: number[];
  daily: {
    date: string;
    counters: Record<string, number>;
    claimed: string[];
    bonus: boolean;
    spun: boolean;
    visit: boolean;
    /** Things the partner did for themselves today ("גם את/ה"). */
    care: string[];
    water: number;
  };
  streak: { last: string; count: number };
  gifts: string[];
  sound: boolean;
  /** How he moves: one of the four animation styles. */
  anim: AnimStyle;
  /** What she has found out about his personality. */
  known: TraitKey[];
  /** The music box. */
  music: boolean;
  /** Hidden friends she found around the site (quests.ts). */
  found: string[];
  /** Coveted pigs whose quest is done (announced once). */
  legends: string[];
  /** The daily adventure; it waits for her until it's done. */
  plan?: Plan;
  /** Secret tricks she has discovered. */
  tricks: string[];
}

export interface Notice {
  text: string;
  big?: boolean;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const HOUR = 3_600_000;

export function adopt(name: string, skin: string, now = Date.now()): PetState {
  return {
    v: 1,
    name: name.trim().slice(0, 18) || species.names[0],
    skin,
    adoptedAt: now,
    tickedAt: now,
    savedAt: now,
    stats: { hunger: 70, happy: 80, energy: 90, clean: 90, health: 100 },
    asleep: false,
    poops: [],
    poopClock: 0,
    coins: 100,
    xp: 0,
    level: 1,
    owned: [],
    food: { lettuce: 3, carrot: 2, strawberry: 1 },
    wear: { room: 'cozy' },
    counters: {},
    achievements: [],
    milestones: [],
    daily: { date: '', counters: {}, claimed: [], bonus: false, spun: false, visit: false, care: [], water: 0 },
    streak: { last: '', count: 0 },
    gifts: [],
    sound: true,
    anim: 'alive',
    known: [],
    music: true,
    found: [],
    legends: [],
    tricks: [],
  };
}

/** Advances the stats to `now`. Works for seconds or for days away (capped at 3 days). */
export function tick(s: PetState, now = Date.now()) {
  const real = Math.min(72, Math.max(0, (now - s.tickedAt) / HOUR));
  s.tickedAt = now;
  if (real <= 0) return;
  // Needs drop about a quarter every three hours while she's around; a long time away counts at a
  // slower pace, so a night's sleep doesn't leave him starving.
  const h = real <= 6 ? real : 6 + (real - 6) * 0.35;
  const st = s.stats;
  const sleepy = s.asleep;
  const trait = traitOf(s);
  st.hunger = clamp(st.hunger - h * (sleepy ? 3 : 8.5) * (trait === 'foodie' ? 1.15 : 1));
  st.happy = clamp(st.happy - h * (sleepy ? 2 : 7));
  st.clean = clamp(st.clean - h * 5);
  st.energy = clamp(st.energy + h * (sleepy ? (trait === 'dreamer' ? 30 : 22) : -4));
  const neglected = st.hunger < 15 || st.clean < 15 || st.happy < 10;
  st.health = clamp(st.health + h * (neglected ? -2.5 : 1.2));
  if (!sleepy) {
    s.poopClock += h;
    // At most three a day, never more than three on the floor.
    const d = new Date(now);
    const day = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
    if (s.counters.poopDay !== day) {
      s.counters.poopDay = day;
      s.counters.poopToday = 0;
    }
    while (s.poopClock >= 4) {
      s.poopClock -= 4;
      if (s.poops.length >= 3 || (s.counters.poopToday ?? 0) >= 3) continue;
      s.counters.poopToday = (s.counters.poopToday ?? 0) + 1;
      // Deterministic ids, so a live preview and the saved copy agree on which poop is which.
      const id = (s.counters.poopSeq = (s.counters.poopSeq ?? 0) + 1);
      s.poops.push({ id, x: 10 + ((id * 37) % 80) });
    }
  }
  if (sleepy && st.energy >= 100) s.asleep = false;
}

export const ageDays = (s: PetState, now = Date.now()) => Math.floor((now - s.adoptedAt) / 86_400_000);
export const stageOf = (days: number) => [...stages].reverse().find((x) => days >= x.from)!;
export const xpForNext = (level: number) => 40 + level * 30;

export type Mood = 'asleep' | 'sick' | 'hungry' | 'dirty' | 'sleepy' | 'sad' | 'happy' | 'ok';
export function moodOf(s: PetState): Mood {
  const st = s.stats;
  if (s.asleep) return 'asleep';
  if (st.health < 35) return 'sick';
  if (st.hunger < 30) return 'hungry';
  if (st.clean < 30 || s.poops.length >= 3) return 'dirty';
  if (st.energy < 20) return 'sleepy';
  if (st.happy < 35) return 'sad';
  if ((st.hunger + st.happy + st.clean + st.health) / 4 > 65) return 'happy';
  return 'ok';
}

export const owns = (s: PetState, id: string) => {
  if (s.owned.includes(id)) return true;
  if (id === 'cozy') return true;
  return !!skinById(id) && skinById(id).id === id && !!skinById(id).starter;
};

/**
 * Notices raised from deep inside an action that has no `out` at hand (a step
 * of the daily adventure). usePet's act() hands them on with the rest.
 */
export const lateNotices: Notice[] = [];

/** Adds to lifetime and today's counters (and moves the daily adventure). */
function count(s: PetState, key: string, by = 1) {
  s.counters[key] = (s.counters[key] ?? 0) + by;
  s.daily.counters[key] = (s.daily.counters[key] ?? 0) + by;
  planProgress(s, key, by, lateNotices);
}

export function earn(s: PetState, coins: number, out: Notice[], why?: string) {
  if (coins <= 0) return;
  s.coins += coins;
  s.counters.earned = (s.counters.earned ?? 0) + coins;
  if (why) out.push({ text: `+${coins} ${COIN} ${why}` });
}

function gainXp(s: PetState, xp: number, out: Notice[]) {
  s.xp += xp;
  while (s.xp >= xpForNext(s.level)) {
    s.xp -= xpForNext(s.level);
    s.level += 1;
    const reward = 20 + s.level * 10;
    out.push({ text: `⭐ ${s.name} עלה לרמה ${s.level}!`, big: true });
    earn(s, reward, out, 'מתנת רמה');
  }
}

function counterValue(s: PetState, key: string) {
  if (key === 'level') return s.level;
  if (key === 'streak') return s.streak.count;
  if (key === 'tricksKnown') return s.tricks.length;
  return s.counters[key] ?? 0;
}

/** Unlocks any achievement that was just reached. Run after every action. */
export function checkAchievements(s: PetState, out: Notice[]) {
  for (const a of achievements) {
    if (s.achievements.includes(a.id)) continue;
    if (counterValue(s, a.counter) >= a.target) {
      s.achievements.push(a.id);
      out.push({ text: `🏅 הישג חדש: ${a.title}`, big: true });
      earn(s, a.coins, out, a.title);
    }
  }
  checkLegends(s, out);
  revealTrait(s, out);
}

/** Seeded pick of today's 3 tasks (never two on the same counter). */
export function tasksFor(date: string) {
  let h = 2166136261;
  for (const c of date) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const pool = taskPool.slice();
  const out: typeof taskPool = [];
  while (out.length < 3 && pool.length) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    const t = pool.splice(h % pool.length, 1)[0];
    if (!out.some((o) => o.counter === t.counter)) out.push(t);
  }
  return out;
}

const prevDate = (date: string) => new Date(Date.parse(`${date}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/** New day: reset daily progress and pay the visit streak bonus. */
export function rollDay(s: PetState, date: string) {
  if (s.daily.date === date) return;
  s.daily = { date, counters: {}, claimed: [], bonus: false, spun: false, visit: false, care: [], water: 0 };
  if (s.streak.last !== date) {
    s.streak = { last: date, count: s.streak.last === prevDate(date) ? s.streak.count + 1 : 1 };
  }
}

export function claimVisit(s: PetState, out: Notice[]) {
  if (s.daily.visit) return;
  s.daily.visit = true;
  const bonus = streakBonus[(s.streak.count - 1) % streakBonus.length] ?? 20;
  out.push({ text: `☀️ בונוס ביקור · יום ${s.streak.count} ברצף`, big: true });
  earn(s, bonus, out, 'על הביקור');
  checkAchievements(s, out);
}

export function claimTask(s: PetState, id: string, out: Notice[]) {
  const t = tasksFor(s.daily.date).find((x) => x.id === id);
  if (!t || s.daily.claimed.includes(id) || (s.daily.counters[t.counter] ?? 0) < t.target) return;
  s.daily.claimed.push(id);
  earn(s, t.coins, out, 'משימה הושלמה');
  gainXp(s, 10, out);
  if (!s.daily.bonus && tasksFor(s.daily.date).every((x) => s.daily.claimed.includes(x.id))) {
    s.daily.bonus = true;
    out.push({ text: '🎉 כל המשימות של היום!', big: true });
    earn(s, DAILY_ALL_BONUS, out, 'בונוס יומי');
  }
  checkAchievements(s, out);
}

export function claimMilestone(s: PetState, day: number, out: Notice[]) {
  const m = milestones.find((x) => x.day === day);
  if (!m || s.milestones.includes(day) || ageDays(s) < day) return;
  s.milestones.push(day);
  out.push({ text: `🎂 ${m.title}`, big: true });
  earn(s, m.coins, out, 'מתנת המסע');
  if (m.unlock && !s.owned.includes(m.unlock)) {
    s.owned.push(m.unlock);
    const it = itemById(m.unlock);
    out.push({ text: `🎁 נפתח: ${it?.name ?? skinById(m.unlock).name}`, big: true });
  }
}

export type Fail = string | null;

export function feed(s: PetState, foodId: string, out: Notice[]): Fail {
  const f = foodById(foodId);
  if (!f) return 'אין דבר כזה';
  if (s.asleep) return `ששש… ${s.name} ישן 💤`;
  if (f.price > 0 && !(s.food[foodId] > 0)) return `נגמר ה${f.name}. אפשר לקנות בחנות`;
  if (f.potion) return drinkPotion(s, f.id, out);
  if (f.id !== 'vitamin' && s.stats.hunger >= 97) return `${s.name} מפוצץ! אין מקום אפילו לעלה 🫃`;
  if (f.price > 0) s.food[foodId] -= 1;
  s.stats.hunger = clamp(s.stats.hunger + f.hunger);
  // Food fills the belly; his happiness mostly comes from her talking to him.
  s.stats.happy = clamp(s.stats.happy + f.happy * 0.4);
  s.stats.health = clamp(s.stats.health + f.health);
  if (f.id !== 'vitamin') count(s, 'feeds');
  if (f.id === 'pepper' || f.id === 'parsley' || f.id === 'vitamin') count(s, 'vitC');
  if (f.id === 'strawberry' || f.id === 'watermelon' || f.id === 'cake') count(s, 'treats');
  if (traitOf(s) === 'foodie') s.stats.happy = clamp(s.stats.happy + 3);
  tasteOf(s, f.id, out);
  gainXp(s, 3, out);
  checkAchievements(s, out);
  return null;
}

const POTION_LINE: Record<PotionFx, string> = {
  full: '🧪 גלוג גלוג… קורקורקור! הוא רעב לגמרי. מה יש לאכול?',
  energy: '⚡ הוא מלא אנרגיה ומנצנץ!',
  love: '💗 שיקוי אהבה! הוא מאושר עד השמיים',
  giant: '🧪 הוא… גדל… ענק!',
  tiny: '🧪 הוא נהיה קטנטן!',
  rainbow: '🌈 הוא מחליף צבעים!',
  ghost: '👻 בווו! הוא שקוף',
  float: '🎈 הוא מרחף!',
};

function drinkPotion(s: PetState, id: string, out: Notice[]): Fail {
  const f = foodById(id)!;
  const fx = f.potion!;
  if (fx === 'full' && s.stats.hunger <= 3) return `${s.name} כבר רעב לגמרי. הוא רוצה אוכל, לא עוד שיקוי 🥕`;
  if (!(s.food[id] > 0)) return `נגמר ה${f.name}. אפשר לקנות בחנות`;
  s.food[id] -= 1;
  // Makes him completely hungry, so she can feed him all over again.
  if (fx === 'full') s.stats.hunger = 0;
  if (fx === 'energy') s.stats.energy = 100;
  if (fx === 'love') s.stats.happy = 100;
  s.potion = { fx, until: Date.now() + POTION_MS[fx] };
  count(s, 'potions');
  out.push({ text: POTION_LINE[fx] });
  gainXp(s, 3, out);
  checkAchievements(s, out);
  return null;
}

/** She talked to him (he heard a whole sentence and said it back): that's what fills his happiness. */
export function talkTo(s: PetState, out: Notice[], typed = false) {
  if (s.asleep) return;
  count(s, 'talks');
  s.stats.happy = clamp(s.stats.happy + (typed ? 9 : 14));
  if (s.counters.talks % 3 === 0) gainXp(s, 2, out);
  checkAchievements(s, out);
}

export function pet(s: PetState, out: Notice[]) {
  count(s, 'pets');
  // Petting him soon after he cried (from a slap) makes up.
  const slapAt = s.counters.slapAt ?? 0;
  if (slapAt && Date.now() - slapAt > 2500 && Date.now() - slapAt < 12_000) {
    s.counters.slapAt = 0;
    count(s, 'makeups');
    s.stats.happy = clamp(s.stats.happy + 6);
    out.push({ text: `🩹 ${s.name} סלח לך. הוא לא מחזיק טינה` });
  }
  s.stats.happy = clamp(s.stats.happy + (s.asleep ? 0.3 : 0.8) * (traitOf(s) === 'cuddly' ? 2 : 1));
  const n = s.counters.pets;
  if (n % 5 === 0) gainXp(s, 1, out);
  if (n % 12 === 0) earn(s, 1, out, '');
  checkAchievements(s, out);
}

export function bathe(s: PetState, out: Notice[]) {
  s.stats.clean = 100;
  s.stats.happy = clamp(s.stats.happy + 4);
  bathMood(s, out);
  count(s, 'baths');
  gainXp(s, 6, out);
  checkAchievements(s, out);
}

export function cleanPoop(s: PetState, id: number, out: Notice[]) {
  const before = s.poops.length;
  s.poops = s.poops.filter((p) => p.id !== id);
  if (s.poops.length === before) return;
  s.stats.clean = clamp(s.stats.clean + 5);
  count(s, 'poops');
  earn(s, 2, out, '');
  gainXp(s, 1, out);
  checkAchievements(s, out);
}

export function toggleSleep(s: PetState): Fail {
  if (!s.asleep && s.stats.energy > 85) return `${s.name} לא עייף בכלל! הוא רוצה לשחק`;
  s.asleep = !s.asleep;
  if (s.asleep) count(s, 'naps');
  return null;
}

export const GAME_ENERGY = 12;
export function canPlay(s: PetState): Fail {
  if (s.asleep) return `${s.name} ישן. נשחק כשהוא יתעורר 💤`;
  if (s.stats.energy < GAME_ENERGY) return `${s.name} עייף מדי לשחק. אולי תנומה?`;
  return null;
}

/** Pays out a finished game. Returns the coins won. */
export function finishGame(s: PetState, game: string, score: number, coins: number, out: Notice[], opts: { light?: boolean; level?: number } = {}) {
  // Her arcade games don't tire him out; the games he plays with her (care games) do.
  if (!opts.light) {
    s.stats.energy = clamp(s.stats.energy - GAME_ENERGY);
    s.stats.hunger = clamp(s.stats.hunger - 5);
  }
  s.stats.happy = clamp(s.stats.happy + (opts.light ? 2 : 5) + (traitOf(s) === 'playful' ? 3 : 0));
  if (opts.level && opts.level > (s.counters[`lvl:${game}`] ?? 1)) s.counters[`lvl:${game}`] = opts.level;
  gameMood(s, game, out);
  count(s, 'games');
  const best = `best:${game}`;
  if (score > (s.counters[best] ?? 0)) {
    if (s.counters[best]) out.push({ text: `🏆 שיא חדש: ${score}!`, big: true });
    s.counters[best] = score;
  }
  const won = Math.max(0, Math.round(coins));
  if (won) {
    earn(s, won, out, 'מהמשחק');
    count(s, 'gameCoins', won);
  }
  gainXp(s, 8 + Math.min(12, Math.floor(score / 3)), out);
  checkAchievements(s, out);
  return won;
}

export function buy(s: PetState, id: string, out: Notice[]): Fail {
  const food = foodById(id);
  const item = itemById(id);
  const skin = skinById(id).id === id ? skinById(id) : undefined;
  const price = food?.price ?? item?.price ?? skin?.price ?? 0;
  if (!food && !item && !skin) return 'לא נמצא';
  if ((item?.exclusive || skin?.exclusive) && !s.owned.includes(id)) return id === LUCKY_CROWN ? 'את הכתר הזה אפשר לזכות רק בגלגל המזל 🎡' : 'את זה אפשר רק לקבל במסע 🎁';
  if (skin?.legend && !legendReady(s, id)) return 'הוא עוד נעול. המשימה שלו בסימן השאלה ✨';
  if (!food && owns(s, id)) return 'כבר שלך';
  if (s.coins < price) return `חסרים ${price - s.coins} ${COIN}`;
  s.coins -= price;
  if (food) s.food[id] = (s.food[id] ?? 0) + 1;
  else s.owned.push(id);
  if (skin) count(s, 'skinsBought');
  count(s, 'purchases');
  checkAchievements(s, out);
  return null;
}

export function wear(s: PetState, slot: Slot, id: string | undefined) {
  if (slot === 'room') s.wear.room = id ?? 'cozy';
  else if (s.wear[slot] === id || !id) delete s.wear[slot];
  else s.wear[slot] = id;
  count(s, 'dress');
}

export function setSkin(s: PetState, id: string) {
  s.skin = id;
  count(s, 'dress');
}

/** Spins the daily wheel. Returns the slice index it lands on, or null if already spun today. */
export function spin(s: PetState, out: Notice[]): number | null {
  if (s.daily.spun) return null;
  s.daily.spun = true;
  count(s, 'spins');
  const hasCrown = s.owned.includes(LUCKY_CROWN);
  const pity = s.counters.crownPity ?? 0;
  let i = wheel.findIndex((w) => w.kind === 'crown');
  // The crown is rare, but every spin without it brings it closer, and by the last one it's sure.
  if (hasCrown || pity < CROWN_PITY - 1) {
    const weights = wheel.map((w) => (w.kind === 'crown' && hasCrown ? 0 : w.w));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    i = 0;
    while (r >= weights[i]) r -= weights[i++];
  }
  const w = wheel[i];
  if (!hasCrown) s.counters.crownPity = w.kind === 'crown' ? 0 : pity + 1;
  const st = s.stats;
  switch (w.kind) {
    case 'food': {
      const qty = w.qty ?? 1;
      s.food[w.food!] = (s.food[w.food!] ?? 0) + qty;
      out.push({ text: `🎡 זכית ב${foodById(w.food!)!.name}${qty > 1 ? ` ×${qty}` : ''}!`, big: true });
      break;
    }
    case 'boost':
      st.happy = clamp(st.happy + 30);
      st.hunger = clamp(st.hunger + 20);
      st.clean = clamp(st.clean + 20);
      st.energy = clamp(st.energy + 20);
      out.push({ text: '💆 יום פינוק! הוא שבע, נקי, רענן ומאושר', big: true });
      break;
    case 'mystery': {
      const left = items.filter((x) => !x.exclusive && x.slot !== 'room' && x.price <= 300 && !s.owned.includes(x.id));
      const got = left[Math.floor(Math.random() * left.length)];
      if (got) {
        s.owned.push(got.id);
        out.push({ text: `🎁 הפתעה! ${got.name} חדש בארון שלו`, big: true });
      } else earn(s, 120, out, 'מההפתעה');
      break;
    }
    case 'xp':
      out.push({ text: '⭐ +40 ניסיון! הוא עולה בדרגה מהר יותר', big: true });
      gainXp(s, 40, out);
      break;
    case 'again':
      s.daily.spun = false;
      out.push({ text: '🎡 סיבוב נוסף! הגלגל מחכה לך', big: true });
      break;
    case 'crown':
      if (hasCrown) earn(s, 300, out, 'מהכתר');
      else {
        s.owned.push(LUCKY_CROWN);
        s.wear.head = LUCKY_CROWN;
        out.push({ text: '👑 כתר המזל! הכתר הכי נדיר שיש, ואין דרך אחרת להשיג אותו', big: true });
      }
      break;
    default:
      earn(s, w.coins ?? 0, out, 'מהגלגל');
  }
  checkAchievements(s, out);
  return i;
}

export interface Gift {
  id: string;
  coins: number;
  note?: string;
  food?: string;
  at: number;
}

export function openGift(s: PetState, g: Gift, out: Notice[]) {
  if (s.gifts.includes(g.id)) return;
  s.gifts.push(g.id);
  if (g.food && foodById(g.food)) s.food[g.food] = (s.food[g.food] ?? 0) + 3;
  earn(s, g.coins, out, `מתנה מ${A}`);
}

/* ───── "גם את": she takes care of herself, and he grows from it ───── */

export const WATER_GOAL = 8;

export function drink(s: PetState, out: Notice[]) {
  if (s.daily.water >= WATER_GOAL) return;
  s.daily.water += 1;
  count(s, 'water');
  s.stats.happy = clamp(s.stats.happy + 1);
  earn(s, 2, out, '');
  gainXp(s, 2, out);
  if (s.daily.water === WATER_GOAL) {
    out.push({ text: `💧 ${WATER_GOAL} כוסות מים היום!`, big: true });
    earn(s, 15, out, 'על המים');
    count(s, 'waterDays');
  }
  checkAchievements(s, out);
}

/** One of the daily self-care things. Returns false if already done today. */
export function care(s: PetState, id: string, out: Notice[], coins = 10): boolean {
  if (s.daily.care.includes(id)) return false;
  s.daily.care.push(id);
  count(s, 'care');
  s.stats.happy = clamp(s.stats.happy + 6);
  s.stats.health = clamp(s.stats.health + 3);
  earn(s, coins, out, 'על לדאוג לעצמך');
  gainXp(s, 8, out);
  checkAchievements(s, out);
  return true;
}

/** A minute of breathing together. Counts every time; pays once a day. */
export function breathe(s: PetState, out: Notice[]) {
  count(s, 'breaths');
  s.stats.happy = clamp(s.stats.happy + 5);
  if (!care(s, 'breathe', out, 15)) checkAchievements(s, out);
}

/** Restores defaults for any field an older saved copy might be missing. */
export function normalize(raw: unknown): PetState | null {
  const o = raw as Partial<PetState> | null;
  if (!o || typeof o !== 'object' || typeof o.name !== 'string' || typeof o.adoptedAt !== 'number') return null;
  const base = adopt(o.name, typeof o.skin === 'string' ? o.skin : 'classic', o.adoptedAt);
  return {
    ...base,
    ...o,
    stats: { ...base.stats, ...o.stats },
    streak: { ...base.streak, ...o.streak },
    wear: { ...base.wear, ...o.wear },
    counters: { ...o.counters },
    food: { ...o.food },
    known: Array.isArray(o.known) ? o.known : [],
    found: Array.isArray(o.found) ? o.found : [],
    legends: Array.isArray(o.legends) ? o.legends : [],
    tricks: Array.isArray(o.tricks) ? o.tricks : [],
    poops: Array.isArray(o.poops) ? o.poops.slice(0, 3) : [],
    daily: { ...base.daily, ...o.daily, care: o.daily?.care ?? [], water: o.daily?.water ?? 0 },
  } as PetState;
}

/* ───── Secret tricks ───── */

/** The last few tricks, for spotting a combo (three different ones in 10 seconds). */
const recent: { id: string; at: number }[] = [];

export function trick(s: PetState, id: TrickId, out: Notice[]) {
  const t = trickById(id);
  if (!t) return;
  count(s, 'tricks');
  count(s, `trick:${id}`);
  if (!s.tricks.includes(id)) {
    s.tricks.push(id);
    out.push({ text: `🎩 טריק חדש: ${t.name}! (${s.tricks.length}/${allTricks.length})` });
    earn(s, 15, out, 'על טריק חדש');
  }
  if (id === 'slap') {
    s.stats.happy = clamp(s.stats.happy - 5);
    s.counters.slapAt = Date.now();
  } else if (id === 'hug') s.stats.happy = clamp(s.stats.happy + 4);
  else if (id === 'tickle' || id === 'dance') s.stats.happy = clamp(s.stats.happy + 3);
  else s.stats.happy = clamp(s.stats.happy + 1);
  if (id === 'jump' || id === 'flip' || id === 'dance') s.stats.energy = clamp(s.stats.energy - 1);

  const now = Date.now();
  recent.push({ id, at: now });
  while (recent.length && now - recent[0].at > 10_000) recent.shift();
  if (new Set(recent.map((r) => r.id)).size >= 3) {
    recent.length = 0;
    count(s, 'combos');
    out.push({ text: '🔥 קומבו! שלושה טריקים ברצף' });
    earn(s, 20, out, 'על הקומבו');
  }
  gainXp(s, 2, out);
  checkAchievements(s, out);
}
