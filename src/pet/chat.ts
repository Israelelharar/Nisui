/**
 * Talking with the pet in Hebrew. The partner says something (out loud, if the phone can
 * understand speech, or by tapping a sentence) and he answers, written in his
 * bubble and read aloud in a squeaky Hebrew voice when the phone has one.
 * Nothing leaves the phone except what the browser's own speech recognition does.
 */
import type { PetState } from './engine';
import { species } from './species';
import { foodName } from './catalog';
import { A, P, a, p } from '../lib/he';

interface Topic {
  /** What the button says. */
  say: string;
  /** Words that, heard anywhere in the sentence, mean this topic. */
  keys: string[];
  reply: (p: PetState) => string[];
}

const S = species;
const carrot = foodName('carrot');
const treat = foodName('strawberry');

const TOPICS: Topic[] = [
  {
    say: 'מה שלומך?',
    keys: ['שלומך', 'מה נשמע', 'מה קורה', 'איך אתה', 'איך היה', 'מה איתך'],
    reply: (pet) =>
      pet.stats.hunger < 35
        ? [`האמת? רעב. אבל עכשיו ש${p('אתה', 'את')} פה, יותר טוב`]
        : pet.stats.happy < 40
          ? [`קצת משעמם לי… אבל עכשיו ${p('אתה מדבר', 'את מדברת')} איתי, אז מצוין`]
          : ['מעולה! אכלתי, ישנתי, וחיכיתי לך 🧡', `הכי טוב שיש. ו${p('אתה', 'את')}?`],
  },
  {
    say: `אני ${p('אוהב', 'אוהבת')} אותך`,
    keys: ['אוהבת אותך', 'אוהב אותך', 'אוהבת'],
    reply: () => [`גם אני אוהב אותך!!! ${S.sound} 💗`, `אני יודע. אבל ${p('תגיד', 'תגידי')} שוב 🥹`, `הכי בעולם. יותר מ${carrot}.`],
  },
  {
    say: 'אתה רעב?',
    keys: ['רעב', 'לאכול', 'אוכל', 'ארוחה'],
    reply: (pet) => (pet.stats.hunger < 50 ? [`כן!! מאוד! ${carrot}? כל דבר!`, 'הבטן שלי עושה קורקורקור'] : [`לא כרגע, אני מלא. אבל ל${treat} אני תמיד מוכן`]),
  },
  {
    say: 'ספר לי בדיחה',
    keys: ['בדיחה', 'תצחיק', 'מצחיק'],
    reply: () => [`מה עושה ${S.name} במעלית? עולה בדרגה!`, `למה ה${S.name} לא משחק קלפים? כי תמיד רואים לו על הפנים כשיש לו יד טובה 🤭`, 'מה אמר הכרית לשמיכה? אני מכסה אותך!'],
  },
  { say: 'אתה הכי חמוד', keys: ['חמוד', 'מתוק', 'יפה', 'מושלם'], reply: () => [`אני יודע 😌 אבל ${p('אתה', 'את')} יותר`, 'נכון. ותודה. אני מסמיק', 'שמעת את זה? אני מתעלף'] },
  { say: 'בוא נשחק', keys: ['לשחק', 'נשחק', 'משחק'], reply: () => ['כן כן כן! לחדר המשחקים! 🎾', 'רק אם אני מנצח 😏'] },
  {
    say: `מה עם ${A}?`,
    keys: [A],
    reply: () => [`${A}? ${a('הוא הכי מתגעגע', 'היא הכי מתגעגעת')} ${p('אליך', 'אלייך')} בעולם 💞`, `${a('הוא אמר', 'היא אמרה')} לי לשמור ${p('עליך', 'עלייך')}. אני שומר.`, `ראיתי ${a('אותו מחייך כשהוא חושב', 'אותה מחייכת כשהיא חושבת')} ${p('עליך', 'עלייך')}`],
  },
  { say: 'בוקר טוב', keys: ['בוקר'], reply: () => ['בוקר טוב שמש שלי ☀️', `בוקר! כבר חיכיתי ש${p('תתעורר', 'תתעוררי')}`] },
  {
    say: 'לילה טוב',
    keys: ['לילה טוב', 'לישון', 'עייפה', 'עייף', 'חלומות'],
    reply: () => [`לילה טוב… ${p('תחלום', 'תחלמי')} עליי 🌙`, `אל ${p('תשכח', 'תשכחי')} לשתות מים לפני השינה 💧`, `אני כבר מתכסה ב${S.staple.name}`],
  },
  {
    say: `אני ${p('עצוב', 'עצובה')}`,
    keys: ['עצובה', 'עצוב', 'בוכה', 'קשה לי', 'רע לי'],
    reply: () => [`${p('בוא', 'בואי')}, חיבוק ענק 🤗`, `אני פה. תמיד. וגם ${A}.`, 'זה יעבור. ואני אחכה איתך עד שזה יעבור'],
  },
  { say: `אני ${p('שמח', 'שמחה')}`, keys: ['שמחה', 'שמח', 'מאושרת', 'מאושר', 'כיף'], reply: () => [`יש!!! אז גם אני! ${S.sound} 🎉`, `כש${p('אתה שמח', 'את שמחה')}, ה${S.name} שמח`] },
  { say: 'אתה מתגעגע?', keys: ['מתגעגע', 'מתגעגעת', 'געגוע'], reply: () => [`כל דקה ש${p('אתה', 'את')} לא פה 🥺`, 'כן. ספרתי את השניות.'] },
  {
    say: 'ספר לי סוד',
    keys: ['סוד'],
    reply: () => [`פסס… ${A} ${a('מדבר', 'מדברת')} ${p('עליך', 'עלייך')} כל הזמן 🤫`, `יש לי טריקים סודיים. ${p('נסה', 'נסי')} לגעת בי בכל מיני צורות`, `אני מחביא ${S.staple.name} מתחת לכרית`],
  },
  { say: 'על מה אתה חולם?', keys: ['חולם', 'חלום'], reply: () => [`על שדה ענק של ${carrot}. ו${p('עליך', 'עלייך')}.`, 'שאני עף. ואז נוחת בתוך עוגה 🎂'] },
  { say: 'איך קוראים לך?', keys: ['קוראים לך', 'השם שלך', 'שמך'], reply: (pet) => [`${pet.name}! השם הכי יפה ל${S.name}`, `אני ${pet.name}. וה${S.name} הכי מאושר בעולם`] },
  { say: 'כמה אתה גדול?', keys: ['בן כמה', 'גדול', 'גיל'], reply: () => [`כל יום קצת יותר! ${p('תסתכל', 'תסתכלי')} בתפריט`, 'גדול מספיק בשביל עוד חטיף'] },
  { say: 'תשיר לי', keys: ['שיר', 'תשיר', 'לשיר'], reply: () => [`${S.sound} לה לה לה, ${P} ${p('הוא הכי יפה', 'היא הכי יפה')} 🎶`, `${S.sound}… (זה הלהיט שלי)`] },
  { say: 'מואה', keys: ['מואה', 'נשיקה', 'נשיקות', 'מוואה'], reply: () => ['מוווואההה 😘', 'מואה מואה מואה!', 'נשיקה רטובה בחזרה 🥹'] },
  { say: 'מה אתה יודע?', keys: ['עובדה', 'יודע', 'תלמד'], reply: () => S.facts },
  { say: 'ביי', keys: ['ביי', 'להתראות', 'ביוש'], reply: () => ['ביי ♥️', `${p('תחזור', 'תחזרי')} מהר`, 'כבר מתגעגע'] },
  { say: 'תודה', keys: ['תודה'], reply: () => ['בשבילך? הכל 💛', `אין על מה. בעצם יש: על ${treat}`] },
];

