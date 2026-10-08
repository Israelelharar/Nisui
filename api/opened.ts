import { roleFromRequest } from './_lib/session.js';
import { hasStore, addToSet, setMembers, getJSON, setJSON } from './_lib/store.js';

/**
 * "הפתקים שלי" on the server, so the collection follows the partner to any browser
 * or phone. Only the partner's opens are recorded; the admin can read them.
 */
const IDS = 'opened';
const CUSTOM = 'opened:custom';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

interface CustomNote {
  id: string;
  kind: 'note';
  title: string;
  body: string;
  author: 'admin';
  writtenOn?: string;
}

const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
const cleanId = (v: unknown) => (typeof v === 'string' && /^[\w:.-]{1,80}$/.test(v) ? v : undefined);

function cleanNote(v: unknown): CustomNote | undefined {
  const o = (v ?? {}) as Record<string, unknown>;
  const id = cleanId(o.id);
  const body = str(o.body, 6000);
  if (!id || !body) return undefined;
  const writtenOn = typeof o.writtenOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.writtenOn) ? o.writtenOn : undefined;
  return { id, kind: 'note', title: str(o.title, 80) ?? 'פתק מיוחד', body, author: 'admin', writtenOn };
}

/** `mine`: false for the admin, whose view mirrors exactly what the partner opened. */
export async function GET(request: Request) {
  const role = await roleFromRequest(request);
  if (!role) return json({ error: 'unauthorized' }, 401);
  const mine = role === 'partner';
  if (!hasStore()) return json({ ids: [], custom: [], store: false, mine });
  const [ids, custom] = await Promise.all([setMembers(IDS), getJSON<CustomNote[]>(CUSTOM)]);
  return json({ ids: ids ?? [], custom: custom ?? [], store: true, mine });
}

/** POST { ids: string[], notes?: CustomNote[] }. Additive only: nothing opened is ever removed. */
export async function POST(request: Request) {
  const role = await roleFromRequest(request);
  if (!role) return json({ error: 'unauthorized' }, 401);
  if (role !== 'partner' || !hasStore()) return new Response(null, { status: 204 });
  const body = (await request.json().catch(() => null)) as { ids?: unknown; notes?: unknown } | null;
  const ids = (Array.isArray(body?.ids) ? body!.ids : []).map(cleanId).filter((x): x is string => !!x).slice(0, 200);
  const notes = (Array.isArray(body?.notes) ? body!.notes : []).map(cleanNote).filter((x): x is CustomNote => !!x).slice(0, 20);
  for (const id of ids) await addToSet(IDS, id);
  if (notes.length) {
    const cur = (await getJSON<CustomNote[]>(CUSTOM)) ?? [];
    const fresh = notes.filter((n) => !cur.some((c) => c.id === n.id));
    if (fresh.length) await setJSON(CUSTOM, [...fresh, ...cur].slice(0, 500));
  }
  return new Response(null, { status: 204 });
}
