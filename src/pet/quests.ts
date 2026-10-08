import { COIN, skins } from './catalog';
import type { Notice, PetState } from './engine';
import { species } from './species';
import { has } from '../client';
import type { Features } from '../client/schema';
import { A, p } from '../lib/he';

type Feature = keyof Features;

/**
 * Quests that tie the whole site together.
 *
 * - Hidden friends: nine little characters hide on different pages. Each is
 *   found once, then gone for good.
 * - The five coveted pets (legend skins) open only when their quest is done:
 *   things done all over the site (night, games, home, letters).
 * - The daily adventure: a long plan of steps that goes from page to page.
 *   It never expires: an unfinished plan waits, and a new one comes only on
 *   the day after the last one was finished.
 *
 * Only what this site has: friends, legend steps and adventure steps of
 * modules the client turned off are left out.
 *
 * Progress is plain counters on the pet (`q:<key>`), so it syncs with him.
 */

/* ───────────── Hidden friends ───────────── */

export type FriendId = 'penguins' | 'cat' | 'goat' | 'girl' | 'curly' | 'hamster' | 'kid' | 'angora' | 'shocked';

export interface Friend {
  id: FriendId;
  name: string;
  page: string;
  /** The full answer: where and how. Only the admin sees it. */
  hint: string;
  /** Half a clue for the partner: roughly what it looks like and roughly where. */
  half: string;
  /** The module whose page it hides on. */
  on: Feature;
}

const you = (m: string, f: string) => p(m, f);

const ALL_FRIENDS: Friend[] = [
  { id: 'cat', on: 'words', name: 'החתול הרוקד', page: 'בית', hint: 'חתול אפור ישן מאחורי ״המילה של היום״. הוא קם רק למי שדופק עליה שלוש פעמים.', half: 'אפור, ורוקד כשאף אחד לא מסתכל. ישן בדף הבית, ליד מילה אחת.' },
  { id: 'angora', on: 'pet', name: 'השעיר הביישן', page: 'בית', hint: 'בדף הבית, מישהו בצבע קרמל מציץ מלמטה, בערך פעם בחצי דקה. הוא מתבייש, אז הוא לא נשאר הרבה.', half: 'בצבע קרמל, ומתבייש. לפעמים מגיע מלמטה בדף הבית.' },
  { id: 'kid', on: 'pet', name: 'הארנבון עם כובע המסיבה', page: 'החנות', hint: 'בחנות, למטה למטה, אחרי כל הסקינים, ארנבון לבן עם כובע מסיבה עומד ומחכה.', half: `לבן, עם אוזניים ארוכות וכובע. מחכה במקום שקונים בו, למי שלא ${you('מוותר', 'מוותרת')} עד הסוף.` },
  { id: 'shocked', on: 'pet', name: 'הכלבלב ההמום', page: 'המטבח', hint: 'במטבח, כלבלב בשחור־לבן מציץ מהצד. הוא מגיע רק פעמיים בשבוע (הימים מתחלפים כל שבוע), ואז מציץ בערך כל חצי דקה. הוא בהלם שיש פה אוכל בלי שהוא הוזמן.', half: 'שחור־לבן, ותמיד נראה בהלם. אוהב מקומות שיש בהם אוכל, אבל לא מגיע כל יום.' },
  { id: 'goat', on: 'dates', name: 'החתולה הסקרנית', page: 'פגישות', hint: `בדף הפגישות חתולה בצבע קינמון עם סרט מציצה מהצד, כל חצי דקה. צריך להיות ${you('מהיר', 'מהירה')}.`, half: 'קינמון, עם סרט ורוד ומבט סקרן. מסתובבת ליד הימים שאנחנו נפגשים.' },
  { id: 'girl', on: 'story', name: 'הכלבלב המנומנם', page: 'אנחנו', hint: 'בדף ״אנחנו״, בסוף הסוף של הדף, כלבלב עם כובע גרב ישן ומחכה שמישהו יגלול עד אליו.', half: 'שוקולד, עם כובע גרב, וישן. מחכה בסוף הסיפור שלנו.' },
  { id: 'curly', on: 'letters', name: 'הארנבונה עם הפרחים', page: 'המכתבים', hint: 'בלשונית המכתבים: שלוש נגיעות בכותרת הגדולה, וארנבונה עם זר פרחים יוצאת להגיד שלום.', half: `אפרסק, עם זר פרחים על הראש. אוהבת מכתבים, ויוצאת למי ש${you('מתעקש', 'מתעקשת')}.` },
  { id: 'penguins', on: 'night', name: 'שלושת הרקדנים', page: 'לילה', hint: 'בלילה, שלושה חברים עם פפיון עוברים בתחתית המסך בריקוד. בערך פעם בחצי דקה, ולא לאורך זמן.', half: 'שלושה, לבושים כמו לחתונה, ורוקדים. מגיעים רק כשחשוך.' },
  { id: 'hamster', on: 'night', name: 'המסוחרר מהירח', page: 'לילה', hint: 'בדף הלילה: שלוש נגיעות בירח, ומישהו מסוחרר מציץ מחור. הוא עדיין לא בטוח איפה הוא.', half: 'בצבע דבש ומסוחרר. גר בחור, אי שם למעלה בשמיים.' },
];

