import type { Features } from './schema';

/**
 * Starting points for a client's `features`. Spread one and override:
 *   features: { ...presets.full, night: false }
 */
const full: Features = {
  welcome: true,
  letters: true,
  book: true,
  dates: true,
  journal: true,
  story: true,
  gallery: true,
  places: true,
  music: true,
  future: true,
  words: true,
  openWhen: true,
  strength: true,
  contact: true,
  vouchers: true,
  surprises: true,
  countdown: true,
  onThisDay: true,
  messageClock: true,
  mood: true,
  night: true,
  pet: true,
  friends: true,
  sock: true,
};

const off = Object.fromEntries(Object.keys(full).map((k) => [k, false])) as unknown as Features;

/** Letters and photos, the heart of it, without games. */
const lettersAndPhotos: Features = {
  ...off,
  welcome: true,
  letters: true,
  gallery: true,
  story: true,
  openWhen: true,
  strength: true,
  contact: true,
  countdown: true,
  mood: true,
};

/** Only the photos: one a day, a gallery, and a countdown. */
const photosOnly: Features = { ...off, welcome: true, gallery: true, countdown: true };

export const presets = { full, lettersAndPhotos, photosOnly };
