import { roleFromRequest } from './_lib/session.js';
import { hasStore, setMembers } from './_lib/store.js';
import { DAYS_SET, contentDateNow } from './_lib/day.js';

/** Admin only: the days (today onward) that have edits. */
export async function GET(request: Request) {
  if ((await roleFromRequest(request)) !== 'admin') return Response.json({ error: 'forbidden' }, { status: 403 });
  if (!hasStore()) return Response.json({ days: [] });
  const today = contentDateNow();
  const days = (await setMembers(DAYS_SET)).filter((d) => d >= today).sort();
  return Response.json({ days }, { headers: { 'Cache-Control': 'no-store' } });
}