/** Only the friends whose page this site has. */
export const FRIENDS: Friend[] = ALL_FRIENDS.filter((f) => has(f.on));

export const isFound = (s: PetState | null | undefined, id: FriendId) => !!s?.found?.includes(id);

/* ───────────── The five coveted pets ───────────── */

export interface Step {
  text: string;
  /** `q:<key>` counter, or `c:<key>` for one of his own counters, or `level`. */
  key: string;
  target: number;
  route?: string;
}

export interface Legend {
  skin: string;
  title: string;
  story: string;
  steps: Step[];
}

/** Which module a step needs; steps of modules the site doesn't have are left out. */
const NEEDS: Record<string, Feature> = {
  find: 'friends',
  goodnight: 'night',
  wish: 'night',
  goals_set: 'night',
  sound: 'night',
  sheep: 'night',
  farm: 'night',
  farm_play: 'night',
  road: 'night',
  pouch: 'night',
  mood: 'mood',
  letter: 'openWhen',
  reach: 'contact',
  photo_day: 'gallery',
  gallery: 'gallery',
  dates: 'dates',
};
const possible = (key: string) => !NEEDS[key] || has(NEEDS[key]);
const S = species;

const ALL_LEGENDS: Legend[] = [
  {
    skin: 'unicorn',
    title: 'המחבואים הגדולים',
    story: `חברים קטנים מתחבאים בכל האתר. מי ש${you('מוצא', 'מוצאת')} את כולם ${you('מקבל', 'מקבלת')} חד־קרן שהאור עובר לו על הפרווה.`,
    steps: [{ text: 'למצוא את כל החברים המתחבאים', key: 'find', target: FRIENDS.length }],
  },
  {
    skin: 'nebula',
    title: 'לילות טובים',
    story: `${S.name} שעשוי מהשמיים של הלילה. נפתח למי ש${you('נרדם', 'נרדמת')} יפה כמה לילות.`,
    steps: [
      { text: 'להגיד ״לילה טוב״ ב־5 לילות', key: 'goodnight', target: 5, route: '/night' },
      { text: 'לתפוס 3 כוכבים נופלים ולבקש משאלה', key: 'wish', target: 3, route: '/night' },
      { text: 'לכתוב מטרות למחר 3 פעמים', key: 'goals_set', target: 3, route: '/night' },
      { text: 'להירדם עם צליל 3 פעמים', key: 'sound', target: 3, route: '/night' },
    ],
  },
  {
    skin: 'phoenix',
    title: you('אלוף הלילה', 'אלופת הלילה'),
    story: `${S.name} של אש, עם להבות על הראש. רק למי ש${you('ניצח', 'ניצחה')} בכל משחקי הלילה.`,
    steps: [
      { text: 'לספור כבשים עד הסוף 3 פעמים', key: 'sheep', target: 3, route: '/night' },
      { text: 'להחזיר את כל הכבשים לדיר ולסגור את השער', key: 'farm', target: 1, route: '/night' },
      { text: `להגיע ל${A} ב״בדרך ל${A}״`, key: 'road', target: 1, route: '/night' },
      { text: 'לאסוף 15 פאוצ׳ים של זוגיות בדרך', key: 'pouch', target: 15, route: '/night' },
    ],
  },
  {
    skin: 'diamond',
    title: 'שבוע של הרפתקאות',
    story: `${S.name} מיהלום, שבוהק כשהאור עובר עליו. נפתח אחרי שבע הרפתקאות יומיות.`,
    steps: [{ text: 'לסיים 7 מסעות יומיים (לא חייב ברצף)', key: 'plans', target: 7 }],
  },
  {
    skin: 'ours',
    title: 'הלב של שנינו',
    story: `ה${S.name} הכי יקר בחנות. לבבות עולים ממנו כל הזמן. הוא שלנו, ולכן הוא דורש קצת מכל דבר.`,
    steps: [
      { text: `לספר ל${A} איך ${you('אתה מרגיש', 'את מרגישה')} ב־5 ימים`, key: 'mood', target: 5, route: '/' },
      { text: 'לפתוח 5 מכתבים', key: 'letter', target: 5, route: '/us?tab=letters#open-when' },
      { text: `לשלוח ל${A} 3 הודעות או ״${you('מתגעגע', 'מתגעגעת')}״`, key: 'reach', target: 3, route: '/' },
      { text: `לעשות 10 דברים טובים בשבילך ב״גם ${you('אתה', 'את')}״`, key: 'c:care', target: 10, route: '/pet' },
      { text: `להגיע עם ה${S.name} לרמה 8`, key: 'level', target: 8, route: '/pet' },
    ],
  },
];

