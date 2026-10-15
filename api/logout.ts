import { clearSessionCookie } from './_lib/session.js';
import { siteSlugFrom } from './_lib/site.js';

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const slug = siteSlugFrom(request, form);
  if (!slug) return new Response(null, { status: 303, headers: { Location: '/' } });
  return new Response(null, { status: 303, headers: { Location: `/${slug}/login.html`, 'Set-Cookie': clearSessionCookie(slug) } });
}
