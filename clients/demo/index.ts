import profile from './profile.json';
import { defineClient } from '../../src/client/define';
import { presets } from '../../src/client/presets';
import { content } from './content';

/**
 * The demo couple, Noa and Yoav (made up), for showing the site to new
 * clients. Every module is on.
 */
export default defineClient(profile, {
  timeZone: 'Asia/Jerusalem',
  launchDate: '2026-10-01',
  bookStart: '2026-10-01',
  birthday: { gregorian: '2001-04-12' },
  dates: { met: '2023-06-02', together: '2023-07-14', metLabel: 'מאז החתונה של רוני' },
  spotifyPlaylist: '37i9dQZF1DX7K31D69s4M1',
  skin: 'auto',
  features: presets.full,
  pet: { species: 'bunny', suggestedName: 'פופקורן' },
  content,
});
