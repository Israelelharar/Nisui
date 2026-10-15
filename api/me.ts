import { createSessionCookie } from './_lib/session.js';
import { currentSession, currentSite, currentSlug, withSite } from './_lib/site.js';
import { ntfyTopic } from './_lib/notify.js';
import { hasStore, setIfAbsent, getString } from './_lib/store.js';
import { contentDateNow } from './_lib/day.js';
import { getSettings, type Settings } from './_lib/settings.js';

/**
 * Who is looking, the settings, plus the launch date: the day the partner first logged in.
 * Her first note ("מכתב אישי") and first photo open on that day.
 */
async function get() {
  const session = currentSession();
  const slug = currentSlug()!;
  const role = session?.role ?? null;
  const guest = !!session?.guest;
  const demo = currentSite().demo;
  let launchDate: string | null = null;
  let settings: Settings = {};
  if (role && hasStore()) {
    if (role === 'partner' && !guest) await setIfAbsent('launch', contentDateNow());
    [launchDate, settings] = await Promise.all([getString('launch'), getSettings()]);
  }
  // The demo always looks like its first week: a few days already opened, something new today.
  if (demo) launchDate = new Date(Date.parse(`${contentDateNow()}T00:00:00Z`) - 4 * 86_400_000).toISOString().slice(0, 10);
  const body = role === 'admin' && !guest ? { role, launchDate, settings, ntfy: await ntfyTopic(slug), store: hasStore(), demo, guest } : { role, launchDate, settings, demo, guest };
  // Every visit renews the login for another 400 days, so whoever keeps using the site never gets logged out.
  const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  if (role && !guest) headers['Set-Cookie'] = await createSessionCookie(slug, role);
  return Response.json(body, { headers });
}

export const GET = withSite(get);
