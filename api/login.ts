import { createSessionCookie, roleForPassword } from './_lib/session.js';
import { siteSlugFrom } from './_lib/site.js';
import { hasStore, setJSON } from './_lib/store.js';
import { botResponse, isBot } from './_lib/bots.js';

/** The login form on /<slug>/login.html: your name opens your side of that site. */
export async function POST(request: Request) {
  if (isBot(request)) return botResponse();
  const form = await request.formData().catch(() => null);
  const slug = siteSlugFrom(request, form);
  if (!slug) return new Response(null, { status: 303, headers: { Location: '/' } });
  const role = roleForPassword(slug, String(form?.get('password') ?? ''));
  if (!role) return new Response(null, { status: 303, headers: { Location: `/${slug}/login.html?wrong=1` } });
  return new Response(null, {
    status: 303,
    headers: { Location: role === 'admin' ? `/${slug}/admin` : `/${slug}/`, 'Set-Cookie': await createSessionCookie(slug, role) },
  });
}

/**
 * The daily keep-alive (vercel.json cron). A free Upstash store that sees no traffic for
 * 30 days gets archived, so after a long quiet stretch the sites would come back empty.
 * One tiny write a day keeps it awake for as long as the sites live.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) return new Response(null, { status: 401 });
  if (!hasStore()) return new Response(null, { status: 204 });
  await setJSON('alive', new Date().toISOString());
  return new Response(null, { status: 204 });
}
