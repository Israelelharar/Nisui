import { sessionFromRequest, type Session } from './api/_lib/session.js';
import { botResponse, isBot } from './api/_lib/bots.js';

/**
 * Vercel Routing Middleware: nothing on the site (pages, bundle, photos) is
 * served without a valid session, and never to AI agents or scripts (api/_lib/bots.ts).
 * Only the login page, the login endpoint and robots.txt are public.
 */
export const config = {
  matcher: ['/((?!login\\.html|api/login|robots\\.txt|seal\\.svg|favicon\\.ico|manifest\\.webmanifest|icons/|sw\\.js).*)'],
};

export default async function middleware(request: Request) {
  if (isBot(request)) return botResponse();
  let s: Session | null = null;
  try {
    s = await sessionFromRequest(request);
  } catch {
    return new Response('Server is missing SESSION_SECRET', { status: 500 });
  }
  const url = new URL(request.url);
  const role = s?.role ?? null;
  // The admin page is the admin's only.
  if (role === 'partner' && url.pathname.startsWith('/admin')) return Response.redirect(new URL('/', url), 302);
  // The backup (their content and data) is the admin's too, and never a demo guest's.
  if ((role === 'partner' || s?.guest) && url.pathname.startsWith('/backup/')) return new Response(null, { status: 403 });
  // A demo guest only looks: no writes at all.
  if (s?.guest && url.pathname.startsWith('/api/') && !['GET', 'HEAD'].includes(request.method) && url.pathname !== '/api/logout') {
    return Response.json({ error: 'demo' }, { status: 403 });
  }
  if (role) return new Response(null, { headers: { 'x-middleware-next': '1' } });
  if (url.pathname.startsWith('/api/')) return new Response(null, { status: 401 });
  return Response.redirect(new URL('/login.html', url), 302);
}