/**
 * The legends this site can reach: steps of modules it doesn't have are left
 * out, and a legend left with nothing becomes "reach level N" instead.
 */
export const LEGENDS: Legend[] = ALL_LEGENDS.map((l, i) => {
  const steps = l.steps.filter((st) => possible(st.key) && !(st.key === 'find' && FRIENDS.length === 0));
  return { ...l, steps: steps.length ? steps : [{ text: `להגיע עם ה${S.name} לרמה ${6 + i * 2}`, key: 'level', target: 6 + i * 2, route: '/pet' }] };
});

export const legendOf = (skin: string) => LEGENDS.find((l) => l.skin === skin);

export function stepValue(s: PetState, key: string) {
  if (key === 'level') return s.level;
  if (key.startsWith('c:')) return s.counters[key.slice(2)] ?? 0;
  return s.counters[`q:${key}`] ?? 0;
}

export const stepDone = (s: PetState, st: Step) => stepValue(s, st.key) >= st.target;
export const legendReady = (s: PetState, skin: string) => {
  const l = legendOf(skin);
  return !!l && l.steps.every((st) => stepDone(s, st));
};

/** Announces a coveted pet the moment its quest is done (once). */
export function checkLegends(s: PetState, out: Notice[]) {
  for (const l of LEGENDS) {
    if (s.legends.includes(l.skin) || !legendReady(s, l.skin)) continue;
    s.legends.push(l.skin);
    const sk = skins.find((x) => x.id === l.skin);
    out.push({ text: `✨ נפתח ${species.name} נחשק: ${sk?.name}! הוא מחכה בחנות`, big: true });
  }
}

/* ───────────── The daily adventure ───────────── */

export type Area = 'site' | 'pet' | 'night';

export interface PlanStepDef {
  key: string;
  text: string;
  target: number;
  route: string;
  area: Area;
}

