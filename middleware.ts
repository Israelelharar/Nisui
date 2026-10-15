import { sessionFromRequest, type Session } from './api/_lib/session.js';
import { SITES } from './api/_lib/sites.gen.js';
import { botResponse, isBot } from './api/_lib/bots.js';

/**
 * Vercel Routing Middleware for every couple's site in this one deployment (/<slug>/...):
 * - nothing on a site (pages, bundle, photos) is served without that site's session,
 * - the demo site is open to everyone, look-only,
 * - AI agents and scripts never get anything (api/_lib/bots.ts).
 * Each site's login page, home-screen icons and robots.txt are public.
 */
export const config = {
  matcher: ['/((?!api/login|robots\\.txt|favicon\\.ico|[^/]+/login\\.html|[^/]+/seal\\.svg|[^/]+/manifest\\.webmanifest|[^/]+/icons/|[^/]+/sw\\.js).*)'],
};

const next = () => new Response(null, { headers: { 'x-middleware-next': '1' } });

export default async function middleware(request: Request) {
  if (isBot(request)) return botResponse();
  const url = new URL(request.url);
  const api = url.pathname.startsWith('/api/');
  const slug = api ? request.headers.get('x-site') ?? url.searchParams.get('site') ?? '' : url.pathname.split('/')[1] ?? '';
  if (!slug && !api) return Response.redirect(new URL('/demo/', url), 302);
  const site = SITES[slug];
  if (!site) return api ? Response.json({ error: 'unknown site' }, { status: 400 }) : new Response('Not found', { status: 404 });

  let s: Session | null = null;
  try {
    s = await sessionFromRequest(request, slug);
  } catch {
    return new Response('Server is missing SESSION_SECRET', { status: 500 });
  }
  const path = api ? url.pathname : url.pathname.slice(slug.length + 1) || '/';
  // The demo (and any guest) only looks: no writes, no backup.
  if (s?.guest && api && !['GET', 'HEAD'].includes(request.method)) return Response.json({ error: 'demo' }, { status: 403 });
  if (s?.guest && path.startsWith('/backup/')) return new Response(null, { status: 403 });
  // The admin page and the backup are the admin's only.
  if (s?.role === 'partner' && !site.demo && path.startsWith('/admin')) return Response.redirect(new URL(`/${slug}/`, url), 302);
  if (s?.role === 'partner' && path.startsWith('/backup/')) return new Response(null, { status: 403 });
  if (s) return next();
  if (api) return new Response(null, { status: 401 });
  return Response.redirect(new URL(`/${slug}/login.html`, url), 302);
}
