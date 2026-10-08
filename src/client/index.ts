import raw from '@client';
import type { ClientConfig, Features } from './schema';

/**
 * The active client (picked at build time by the CLIENT env var, see
 * vite.config.ts). Everything couple-specific in the site reads from here.
 */
export const client: ClientConfig = raw;
export const { admin, partner, content } = client;

const c = content;
const any = (xs: unknown[] | undefined) => !!xs && xs.length > 0;

/**
 * A module is on when the client turned it on AND it has something to show,
 * so a photos-only site never shows an empty letters tab.
 */
const need: Partial<Record<keyof Features, boolean>> = {
  letters: any(c.adminNotes) || any(c.partnerNotes) || any(c.togetherNotes),
  book: any(c.book),
  dates: any(c.dates),
  story: any(c.timeline),
  gallery: any(c.photos),
  places: any(c.places),
  music: !!client.spotifyPlaylist,
  future: any(c.futurePlans),
  words: any(c.words),
  openWhen: true,
  vouchers: any(c.vouchers),
  surprises: any(c.surprises),
  onThisDay: !!c.onThisDay,
  messageClock: !!c.chatStats,
  contact: !!admin.phone,
};

const features = Object.fromEntries(
  (Object.keys(client.features) as (keyof Features)[]).map((k) => [k, client.features[k] && need[k] !== false]),
) as unknown as Features;
// Friends live with the pet.
features.friends = features.friends && features.pet;

/** Is this module on for this site? */
export const has = (f: keyof Features) => features[f];
