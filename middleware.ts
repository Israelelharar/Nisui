import { roleFromRequest } from './api/_lib/session.js';

/**
 * Vercel Routing Middleware: nothing on the site (pages, bundle, photos) is
 * served without a valid session. Only the login page and login endpoint
 * are public.
 */
export const config = {
  matcher: ['/((?!login\\.html|api/login|seal\\.svg|favicon\\.ico|manifest\\.webmanifest|icons/|sw\\.js).*)'],
};

export default async function middleware(request: Request) {
  let role = null;
  try {
    role = await roleFromRequest(request);
  } catch {
    return new Response('Server is missing SESSION_SECRET', { status: 500 });
  }
  const url = new URL(request.url);
  // The admin page is the admin's only.
  if (role === 'partner' && url.pathname.startsWith('/admin')) return Response.redirect(new URL('/', url), 302);
  // The full project backup (code, the whole book, everything) is the admin's too.
  if (role === 'partner' && url.pathname.startsWith('/backup/')) return new Response(null, { status: 403 });
  if (role) return new Response(null, { headers: { 'x-middleware-next': '1' } });
  if (url.pathname.startsWith('/api/')) return new Response(null, { status: 401 });
  return Response.redirect(new URL('/login.html', url), 302);
}
