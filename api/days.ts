import { roleFromRequest, withSite } from './_lib/site.js';
import { hasStore, setMembers } from './_lib/store.js';
import { DAYS_SET, contentDateNow } from './_lib/day.js';

/** Admin only: the days (today onward) that have edits. */
async function get(request: Request) {
  if ((await roleFromRequest(request)) !== 'admin') return Response.json({ error: 'forbidden' }, { status: 403 });
  if (!hasStore()) return Response.json({ days: [] });
  const today = contentDateNow();
  const days = (await setMembers(DAYS_SET)).filter((d) => d >= today).sort();
  return Response.json({ days }, { headers: { 'Cache-Control': 'no-store' } });
}

export const GET = withSite(get);
