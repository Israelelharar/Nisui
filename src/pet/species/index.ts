import { client } from '../../client';
import type { Species, SpeciesId } from './types';
import { p } from '../../lib/he';

export type { Species, SpeciesId };

export const SPECIES: Record<SpeciesId, Species> = {
  guineaPig: {
    id: 'guineaPig',
    name: 'שרקן',
    plural: 'שרקנים',
    small: 'שרקן קטן',
    sound: 'ויק ויק!',
    happyMove: 'קופץ פופקורן',
    coin: '🌻',
    coinName: 'גרעיני חמנייה',
    staple: { name: 'חציר', emoji: '🌾' },
    facts: [
      'שרקנים קופצים באוויר כשהם שמחים. קוראים לזה פופקורן.',
      'שרקנים מדברים: "ויק ויק" אומר "אני מחכה לאוכל".',
      'השיניים של שרקן לא מפסיקות לגדול, לכן הוא לועס כל היום.',
      'שרקנים צריכים ויטמין C מהאוכל, כמו בני אדם.',
      'שרקן מרוצה עושה "פררר" שקט, כמו חתול קטן.',
    ],
    names: ['פופקורן', 'ג׳ינג׳ר', 'מוקה', 'שוקו', 'קינמון'],
  },
  cat: {
    id: 'cat',
    name: 'חתול',
    plural: 'חתולים',
    small: 'חתלתול',
    sound: 'מיאו!',
    happyMove: 'מגרגר ומתחכך',
    coin: '🐟',
    coinName: 'דגיגים',
    staple: { name: 'כופתיות', emoji: '🥣' },
    foods: {
      lettuce: { name: 'טונה', emoji: '🥫' },
      cucumber: { name: 'חלב', emoji: '🥛' },
      parsley: { name: 'נענע חתולים', emoji: '🌿' },
      carrot: { name: 'עוף', emoji: '🍗' },
      pepper: { name: 'סלמון', emoji: '🍣' },
      corn: { name: 'שרימפס', emoji: '🍤' },
      apple: { name: 'גבינה', emoji: '🧀' },
      strawberry: { name: 'יוגורט', emoji: '🍦' },
      watermelon: { name: 'דג שלם', emoji: '🐟' },
    },
    facts: [
      'חתולים ישנים בערך 15 שעות ביום.',
      'גרגור של חתול הוא גם דרך להרגיע את עצמו.',
      `חתול שמראה לך את הבטן סומך ${p('עליך', 'עלייך')} מאוד.`,
      'חתולים "מקמצים" בכפות כשהם מרגישים בבית.',
      'מצמוץ איטי של חתול זה "אני אוהב אותך".',
    ],
    names: ['מיצי', 'לואי', 'פיצ׳י', 'שוקו', 'מאפין'],
  },
  dog: {
    id: 'dog',
    name: 'כלבלב',
    plural: 'כלבלבים',
    small: 'כלבלב קטן',
    sound: 'הב הב!',
    happyMove: 'מכשכש בזנב',
    coin: '🦴',
    coinName: 'עצמות',
    staple: { name: 'כופתיות', emoji: '🥣' },
    foods: {
      lettuce: { name: 'מלפפון', emoji: '🥒' },
      cucumber: { name: 'ביסקוויט', emoji: '🍪' },
      parsley: { name: 'אורז', emoji: '🍚' },
      carrot: { name: 'גזר', emoji: '🥕' },
      pepper: { name: 'עוף', emoji: '🍗' },
      corn: { name: 'נקניקייה', emoji: '🌭' },
      apple: { name: 'תפוח', emoji: '🍎' },
      strawberry: { name: 'סטייק', emoji: '🥩' },
      watermelon: { name: 'עצם גדולה', emoji: '🦴' },
    },
    facts: [
      'כלבים מבינים מאות מילים, והכי טוב את השם שלהם.',
      'האף של כלב רגיש פי עשרת אלפים משלנו.',
      'כלב שמכשכש לצד ימין שמח במיוחד.',
      'כלבים מפהקים גם כדי להירגע.',
      'כלב שמביא לך צעצוע רוצה לשתף אותך.',
    ],
    names: ['צ׳אפי', 'לאקי', 'ביסלי', 'רקסי', 'מקס'],
  },
  bunny: {
    id: 'bunny',
    name: 'ארנבון',
    plural: 'ארנבונים',
    small: 'ארנבון קטן',
    sound: 'פרררר!',
    happyMove: 'קופץ בינקי',
    coin: '🥕',
    coinName: 'גזרים',
    staple: { name: 'חציר', emoji: '🌾' },
    facts: [
      'ארנבונים קופצים ומסתובבים באוויר כשהם שמחים. קוראים לזה בינקי.',
      'ארנבון שוכב על הצד ברגליים מתוחות מרגיש בטוח לגמרי.',
      'האוזניים של ארנבון מסתובבות כמעט לכל כיוון.',
      'ארנבונים לועסים חציר כל היום, זה שומר על השיניים.',
      `ארנבון שמלקק אותך אומר "${p('אתה שלי', 'את שלי')}".`,
    ],
    names: ['פופקורן', 'שלגי', 'קפצון', 'מרשמלו', 'צמרי'],
  },
};

/** In dev, `?species=cat` previews another animal (for showing a client the options). */
const preview = import.meta.env.DEV && typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('species') as SpeciesId | null) : null;

/** This site's pet. */
export const species: Species = SPECIES[preview && preview in SPECIES ? preview : (client.pet?.species ?? 'guineaPig')];
