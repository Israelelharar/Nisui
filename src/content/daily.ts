import type { DailyLine, Slot, WeekendMode } from './types';
import { content } from '../client';
import * as d from '../client/defaults';

const or = <T,>(xs: T[] | undefined, fallback: T[]) => (xs && xs.length ? xs : fallback);

/** Nicknames rotate by day. Never all at once. */
export const nicknames: string[] = or(content.nicknames, d.nicknames);

/** Greeting per part of the day. `{n}` is replaced with the nickname of the day. */
export const greetings: Record<Slot, { title: string; sub: string }[]> = Object.fromEntries(
  (Object.keys(d.greetings) as Slot[]).map((s) => [s, or(content.greetings?.[s], d.greetings[s])]),
) as Record<Slot, { title: string; sub: string }[]>;

/** Weekend banner copy (the optional weekend cycle). */
export const weekendCopy: Record<WeekendMode, { title: string; sub: string }> = { ...d.weekendCopy, ...content.weekendCopy };

/** "Today X wants to remind you…" One per day, no repeats until the pool runs out. */
export const dailyLines: DailyLine[] = or(content.dailyLines, d.dailyLines);

/** Questions of the day. The answer goes only to the admin. */
export const dailyQuestions: string[] = or(content.dailyQuestions, d.dailyQuestions);