const ALL_PLAN_POOL: PlanStepDef[] = [
  { key: 'mood', text: `לספר ל${A} איך ${you('אתה מרגיש', 'את מרגישה')} היום`, target: 1, route: '/', area: 'site' },
  { key: 'letter', text: `לפתוח מכתב אחד מ״${you('פתח', 'פתחי')} כש…״`, target: 1, route: '/us?tab=letters#open-when', area: 'site' },
  { key: 'reach', text: `לשלוח ל${A} הודעה, או סתם ״${you('מתגעגע', 'מתגעגעת')}״`, target: 1, route: '/', area: 'site' },
  { key: 'photo_day', text: 'להגדיל את התמונה של היום', target: 1, route: '/', area: 'site' },
  { key: 'gallery', text: 'להציץ בגלריה שלנו', target: 1, route: '/us?tab=gallery', area: 'site' },
  { key: 'dates', text: 'להציץ ביומן הפגישות', target: 1, route: '/dates', area: 'site' },
  { key: 'find', text: 'למצוא חבר אחד שמתחבא באתר (הרמזים בחנות, בסימן השאלה)', target: 1, route: '/pet?open=guide', area: 'site' },
  { key: 'feeds', text: `להאכיל את ה${S.name} 3 פעמים`, target: 3, route: '/pet', area: 'pet' },
  { key: 'pets', text: 'ללטף אותו 25 פעם', target: 25, route: '/pet', area: 'pet' },
  { key: 'baths', text: 'לעשות לו אמבטיה', target: 1, route: '/pet', area: 'pet' },
  { key: 'games', text: 'לשחק איתו 2 משחקים', target: 2, route: '/pet', area: 'pet' },
  { key: 'care', text: `לעשות דבר אחד טוב בשבילך ב״גם ${you('אתה', 'את')}״`, target: 1, route: '/pet', area: 'pet' },
  { key: 'water', text: 'לשתות 4 כוסות מים ולסמן אצלו', target: 4, route: '/pet', area: 'pet' },
  { key: 'dress', text: 'להחליף לו בגד, סקין או חדר', target: 1, route: '/pet', area: 'pet' },
  { key: 'spins', text: 'לסובב את הגלגל היומי', target: 1, route: '/pet', area: 'pet' },
  { key: 'tricks', text: `לגרום ל${S.name} לעשות 3 טריקים סודיים (רמזים ב״ספר הטריקים״)`, target: 3, route: '/pet', area: 'pet' },
  { key: 'combos', text: 'קומבו: 3 טריקים שונים תוך 10 שניות', target: 1, route: '/pet', area: 'pet' },
  { key: 'goodnight', text: 'להגיד ״לילה טוב״ ולהדליק כוכב', target: 1, route: '/night', area: 'night' },
  { key: 'sound', text: 'להפעיל צליל להירדם (מותר לכבות מיד)', target: 1, route: '/night', area: 'night' },
  { key: 'goals_set', text: 'לכתוב מטרה אחת למחר', target: 1, route: '/night', area: 'night' },
  { key: 'sheep', text: 'לספור כבשים עד הסוף', target: 1, route: '/night', area: 'night' },
  { key: 'pouch', text: `לאסוף 3 פאוצ׳ים ב״בדרך ל${A}״`, target: 3, route: '/night', area: 'night' },
  { key: 'farm_play', text: 'לנסות להחזיר את הכבשים לדיר', target: 1, route: '/night', area: 'night' },
  { key: 'wish', text: 'לתפוס כוכב נופל ולבקש משאלה', target: 1, route: '/night', area: 'night' },
];

export const PLAN_POOL: PlanStepDef[] = ALL_PLAN_POOL.filter((d) => possible(d.key));

const stepDef = (key: string) => PLAN_POOL.find((d) => d.key === key);

