import { createSessionCookie, roleForPassword } from './_lib/session.js';
import { hasStore, setJSON } from './_lib/store.js';

export async function POST(request: Request) {
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
 * Daily keep-alive (vercel.json cron). A free Upstash store that sees no traffic for
 * 30 days gets archived, so after a long quiet stretch the site would come back empty.
 * One tiny write a day keeps it awake for as long as the site lives.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) return new Response(null, { status: 401 });
  if (!hasStore()) return new Response(null, { status: 204 });
  await setJSON('alive', new Date().toISOString());
  return new Response(null, { status: 204 });
}
