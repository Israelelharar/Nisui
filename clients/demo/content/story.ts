import type { EasterEgg, FuturePlan, Place, TimelineChapter, Word } from '../../../src/content/types';

export const storyInWords = `הכרנו בחתונה של רוני, ליד הבר, בוויכוח על נענע.
הוא רקד הכי גרוע ברחבה, ואני לא הפסקתי לצחוק.
בסוף הערב הוא ביקש את המספר שלי "בשביל להחזיר לי את המוחיטו".
אף פעם לא החזיר. אבל נשאר. ♥️`;

export const timeline: TimelineChapter[] = [
  { id: 'wedding', icon: '💍', title: 'החתונה של רוני', date: '2023-06-02', body: 'ויכוח על מוחיטו, ריקוד מביך אחד, ומספר טלפון על מפית.' },
  {
    id: 'first-msg',
    icon: '💬',
    title: 'ההודעה הראשונה',
    chat: [
      { from: 'admin', text: 'היי, זה המוחיטו מהחתונה' },
      { from: 'partner', text: 'זה היה לימונענע' },
      { from: 'admin', text: 'אז בואי נבדוק את זה שוב. בקפה?' },
      { from: 'partner', text: 'רק אם אתה מזמין 😏' },
    ],
  },
  { id: 'first-date', icon: '☕', title: 'הדייט הראשון', date: '2023-06-09', body: 'שלוש שעות בבית קפה שהיה אמור להיסגר אחרי שעה.', photoId: 'cafe' },
  { id: 'together', icon: '💋', title: 'רשמית ביחד', date: '2023-07-14', body: 'שקיעה, חוף, ושאלה קטנה שהתשובה עליה הייתה "ברור".', photoId: 'sunset-beach' },
  { id: 'hermon', icon: '❄️', title: 'השלג הראשון', date: '2024-01-20', body: 'נסענו לחרמון. איש השלג יצא איש בוץ. אנחנו יצאנו מאוהבים.', photoId: 'snow-walk' },
  { id: 'birthday', icon: '🎂', title: 'העוגה העקומה', date: '2024-04-12', body: 'יום ההולדת הראשון שחגגנו ביחד. העוגה הייתה עקומה, החיוך שלך ישר.', photoId: 'birthday-cake' },
  { id: 'year', icon: '🥂', title: 'שנה', date: '2024-07-14', body: 'שנה שלמה. חזרנו לאותו חוף, ואותה שקיעה הייתה אפילו יותר יפה.' },
  { id: 'today', icon: '🌱', title: 'היום' },
  { id: 'apartment', icon: '🏡', title: 'הדירה הראשונה שלנו', body: 'עם חלון לים, ומטבח שבו מותר לשרוף פסטה.', future: true },
  { id: 'trip', icon: '✈️', title: 'הטיול הגדול', body: 'יפן באביב. פריחת הדובדבן, ואת מנסה לאכול עם מקלות.', future: true },
];

export const chapterMemories: Record<string, string[]> = {
  wedding: ['זוכרת את המלצר? הוא עדיין חושב שזה היה מוחיטו.', 'הריקוד הכי גרוע שלי, והערב הכי טוב.'],
  'first-date': ['שלוש שעות שהרגישו כמו עשר דקות.', 'המלצרית כבר הפכה כיסאות, ואנחנו עוד דיברנו.'],
  together: ['השמיים היו כתומים, ואני הייתי בטוח.', '14.7. מאז זה התאריך שלי.'],
  hermon: ['הידיים קפאו, הלב לא.', 'איש הבוץ הכי יפה שנבנה אי פעם.'],
};

export const todayLines = ['עוד יום שאני בוחר בך מחדש.', 'עוד עמוד בסיפור הכי יפה שאני מכיר.', 'ממשיכים לכתוב, ביחד.', 'כמו ביום הראשון, רק הרבה יותר.'];

