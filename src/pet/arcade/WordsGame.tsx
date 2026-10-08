import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Lightbulb } from 'lucide-react';
import { tap } from '../../lib/haptics';
import { click, right as rightSound, sparkle, tada, wrong as wrongSound } from '../sound';
import { Stage, shuffle, type GameProps } from './kit';
import { content } from '../../client';
import { species } from '../species';

/** [word, clue]: the couple's own (content.wordGame) first, then sweet everyday ones and a few about the pet. */
const BASE: [string, string][] = [
  ['ירח', 'מה זורח מעל שנינו בלילה?'],
  ['שמש', 'מה מעיר אותנו בבוקר דרך התריס?'],
  ['ורד', 'הפרח הכי קלאסי לדייט'],
  ['קפה', 'מה שותים בבוקר כדי להתעורר?'],
  ['סרט', 'מה רואים מכורבלים על הספה?'],
  ['חיוך', 'הדבר הכי יפה בפנים שלך'],
  ['טבעת', 'עגולה, נוצצת, ושמים אותה על האצבע'],
  ['כרית', 'איפה מניחים את הראש בלילה?'],
  ['מכתב', 'מה כותבים ביד ושולחים באהבה?'],
  ['פיצה', 'משולשים, גבינה, וערב בבית'],
  ['עוגה', 'עם נרות, ביום הולדת'],
  ['כוכב', 'נופל, ואז מבקשים משאלה'],
  ['חלום', 'מה רואים כשעוצמים עיניים בלילה?'],
  ['מתנה', 'עטופה בנייר עם סרט'],
  ['בלון', 'ממלאים באוויר ומחזיקים בחוט'],
  ['אהבה', 'מה יש בינינו?'],
  ['ביחד', 'הכי טוב לנו ככה'],
  ['שוקו', 'חם בחורף, קר בקיץ, תמיד מתוק'],
  ['נשיקה', 'מה נותנים כשנפרדים לשנייה?'],
  ['חיבוק', 'שתי ידיים, הרבה אהבה'],
  ['שמיכה', 'מה גונבים אחד מהשני בלילה?'],
  ['תמונה', 'רגע שנשאר לתמיד'],
  ['גלידה', 'שני כדורים, בגביע או בקופסה?'],
  ['שקיעה', 'השמיים נצבעים כתום, ואנחנו מסתכלים'],
  ['זריחה', 'מה רואים אם לא ישנים כל הלילה?'],
  ['געגוע', 'מה מרגישים כשרחוקים?'],
  ['הפתעה', 'משהו שלא מצפים לו, ושמח'],
  ['לתמיד', 'כמה זמן? (התשובה הנכונה)'],
  ['חופשה', 'כמה ימים בלי שעון מעורר'],
  ['מדורה', 'יושבים סביבה וצולים מרשמלו'],
  ['תותים', 'אדומים, מתוקים, ובשוקולד עוד יותר'],
  ['פיקניק', 'שמיכה על הדשא וסל של אוכל'],
  ['שוקולד', 'מה עוזר ביום קשה?'],
  ['מרשמלו', 'לבן, רך, ונמס על האש'],
  ['קולנוע', 'פופקורן, חושך, ומסך ענק'],
  ['מגדלור', 'מאיר לספינות בלילה'],
  ['קרוסלה', 'מסתובבים על סוסים בלונה פארק'],
  ['פרפרים', 'מה מרגישים בבטן בפגישה הראשונה?'],
  ['אופניים', 'שני גלגלים ורוח בפנים'],
  ['סופגניה', 'עגולה, מתוקה, וממולאת בריבה'],
  ['פלייליסט', 'רשימת השירים שלנו'],
  ['טרמפולינה', 'קופצים עליה הכי גבוה שאפשר'],
];

const PET: [string, string][] = [
  [species.name.replace(/\s/g, ''), 'מי גר אצלך בחדר החיות?'],
  [species.staple.name.replace(/\s/g, ''), `מה ה${species.name} אוכל תמיד, בחינם?`],
];

const WORDS: [string, string][] = [...(content.wordGame ?? []), ...BASE, ...PET].filter(([w]) => /^[א-ת]{2,9}$/.test(w));

const WORDS_PER_LEVEL = 4;
const lenFor = (level: number): [number, number] => (level <= 2 ? [3, 4] : level <= 4 ? [4, 5] : level <= 7 ? [5, 6] : [6, 9]);
const EXTRA = 'אבגדהוזחטיכלמנסעפצקרשת';

/**
 * המילים שלנו: a clue, and its letters jumbled. Tap letters into the slots;
 * a slot tapped gives its letter back. Longer words as the levels go, and from
 * level 4 a decoy letter or two. Two hints a level.
 */