export interface Plan {
  /** Which adventure this is (1, 2, 3…). */
  n: number;
  /** The day it was handed out. */
  date: string;
  steps: string[];
  prog: Record<string, number>;
  claimed: boolean;
  claimedOn?: string;
}

export const PLAN_REWARD = 150;
/** How many steps of each kind go into one day's adventure. */
const MIX: [Area, number][] = has('night')
  ? [
      ['site', 3],
      ['pet', 2],
      ['night', 2],
    ]
  : [
      ['site', 3],
      ['pet', 4],
    ];

function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return h / 4294967296;
  };
}

export function makePlan(s: PetState, date: string, n: number): Plan {
  const rnd = seeded(`${date}#${n}`);
  const allFound = (s.found ?? []).length >= FRIENDS.length;
  const steps: string[] = [];
  for (const [area, k] of MIX) {
    const pool = PLAN_POOL.filter((d) => d.area === area && !(d.key === 'find' && allFound));
    for (let i = 0; i < k && pool.length; i++) steps.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0].key);
  }
  return { n, date, steps, prog: {}, claimed: false };
}

/** A new adventure is due: none yet, or the last one was finished on an earlier day. */
export const planDue = (s: PetState, today: string) => !s.plan || (s.plan.claimed && (s.plan.claimedOn ?? '') < today);

export function ensurePlan(s: PetState, today: string) {
  if (planDue(s, today)) s.plan = makePlan(s, today, (s.plan?.n ?? 0) + 1);
}

export const planSteps = (p: Plan) => p.steps.map((k) => stepDef(k)).filter((d): d is PlanStepDef => !!d);
export const stepProgress = (p: Plan, d: PlanStepDef) => Math.min(d.target, p.prog[d.key] ?? 0);
export const planDoneCount = (p: Plan) => planSteps(p).filter((d) => stepProgress(p, d) >= d.target).length;
export const planComplete = (p: Plan) => planDoneCount(p) === p.steps.length;

/** Moves today's adventure along when one of its steps is done. */
export function planProgress(s: PetState, key: string, by: number, out: Notice[]) {
  const p = s.plan;
  if (!p || p.claimed || !p.steps.includes(key)) return;
  const d = stepDef(key)!;
  const before = p.prog[key] ?? 0;
  if (before >= d.target) return;
  p.prog[key] = Math.min(d.target, before + by);
  if (p.prog[key] < d.target) return;
  out.push({ text: planComplete(p) ? '🗺️ כל המסע של היום הושלם! הפרס מחכה' : `🗺️ ✓ ${d.text}`, big: planComplete(p) });
}

export function claimPlan(s: PetState, today: string, out: Notice[]) {
  const p = s.plan;
  if (!p || p.claimed || !planComplete(p)) return;
  p.claimed = true;
  p.claimedOn = today;
  s.coins += PLAN_REWARD;
  s.counters.earned = (s.counters.earned ?? 0) + PLAN_REWARD;
  out.push({ text: `🗺️ סיימת הרפתקה! +${PLAN_REWARD} ${COIN}`, big: true });
  bump(s, 'plans', 1, out);
}

/* ───────────── One door for everything ───────────── */

/** Something happened somewhere on the site: count it, move the plan, maybe open a legend. */
export function bump(s: PetState, key: string, by: number, out: Notice[]) {
  s.counters[`q:${key}`] = (s.counters[`q:${key}`] ?? 0) + by;
  planProgress(s, key, by, out);
  checkLegends(s, out);
}

export function findFriend(s: PetState, id: FriendId, out: Notice[]) {
  if (s.found.includes(id)) return false;
  s.found.push(id);
  const f = FRIENDS.find((x) => x.id === id)!;
  out.push({ text: `🔎 מצאת את ${f.name}! (${s.found.length}/${FRIENDS.length})`, big: true });
  s.coins += 25;
  s.counters.earned = (s.counters.earned ?? 0) + 25;
  bump(s, 'find', 1, out);
  return true;
}
