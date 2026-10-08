import { client, partner } from '../client';
import { A } from './he';
import type { Clock } from './time';

const dayOf = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);

export const daysSince = (iso: string, c: Clock) => c.dayIndex - dayOf(iso);

/** Hebrew calendar day and month (en month names: "Adar", "Adar I", "Adar II", …). */
function hebrewDate(iso: string) {
  const parts = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long', timeZone: 'UTC' }).formatToParts(new Date(`${iso}T12:00:00Z`));
  return { day: Number(parts.find((p) => p.type === 'day')?.value), month: parts.find((p) => p.type === 'month')?.value ?? '' };
}

const HE_MONTHS: Record<string, string> = {
  Tishri: 'תשרי', Heshvan: 'חשוון', Kislev: 'כסלו', Tevet: 'טבת', Shevat: 'שבט', Adar: 'אדר', 'Adar I': 'אדר א׳', 'Adar II': 'אדר ב׳',
  Nisan: 'ניסן', Iyar: 'אייר', Sivan: 'סיוון', Tamuz: 'תמוז', Av: 'אב', Elul: 'אלול',
};
const HE_DAYS = ['', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳', 'י׳', 'י״א', 'י״ב', 'י״ג', 'י״ד', 'ט״ו', 'ט״ז', 'י״ז', 'י״ח', 'י״ט', 'כ׳', 'כ״א', 'כ״ב', 'כ״ג', 'כ״ד', 'כ״ה', 'כ״ו', 'כ״ז', 'כ״ח', 'כ״ט', 'ל׳'];

/** Birthdays (Gregorian and Hebrew), anniversaries, and every 100 days together / since they met. */
export function specialDay(c: Clock): { title: string; sub: string } | null {
  const md = c.date.slice(5);
  const bd = client.birthday;
  const { met, together, metLabel } = client.dates;
  if (bd && md === bd.gregorian.slice(5)) {
    const age = Number(c.date.slice(0, 4)) - Number(bd.gregorian.slice(0, 4));
    return { title: `יום הולדת ${age} שמח, ${partner.name} 🎂`, sub: `היום כל האתר חוגג אותך. ו${A} הכי.` };
  }
  if (bd?.hebrewDay && bd.hebrewMonth) {
    const h = hebrewDate(c.date);
    // Born in Adar (or Adar II): in a leap year it's Adar II.
    const months = bd.hebrewMonth.startsWith('Adar') ? ['Adar', 'Adar II'] : [bd.hebrewMonth];
    if (h.day === bd.hebrewDay && months.includes(h.month)) {
      return { title: `היום ${HE_DAYS[bd.hebrewDay]} ב${HE_MONTHS[bd.hebrewMonth] ?? bd.hebrewMonth} 🎂`, sub: 'יום ההולדת העברי שלך. עוד סיבה לחגוג.' };
    }
  }
  const years = (iso: string) => Number(c.date.slice(0, 4)) - Number(iso.slice(0, 4));
  if (met && md === met.slice(5) && years(met) > 0) {
    return { title: `${years(met)} ${years(met) === 1 ? 'שנה' : 'שנים'} מאז שהכרנו ✨`, sub: metLabel ? `${metLabel}. היום שהכל התחיל.` : 'היום שהכל התחיל.' };
  }
  if (md === together.slice(5) && years(together) > 0) {
    return { title: `${years(together) === 1 ? 'שנה' : `${years(together)} שנים`} ביחד 💋`, sub: 'ומאז, כל יום עוד קצת.' };
  }
  const t = daysSince(together, c);
  if (t > 0 && t % 100 === 0) {
    return { title: `${t.toLocaleString('he-IL')} ימים ביחד 🎉`, sub: t % 1000 === 0 ? 'אלף ימים. ועוד אלפים בדרך.' : 'ספרנו. כל אחד מהם.' };
  }
  if (met) {
    const m = daysSince(met, c);
    if (m > 0 && m % 100 === 0) return { title: `${m.toLocaleString('he-IL')} ימים מאז שהכרנו ✨`, sub: 'ועדיין רק בהתחלה.' };
  }
  return null;
}

/** The next "every 100 days together" milestone, for the counter in "אנחנו". */
export function nextMilestone(c: Clock) {
  const t = daysSince(client.dates.together, c);
  const next = (Math.floor(t / 100) + 1) * 100;
  return { days: next, in: next - t };
}
