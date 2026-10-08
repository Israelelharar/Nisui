/**
 * "היום לפני שנה": one small chat moment for each day of the year, from the
 * client's content. f: 'i' = admin, 'd' = partner; t: time. Loaded on demand
 * (it is big), see components/OnThisDay.tsx.
 */
export interface Moment {
  title: string;
  lines: { f: 'i' | 'd'; t: string; x: string }[];
}
