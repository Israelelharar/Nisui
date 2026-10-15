/**
 * One deployment serves every couple. Each request says which site it is for (the `x-site`
 * header that src/lib/site.ts adds to every /api call, or `site` in a form / the query), and
 * everything the request touches (store keys, time zone, who is logged in) belongs to that site.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { SITES, type SiteInfo } from './sites.gen.js';
import { sessionFromRequest, type Role, type Session } from './session.js';

interface Ctx {
  slug: string;
  site: SiteInfo;
  session: Session | null;
}
const als = new AsyncLocalStorage<Ctx>();

export function siteSlugFrom(request: Request, form?: FormData | null) {
  const url = new URL(request.url);
  const slug = request.headers.get('x-site') ?? (form?.get('site') as string | null) ?? url.searchParams.get('site') ?? '';
  return SITES[slug] ? slug : null;
}

type Handler = (request: Request) => Response | Promise<Response>;

/** Wraps an /api handler: resolves the site and the session, 400 if the site is unknown. */
export const withSite = (h: Handler): Handler => async (request) => {
  const slug = siteSlugFrom(request);
  if (!slug) return Response.json({ error: 'unknown site' }, { status: 400 });
  const session = await sessionFromRequest(request, slug);
  // The demo only looks (the middleware stops this too; this is the second lock).
  if (session?.guest && !['GET', 'HEAD'].includes(request.method)) return Response.json({ error: 'demo' }, { status: 403 });
  return als.run({ slug, site: SITES[slug], session }, () => h(request));
};

const ctx = () => {
  const c = als.getStore();
  if (!c) throw new Error('no site context (handler not wrapped in withSite)');
  return c;
};
export const currentSlug = () => als.getStore()?.slug ?? null;
export const currentSite = () => ctx().site;
export const currentSession = () => ctx().session;
/** The role of whoever is asking, on this site. Same shape as before, so handlers read the same. */
export async function roleFromRequest(_request?: Request): Promise<Role | null> {
  return ctx().session?.role ?? null;
}
export const isGuest = () => !!ctx().session?.guest;
