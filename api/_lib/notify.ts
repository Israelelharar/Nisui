import { sign } from './session.js';
import { currentSite, currentSlug } from './site.js';

/**
 * Notifications to the admin go through ntfy (free phone app). Every site has its own secret
 * topic, made from SESSION_SECRET, so there is nothing to set up: the admin page shows it, he
 * subscribes once in the app, done. The demo never notifies.
 */
export const ntfyTopic = async (slug: string) => `ourworld-${slug}-${(await sign(`ntfy:${slug}`)).replace(/[^A-Za-z0-9]/g, '').slice(0, 16)}`;

export async function notifyAdmin(text: string) {
  const slug = currentSlug();
  if (!slug || currentSite().demo) return { channels: 0, failed: 0 };
  const r = await fetch(`https://ntfy.sh/${encodeURIComponent(await ntfyTopic(slug))}`, { method: 'POST', body: text, headers: { Title: currentSite().title } }).catch(() => null);
  return { channels: 1, failed: r?.ok ? 0 : 1 };
}
