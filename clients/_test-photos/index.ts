import profile from './profile.json';
import { defineClient } from '../../src/client/define';
import { presets } from '../../src/client/presets';

/**
 * A build check, not a real client: photos only, no phone, she made it for
 * him. `npm run check:clients` builds it so modules without content can't
 * break a page.
 */
export default defineClient(profile, {
  dates: { together: '2024-02-14' },
  features: presets.photosOnly,
  content: {
    photos: [
      { id: 'sunset-beach', alt: 'שנינו בשקיעה', caption: 'השקיעה הראשונה שלנו', categories: ['us'], width: 900, height: 1125 },
      { id: 'cafe', alt: 'שתי כוסות קפה', caption: 'הקפה של שבת', categories: ['moments'], width: 900, height: 1125 },
      { id: 'picnic', alt: 'פיקניק', caption: 'הפיקניק בפארק', categories: ['moments'], width: 900, height: 1125 },
    ],
  },
});
