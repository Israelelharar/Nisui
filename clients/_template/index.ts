import profile from './profile.json';
import { defineClient } from '../../src/client/define';
import { presets } from '../../src/client/presets';
import { content } from './content';

/**
 * A new couple, step by step (docs/NEW-CLIENT.md):
 *   1. Copy this folder to clients/<slug>/ (lowercase, e.g. noa-yoav) and set "slug" in profile.json.
 *   2. profile.json: the site's title, both names and genders ("m" / "f"), and the admin's phone.
 *   3. Below: their dates, which modules are on, which animal.
 *   4. content/index.ts: everything they sent (all optional).
 *   5. Photos into photos/ as <id>.webp + <id>-sm.webp (scripts/add-photos.mjs makes both).
 */
export default defineClient(profile, {
  timeZone: 'Asia/Jerusalem',
  /** The day the site goes live (the real start is the partner's first login). */
  launchDate: '2026-11-01',
  /** First book chapter opens this morning (only if there's a book). */
  bookStart: '2026-11-01',
  /** The partner's birthday. hebrewDay/hebrewMonth (e.g. 10, 'Adar') add the Hebrew one. */
  birthday: { gregorian: '2001-04-12' },
  dates: { together: '2023-07-14', met: '2023-06-02', metLabel: 'מאז החתונה של רוני' },
  /** The id from a Spotify playlist link (open.spotify.com/playlist/<id>). Remove for no music tab. */
  // spotifyPlaylist: '',
  /** 'auto' = a different look every day; or pin one: 'rose' | 'cocoa' | 'sea' | 'sunset' | 'lavender'. */
  skin: 'auto',
  /** Start from a preset and switch modules off/on: presets.full, presets.lettersAndPhotos, presets.photosOnly. */
  features: { ...presets.full, night: true, pet: true },
  /** 'guineaPig' | 'cat' | 'dog' | 'bunny' */
  pet: { species: 'guineaPig', suggestedName: 'פופקורן' },
  content,
});
