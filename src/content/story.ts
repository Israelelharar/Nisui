import type { EasterEgg, FuturePlan, Place, TimelineChapter, Word } from './types';
import { content } from '../client';
import * as d from '../client/defaults';

/** A paragraph in the partner's own words. */
export const storyInWords: string | undefined = content.storyInWords;

/** The story. Future chapters are "הפרקים שעוד נכתוב", never presented as fact. */
export const timeline: TimelineChapter[] = content.timeline ?? [];

export const places: Place[] = content.places ?? [];

export const futurePlans: FuturePlan[] = content.futurePlans ?? [];

/** The secret language. */
export const words: Word[] = content.words ?? [];
export const wordsOrigin: string | undefined = content.wordsOrigin;

/** Words that grew by themselves in the chat. */
export const ourWords = content.ourWords ?? [];

export const phrases = content.phrases ?? [];

export const easterEggs: Record<string, EasterEgg> = { ...d.easterEggs, ...content.easterEggs };

/** The "היום" chapter gets a new line every day. */
export const todayLines: string[] = content.todayLines?.length ? content.todayLines : d.todayLines;

/** One chapter a day gets a spotlight and a small "remember?" line. */
export const chapterMemories: Record<string, string[]> = content.chapterMemories ?? {};
