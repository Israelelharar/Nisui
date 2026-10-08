/**
 * "הפגישות שלנו": a diary of their dates, unlocked one a day from the
 * partner's first login, in order. Entries come from the client's content.
 */
import { content } from '../client';

export interface Sticker {
  e: string;
  say: string;
}

export interface DateEntry {
  id: string;
  /** Her own numbering, where she gave one. */
  n?: number;
  /** YYYY-MM-DD. Missing when we don't know it yet. */
  date?: string;
  title: string;
  icon: string;
  /** Her words. " + " separated moments are shown one per line. */
  text: string;
  stickers: Sticker[];
  /** Section header in the diary ("פגישות 130+"). */
  era?: string;
  photoIds?: string[];
}

export const dates: DateEntry[] = content.dates ?? [];

export const unlockedCount = (dayIndex: number, launchDay: number, all: boolean) =>
  all ? dates.length : Math.max(1, Math.min(dates.length, dayIndex - launchDay + 1));
