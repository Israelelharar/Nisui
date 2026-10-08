import { roleFromRequest } from './_lib/session.js';
import { hasStore, getJSON, setJSON, del, addToSet, removeFromSet } from './_lib/store.js';
import { DAY_KEY, DAYS_SET, contentDateNow, isDate, sanitize, type DayOverride } from './_lib/day.js';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** GET ?date=YYYY-MM-DD. The partner only ever gets today or earlier, never future surprises. */
export async function GET(request: Request) {
  const role = await roleFromRequest(request);
  if (!role) return json({ error: 'unauthorized' }, 401);
  if (!hasStore()) return json({ override: null });
  const today = contentDateNow();
  let date = new URL(request.url).searchParams.get('date') ?? today;
  if (!isDate(date)) return json({ error: 'bad date' }, 400);
  if (role === 'partner' && date > today) date = today;
  return json({ date, override: await getJSON<DayOverride>(DAY_KEY(date)) });
}

/** PUT { date, override } (admin only). An empty override clears the day. */
export async function PUT(request: Request) {
  if ((await roleFromRequest(request)) !== 'admin') return json({ error: 'forbidden' }, 403);
  if (!hasStore()) return json({ error: 'no store' }, 503);
  const body = (await request.json().catch(() => null)) as { date?: unknown; override?: unknown } | null;
  if (!isDate(body?.date)) return json({ error: 'bad date' }, 400);
  const override = sanitize(body!.override);
  if (!override) {
    await del(DAY_KEY(body!.date));
    await removeFromSet(DAYS_SET, body!.date);
    return json({ date: body!.date, override: null });
  }
  override.updatedAt = new Date().toISOString();
  await setJSON(DAY_KEY(body!.date), override);
  await addToSet(DAYS_SET, body!.date);
  return json({ date: body!.date, override });
}
