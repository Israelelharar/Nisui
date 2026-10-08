import { createSessionCookie, roleFromRequest } from './_lib/session.js';
import { notifyChannels } from './_lib/notify.js';
import { hasStore, setIfAbsent, getString } from './_lib/store.js';
import { contentDateNow } from './_lib/day.js';
import { getSettings, type Settings } from './_lib/settings.js';

/**
 * Who is looking, the settings, plus the launch date: the day the partner first logged in.
 * Her first note ("מכתב אישי") and first photo open on that day.
 */
export async function GET(request: Request) {
  const role = await roleFromRequest(request);
  let launchDate: string | null = null;
  let settings: Settings = {};
  if (role && hasStore()) {
    if (role === 'partner') await setIfAbsent('launch', contentDateNow());
    [launchDate, settings] = await Promise.all([getString('launch'), getSettings()]);
  }
  const body = role === 'admin' ? { role, launchDate, settings, notify: notifyChannels(), store: hasStore() } : { role, launchDate, settings };
  // Every visit renews the login for another 400 days, so whoever keeps using the site never gets logged out.
  const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  if (role) headers['Set-Cookie'] = await createSessionCookie(role);
  return Response.json(body, { headers });
}