export function WordsGame({ level, onEnd, onClose }: GameProps) {
  const set = useMemo(() => {
    const [a, b] = lenFor(level);
    const pool = WORDS.filter(([w]) => w.length >= a && w.length <= b);
    return shuffle(pool).slice(0, WORDS_PER_LEVEL);
  }, [level]);
  const [k, setK] = useState(0);
  const [word, clue] = set[k] ?? set[0];
  const letters = useMemo(() => {
    const extra = level >= 7 ? 2 : level >= 4 ? 1 : 0;
    const decoys = Array.from({ length: extra }, () => EXTRA[Math.floor(Math.random() * EXTRA.length)]);
    let s = shuffle([...word, ...decoys]);
    for (let i = 0; i < 4 && s.join('') === word; i++) s = shuffle(s);
    return s.map((ch, i) => ({ ch, id: i }));
  }, [word, level]);
  const [slots, setSlots] = useState<(number | null)[]>(() => Array(word.length).fill(null));
  const [state, setState] = useState<'play' | 'right' | 'wrong'>('play');
  const [hints, setHints] = useState(2);
  const used = new Set(slots.filter((x): x is number => x !== null));

  const reset = (len: number) => {
    setSlots(Array(len).fill(null));
    setState('play');
  };

  const check = (next: (number | null)[]) => {
    if (next.some((x) => x === null)) return;
    const guess = next.map((i) => letters[i!].ch).join('');
    if (guess === word) {
      setState('right');
      rightSound();
      tap(10);
      window.setTimeout(() => {
        if (k + 1 >= set.length) {
          tada();
          onEnd({ score: level, coins: 12 + level * 4 + hints * 3, level: level + 1 });
          return;
        }
        const nw = set[k + 1][0];
        setK(k + 1);
        reset(nw.length);
      }, 1000);
    } else {
      setState('wrong');
      wrongSound();
      tap(30);
      window.setTimeout(() => setState('play'), 600);
    }
  };

  const put = (id: number) => {
    if (state === 'right' || used.has(id)) return;
    const i = slots.indexOf(null);
    if (i < 0) return;
    const next = slots.slice();
    next[i] = id;
    click();
    tap(4);
    setSlots(next);
    check(next);
  };
  const takeBack = (i: number) => {
    if (state === 'right' || slots[i] === null) return;
    const next = slots.slice();
    next[i] = null;
    click();
    setSlots(next);
  };
  const hint = () => {
    if (!hints || state === 'right') return;
    // put the right letter into the first slot that's empty or wrong
    const next = slots.slice();
    const i = next.findIndex((x, j) => x === null || letters[x].ch !== word[j]);
    if (i < 0) return;
    next[i] = null;
    const id = letters.find((l) => l.ch === word[i] && !next.includes(l.id))?.id;
    if (id === undefined) return;
    next[i] = id;
    setHints((h) => h - 1);
    sparkle();
    setSlots(next);
    check(next);
  };

  return (
    <Stage title="המילים שלנו" level={level} score={`${k + 1}/${set.length}`} onClose={onClose} bg="linear-gradient(#FFF1E3, #FBE7D3)">
      <div className="flex h-full flex-col items-center px-4 pt-4">
        <motion.div
          key={clue}
          initial={{ y: 14, opacity: 0, rotate: 2 }}
          animate={{ y: 0, opacity: 1, rotate: -1 }}
          className="relative w-full max-w-[380px] rounded-[18px] bg-paper px-5 py-5 text-center shadow-[0_16px_30px_-18px_rgb(90_50_20/0.55)]"
        >
          <span className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 rotate-[-3deg] bg-[#F7D9A8]/80" />
          <div className="mb-1 text-[12px] font-bold text-muted">{word.length} אותיות</div>
          <p className="font-serif text-[21px] leading-snug">{clue}</p>
        </motion.div>

        <motion.div className="mt-7 flex flex-wrap justify-center gap-1.5" animate={state === 'wrong' ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.45 }}>
          {slots.map((id, i) => (
            <button
              key={i}
              type="button"
              onClick={() => takeBack(i)}
              className={`flex size-12 items-center justify-center rounded-xl border-2 text-[24px] font-bold transition-colors ${
                state === 'right' ? 'border-[#5DB04F] bg-[#DDF3D5] text-[#2E7A27]' : id !== null ? 'border-[#B5784A] bg-[#FFF8EE]' : 'border-dashed border-[#C9A983] bg-white/40'
              }`}
            >
              {id !== null && (
                <motion.span initial={{ scale: 0.4, y: 12 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
                  {letters[id].ch}
                </motion.span>
              )}
            </button>
          ))}
        </motion.div>

        <div className="mt-8 flex max-w-[360px] flex-wrap justify-center gap-2">
          {letters.map((l, i) => (
            <motion.button
              key={`${word}-${l.id}`}
              type="button"
              onClick={() => put(l.id)}
              disabled={used.has(l.id)}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: used.has(l.id) ? 0.18 : 1, rotate: [-4, 3, -2, 4, -3][i % 5] }}
              transition={{ delay: i * 0.03 }}
              whileTap={{ scale: 0.9 }}
              className="flex size-[54px] items-center justify-center rounded-[12px] bg-[#F4D9A8] text-[26px] font-bold text-[#4A2A15] shadow-[inset_0_-4px_0_rgb(120_70_20/0.25),0_6px_10px_-6px_rgb(90_50_20/0.6)]"
            >
              {l.ch}
            </motion.button>
          ))}
        </div>

        <button
          type="button"
          onClick={hint}
          disabled={!hints || state === 'right'}
          className="mt-8 flex h-11 items-center gap-2 rounded-full bg-paper px-5 font-bold shadow-soft disabled:opacity-40"
        >
          <Lightbulb size={18} /> רמז ({hints})
        </button>
      </div>
    </Stage>
  );
}
