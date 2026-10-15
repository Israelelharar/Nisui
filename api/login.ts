import { createSessionCookie, roleForPassword, sessionFromRequest } from './_lib/session.js';
import { hasStore, setJSON } from './_lib/store.js';
import { isDemo, makeDemoToken, readDemoToken } from './_lib/demo.js';
import { botResponse, isBot } from './_lib/bots.js';
import { notifyAdmin } from './_lib/notify.js';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  if (isBot(request)) return botResponse();
  // POST ?mint {label, days, role}: the owner makes a demo link (demo deployments, real admin only).
  if (new URL(request.url).searchParams.has('mint')) {
    const s = await sessionFromRequest(request);
    if (!isDemo() || !s || s.role !== 'admin' || s.guest) return json({ error: 'forbidden' }, 403);
    const body = (await request.json().catch(() => null)) as { label?: unknown; days?: unknown; role?: unknown } | null;
    const role = body?.role === 'admin' ? 'admin' : 'partner';
    const days = Number(body?.days) || 3;
    const label = typeof body?.label === 'string' ? body.label : '';
    const token = await makeDemoToken(role, days, label);
    const url = new URL(request.url);
    return json({ url: `${url.origin}/api/login?demo=${encodeURIComponent(token)}`, expires: Date.now() + days * 86_400_000 });
  }
  const form = await request.formData().catch(() => null);
  const role = roleForPassword(String(form?.get('password') ?? ''));
  if (!role) {
    return new Response(null, { status: 303, headers: { Location: '/login.html?wrong=1' } });
  }
  return new Response(null, {
    status: 303,
    headers: { Location: role === 'admin' ? '/admin' : '/', 'Set-Cookie': await createSessionCookie(role) },
  });
}

/**
 * GET ?demo=<token>: a demo link. Logs the person in as a guest until the link expires.
 *
 * GET with no token: the daily keep-alive (vercel.json cron). A free Upstash store that sees no
 * traffic for 30 days gets archived, so after a long quiet stretch the site would come back empty.
 * One tiny write a day keeps it awake for as long as the site lives.
 */
export async function GET(request: Request) {
  const demo = new URL(request.url).searchParams.get('demo');
  if (demo !== null) {
    if (isBot(request)) return botResponse();
    const t = isDemo() ? await readDemoToken(demo) : null;
    if (!t || t === 'expired') return new Response(null, { status: 303, headers: { Location: `/login.html?${t === 'expired' ? 'expired' : 'wrong'}=1`, 'Cache-Control': 'no-store' } });
    // Link previews (WhatsApp and the like) don't count as an open.
    if (!/whatsapp|telegram|facebookexternalhit|slackbot|discordbot|twitterbot|linkedinbot/i.test(request.headers.get('user-agent') ?? '')) {
      await notifyAdmin(`👀 ${t.label} ${t.role === 'admin' ? 'נכנס לעמוד הניהול בדמו' : 'פתח את הדמו'}`).catch(() => {});
    }
    const cookie = await createSessionCookie(t.role, { guest: true, maxAge: t.exp - Date.now() / 1000 });
    return new Response(null, { status: 303, headers: { Location: t.role === 'admin' ? '/admin' : '/', 'Set-Cookie': cookie, 'Cache-Control': 'no-store' } });
  }
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) return new Response(null, { status: 401 });
  if (!hasStore()) return new Response(null, { status: 204 });
  await setJSON('alive', new Date().toISOString());
  return new Response(null, { status: 204 });
}
