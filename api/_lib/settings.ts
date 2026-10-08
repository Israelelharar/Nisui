import { getJSON } from './store.js';

/** Settings the admin changes from the admin page. */
export interface Settings {
  /** Next time they see each other: countdown on the partner's home screen. */
  nextMeeting?: { date: string; label?: string };
  /** The site's look: one pinned look, or a different one every day. */
  skin?: 'auto' | 'rose' | 'cocoa' | 'sea' | 'sunset' | 'lavender';
}

export const SETTINGS_KEY = 'settings';

export const getSettings = async () => (await getJSON<Settings>(SETTINGS_KEY)) ?? {};

export function sanitizeSettings(input: unknown): Settings {
  const o = (input ?? {}) as Record<string, any>;
  const out: Settings = {};
  const date = o.nextMeeting?.date;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const label = typeof o.nextMeeting.label === 'string' ? o.nextMeeting.label.trim().slice(0, 60) : '';
    out.nextMeeting = label ? { date, label } : { date };
  }
  if (['auto', 'rose', 'cocoa', 'sea', 'sunset', 'lavender'].includes(o.skin)) out.skin = o.skin;
  return out;
}
