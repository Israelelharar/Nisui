import type { ClientContent } from '../../../src/client/schema';
import { adminNotes, partnerNotes, togetherNotes } from './notes';
import { photos } from './photos';
import { book, bookParts } from './book';
import { dates } from './dates';
import * as story from './story';
import * as x from './extras';

/** Everything Noa sees (the demo couple). Each list is optional; see src/client/schema.ts. */
export const content: ClientContent = {
  nicknames: x.nicknames,
  dailyLines: x.dailyLines,
  adminNotes,
  partnerNotes,
  togetherNotes,
  bookParts,
  book,
  dates,
  photos,
  storyInWords: story.storyInWords,
  timeline: story.timeline,
  chapterMemories: story.chapterMemories,
  todayLines: story.todayLines,
  places: story.places,
  futurePlans: story.futurePlans,
  words: story.words,
  wordsOrigin: story.wordsOrigin,
  ourWords: story.ourWords,
  phrases: story.phrases,
  easterEggs: story.easterEggs,
  jokes: story.jokes,
  homeSticker: story.homeSticker,
  openWhen: x.openWhen,
  vouchers: x.vouchers,
  surprises: x.surprises,
  trivia: x.trivia,
  wordGame: x.wordGame,
  chatStats: x.chatStats,
  onThisDay: () => import('./onThisDay').then((m) => m.moments),
};