export const places: Place[] = [
  { id: 'tlv', name: 'תל אביב', detail: 'החוף והגג', note: 'השקיעה הראשונה, וספירת הכוכבים.', photoIds: ['sunset-beach', 'rooftop-stars'], lat: 32.08, lng: 34.78 },
  { id: 'hermon', name: 'החרמון', detail: 'השלג הראשון', note: 'איש בוץ אחד, שני אנשים קפואים.', photoIds: ['snow-walk'], lat: 33.3, lng: 35.77 },
  { id: 'jerusalem', name: 'ירושלים', detail: 'הגלגל הענק', note: 'את פחדת. אני העמדתי פנים.', photoIds: ['ferris-wheel'], lat: 31.77, lng: 35.21 },
  { id: 'ramon', name: 'מכתש רמון', detail: 'הזריחה', note: 'קמנו ב־4:30 ולא התחרטנו.', photoIds: ['hike'], lat: 30.61, lng: 34.8 },
  { id: 'eilat', name: 'אילת', detail: 'החופשה הראשונה', note: 'שלושה ימים של שמש, שני כוויות, אפס חרטות.', lat: 29.56, lng: 34.95 },
];

export const futurePlans: FuturePlan[] = [
  { id: 'japan', title: 'יפן באביב', line: 'פריחת הדובדבן ורמן בלילה', fromAdminsList: true },
  { id: 'dog', title: 'כלב', line: 'ושנינו נתווכח על השם', fromAdminsList: true },
  { id: 'balloon', title: 'כדור פורח', line: 'רק אם את מחזיקה לי את היד', fromAdminsList: true },
  { id: 'dance', title: 'שיעור ריקוד', line: 'כדי שבחתונה הבאה זה יהיה פחות מביך', fromAdminsList: true },
  { id: 'cabin', title: 'בקתה בצפון', line: 'אח מבוערת ושוקו' },
  { id: 'sunrise', title: 'עוד זריחה', line: 'הפעם עם קפה בטרמוס' },
];

/** Their own little language, born on a long drive. */
export const words: Word[] = [
  { word: 'mumu', he: 'מומו', meaning: 'אני' },
  { word: 'lavi', he: 'לאבי', meaning: 'אוהב / אוהבת' },
  { word: 'tutu', he: 'טוטו', meaning: 'אותך' },
  { word: 'ploop', he: 'פלופ', meaning: 'נשיקה' },
  { word: 'snooz', he: 'סנוז', meaning: 'לילה' },
  { word: 'bimbi', he: 'בימבי', meaning: 'טוב' },
  { word: 'zuzu', he: 'זוזו', meaning: 'בוקר' },
  { word: 'kiko', he: 'קיקו', meaning: 'שלי' },
];
export const wordsOrigin = 'השפה שהמצאנו בנסיעה לאילת, אי שם אחרי מצפה רמון.';

export const ourWords = [
  { word: 'לימונענע', meaning: 'כל משקה עם עלה ירוק', origin: 'מהוויכוח בחתונה של רוני', when: 'יוני 2023' },
  { word: 'איש בוץ', meaning: 'כל תוכנית שלא יצאה כמו שתכננו, ועדיין הייתה מושלמת', origin: 'מהחרמון', when: 'ינואר 2024' },
];

export const phrases = [
  { text: 'mumu lavi tutu', he: 'אני אוהב אותך' },
  { text: 'snooz bimbi kiko', he: 'לילה טוב שלי' },
  { text: 'zuzu bimbi', he: 'בוקר טוב' },
];

export const easterEggs: Record<string, EasterEgg> = {
  mojito: { id: 'mojito', lines: ['זה היה לימונענע. 😌', 'מוחיטו. סוף דיון.', 'נסכים שזה היה טעים.'] },
  firstGame: { id: 'firstGame', lines: ['יפה מצידך לנסות 😏', 'ברור שיואב. היה צריך לשאול?'] },
  sock: { id: 'sock', lines: ['גרב. שוב. איך היא הגיעה לכאן?', 'מצאת את הגרב! היא הייתה אבודה 3 ימים.'] },
  ace: { id: 'ace', lines: ['A. תמיד מספר 1.'] },
};

export const jokes = [
  { egg: 'mojito', bubbles: [{ from: 'admin' as const, text: 'מוחיטו?' }, { from: 'partner' as const, text: 'לימונענע.' }] },
  { bubbles: [{ from: 'admin' as const, text: 'מי שרף את הפסטה?' }, { from: 'partner' as const, text: 'אנחנו. ביחד. כצוות.' }] },
];

export const homeSticker = { label: 'לימונענע', egg: 'mojito' };