const SOMETHING = [`לא הבנתי הכל, אבל אני אוהב כש${p('אתה מדבר', 'את מדברת')} איתי 🧡`, `מעניין! ${p('ספר', 'ספרי')} עוד`, 'וואו. באמת?', 'אני מקשיב. תמיד.'];

export const chatTopics = TOPICS.map((t) => t.say);

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** The pet's answer to whatever was said (a spoken sentence, or one of the buttons). */
export function answer(pet: PetState, said: string) {
  const text = said.replace(/[^֐-׿a-z0-9 ]/gi, ' ');
  let best: Topic | null = null;
  let hits = 0;
  for (const t of TOPICS) {
    const n = t.keys.filter((k) => text.includes(k)).length + (t.say === said ? 5 : 0);
    if (n > hits) {
      hits = n;
      best = t;
    }
  }
  return best ? pick(best.reply(pet)) : pick(SOMETHING);
}

/** Reads his answer aloud, in Hebrew and a bit squeaky, when the phone has a Hebrew voice. */
export function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[\p{Extended_Pictographic}‍️]/gu, ''));
    u.lang = 'he-IL';
    const he = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('he') || v.lang.toLowerCase().startsWith('iw'));
    if (he) u.voice = he;
    u.pitch = 1.8;
    u.rate = 1.05;
    synth.speak(u);
  } catch {
    /* no voice: the bubble says it */
  }
}

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const Rec = () => {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

export const canHear = () => !!Rec();

/** Listens for one sentence in Hebrew. Resolves with what was said, or '' if nothing was understood. */
export function hearOnce(): Promise<string> {
  return new Promise((resolve) => {
    const R = Rec();
    if (!R) return resolve('');
    const r = new R();
    r.lang = 'he-IL';
    r.interimResults = false;
    r.maxAlternatives = 1;
    let said = '';
    r.onresult = (e) => {
      said = e.results[0]?.[0]?.transcript ?? '';
    };
    r.onerror = () => resolve('');
    r.onend = () => resolve(said);
    try {
      r.start();
    } catch {
      resolve('');
    }
  });
}
