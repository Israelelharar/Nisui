import { lazy, type ComponentType } from 'react';
import type { GameProps } from './kit';
import { A, p } from '../../lib/he';
import { species } from '../species';
import { photos } from '../../content/photos';

export type Shelf = 'ours' | 'action' | 'mind';

export interface GameInfo {
  id: string;
  name: string;
  desc: string;
  shelf: Shelf;
  /** Key of the game's drawn icon (see ArcadeIcon). */
  icon: string;
  /** The box color on the shelf. */
  color: string;
  /** Games he plays with her (they tire him out and need him awake). */
  care?: boolean;
  /** Has three hearts. */
  hearts?: boolean;
  /** Puzzle games continue from the level she reached last time. */
  keepsLevel?: boolean;
  /** What the best score means in the result card ("שלב", "נקודות"…). */
  unit?: string;
  Component: ComponentType<GameProps>;
}

const L = <K extends string>(load: () => Promise<Record<K, ComponentType<GameProps>>>, name: K) =>
  lazy(async () => ({ default: (await load())[name] }));

export const GAMES: GameInfo[] = ([
  // ── שלנו ──
  { id: 'trivia', name: `כמה ${p('אתה מכיר', 'את מכירה')} אותנו?`, desc: 'טריוויה עלינו, על האתר ועל החבר הקטן', shelf: 'ours', icon: 'quiz', color: '#F7B9C8', hearts: true, Component: L(() => import('./TriviaGame'), 'TriviaGame') },
  { id: 'draw', name: 'הסטודיו לציור', desc: `לצייר, לשמור בגלריה, ולהקדיש ל${A}`, shelf: 'ours', icon: 'brush', color: '#FFE08A', Component: L(() => import('./DrawGame'), 'DrawGame') },
  { id: 'memory', name: 'זיכרון של תמונות', desc: 'זוגות מהתמונות שלנו, ובכל שלב יותר קלפים', shelf: 'ours', icon: 'cards', color: '#BFE3FF', care: true, keepsLevel: true, unit: 'שלב', Component: L(() => import('../games'), 'MemoryGame') },
  { id: 'puzzle', name: 'פאזל הזזה', desc: 'תמונה שלנו מפורקת לריבועים. להחזיר אותה', shelf: 'ours', icon: 'puzzle', color: '#CFEFC2', keepsLevel: true, unit: 'שלב', Component: L(() => import('./PuzzleGame'), 'PuzzleGame') },
  { id: 'words', name: 'המילים שלנו', desc: 'אותיות מבולבלות. לסדר אותן למילה', shelf: 'ours', icon: 'letters', color: '#FFD3B0', keepsLevel: true, unit: 'שלב', Component: L(() => import('./WordsGame'), 'WordsGame') },
  // ── אקשן ──
  { id: 'space', name: 'חלליות', desc: 'הוא בחללית, החייזרים בדרך. 3 לבבות', shelf: 'action', icon: 'rocket', color: '#B9A6F2', hearts: true, Component: L(() => import('./SpaceGame'), 'SpaceGame') },
  { id: 'flappy', name: `${species.name} מעופף`, desc: 'נוגעים והוא מנפנף. לעבור בין הגזרים', shelf: 'action', icon: 'wing', color: '#A9DDF7', hearts: true, Component: L(() => import('./FlappyGame'), 'FlappyGame') },
  { id: 'runner', name: 'הריצה הגדולה', desc: `הוא רץ, ${p('אתה קופץ', 'את קופצת')}. כל הזמן יותר מהר`, shelf: 'action', icon: 'shoe', color: '#FFC89A', hearts: true, Component: L(() => import('./RunnerGame'), 'RunnerGame') },
  { id: 'slice', name: 'חותכים פירות', desc: 'מחליקים את האצבע וחותכים. לא את הפצצות!', shelf: 'action', icon: 'knife', color: '#FFB3B3', hearts: true, Component: L(() => import('./SliceGame'), 'SliceGame') },
  { id: 'breakout', name: 'שוברים לבבות', desc: 'כדור, משטח ולבבות לשבור', shelf: 'action', icon: 'bricks', color: '#F9A8C6', hearts: true, Component: L(() => import('./BreakoutGame'), 'BreakoutGame') },
  { id: 'jumper', name: 'קופץ לירח', desc: 'מטים את האצבע, והוא קופץ מענן לענן', shelf: 'action', icon: 'moon', color: '#C9D6FF', hearts: true, Component: L(() => import('./JumperGame'), 'JumperGame') },
  { id: 'balloons', name: 'בלונים', desc: 'לפוצץ בלונים לפני שהם בורחים', shelf: 'action', icon: 'balloon', color: '#FFCFE0', hearts: true, Component: L(() => import('./BalloonGame'), 'BalloonGame') },
  { id: 'piano', name: 'פסנתר', desc: 'לנגן את האריחים בזמן. השיר מאיץ', shelf: 'action', icon: 'piano', color: '#E6E0D8', hearts: true, Component: L(() => import('./PianoGame'), 'PianoGame') },
  { id: 'snake', name: `רכבת ${species.plural}`, desc: 'לאסוף גזרים, והרכבת מתארכת', shelf: 'action', icon: 'train', color: '#BDE8B0', hearts: true, Component: L(() => import('./SnakeGame'), 'SnakeGame') },
  { id: 'catch', name: 'תופסים ירקות', desc: 'לתפוס ירקות, לא בצל. 3 לבבות', shelf: 'action', icon: 'basket', color: '#FFE3A8', care: true, hearts: true, Component: L(() => import('../games'), 'CatchGame') },
  { id: 'peek', name: `איפה ה${species.name}?`, desc: 'ללחוץ כשהוא מציץ. החתול? לא!', shelf: 'action', icon: 'box', color: '#D9C2A6', care: true, hearts: true, Component: L(() => import('../games'), 'PeekGame') },
  // ── חשיבה ──
  { id: 'stack', name: 'מגדל עוגה', desc: 'עוצרים כל שכבה בדיוק מעל הקודמת', shelf: 'mind', icon: 'cake', color: '#FFD9E6', Component: L(() => import('./StackGame'), 'StackGame') },
  { id: 'merge', name: 'מחברים ירקות', desc: 'מחליקים ומחברים: חסה + חסה = גזר…', shelf: 'mind', icon: 'grid', color: '#FFE9B8', Component: L(() => import('./MergeGame'), 'MergeGame') },
  { id: 'sort', name: 'מיון צבעים', desc: 'למזוג כל צבע לבקבוק משלו', shelf: 'mind', icon: 'tubes', color: '#C8EDE6', keepsLevel: true, unit: 'שלב', Component: L(() => import('./SortGame'), 'SortGame') },
  { id: 'connect', name: 'ארבע בשורה', desc: 'נגדו. הוא נהיה חכם יותר בכל ניצחון', shelf: 'mind', icon: 'discs', color: '#FFC2C2', keepsLevel: true, unit: 'שלב', Component: L(() => import('./ConnectGame'), 'ConnectGame') },
  { id: 'find', name: p('מצא אותו', 'מצאי אותו'), desc: 'הוא מתחבא בין המון דברים. איפה הוא?', shelf: 'mind', icon: 'glass', color: '#D7E7FF', keepsLevel: true, unit: 'שלב', Component: L(() => import('./FindGame'), 'FindGame') },
  { id: 'simon', name: `ה${species.name} אומר`, desc: 'לזכור את הרצף ולחזור עליו', shelf: 'mind', icon: 'xylophone', color: '#E5D4FF', care: true, Component: L(() => import('../games'), 'SimonGame') },
] as GameInfo[]).filter((g) => (g.id === 'memory' ? photos.length >= 6 : g.id === 'puzzle' ? photos.length >= 1 : true));

export type GameId = string;
export const gameById = (id: string) => GAMES.find((g) => g.id === id);

export const SHELVES: { id: Shelf; name: string; line: string }[] = [
  { id: 'ours', name: 'המשחקים שלנו', line: 'עלינו, על התמונות ועל המילים' },
  { id: 'action', name: 'אקשן', line: 'מהיר, ונהיה מהיר יותר' },
  { id: 'mind', name: 'חשיבה', line: `בלי שעון. רק ${p('אתה', 'את')} והראש` },
];

/** One game a day gets the big spot, so the arcade feels a little different every day. */
export function gameOfTheDay(day: number) {
  const pool = GAMES.filter((g) => !g.care);
  return pool[((day % pool.length) + pool.length) % pool.length];
}
