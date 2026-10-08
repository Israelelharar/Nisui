import { roleFromRequest } from './_lib/session.js';
import { hasStore, del, getString, setMembers } from './_lib/store.js';

/**
 * Where the partner is (admin only): logged in yet, and how many notes
 * opened. POST clears it all, so the site starts fresh on the partner's first login
 * (for use before handing it over, after testing with the partner password).
 */
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request: Request) {
  if ((await roleFromRequest(request)) !== 'admin') return json({ error: 'forbidden' }, 403);
  if (!hasStore()) return json({ launchDate: null, opened: 0 });
  const [launchDate, ids] = await Promise.all([getString('launch'), setMembers('opened')]);
  return json({ launchDate, opened: ids?.length ?? 0 });
}

export async function POST(request: Request) {
  if ((await roleFromRequest(request)) !== 'admin') return json({ error: 'forbidden' }, 403);
  if (!hasStore()) return json({ error: 'no store' }, 503);
  await Promise.all([del('launch'), del('opened'), del('opened:custom')]);
  return json({ launchDate: null, opened: 0 });
}
