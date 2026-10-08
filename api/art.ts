import { roleFromRequest } from './_lib/session.js';
import { hasStore, getJSON, setJSON, del } from './_lib/store.js';

/**
 * The partner's drawings (from the drawing studio in the games room): a gallery,
 * and the ones dedicated to the admin, which greet the admin once on the next visit.
 *
 * GET ?list=1          the gallery (both of them can look)
 * GET ?img=<id>        one drawing (JPEG)
 * GET ?gifts=1         admin: dedications not seen yet
 * POST { art }         partner: save a drawing { img, title, dedicate?, note? }
 * POST { dedicate }    partner: dedicate a saved drawing { id, note? }
 * POST { seen }        admin: saw this dedication
 * DELETE ?id=<id>      partner: remove a drawing
 */
const LIST = 'art:list';
const GIFTS = 'art:gifts';
const imgKey = (id: string) => `art:img:${id}`;
const MAX_ART = 120;
const ID = /^a[a-z0-9]{4,20}$/;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export interface ArtMeta {
  id: string;
  title: string;
  at: number;
  dedicated?: number;
  note?: string;
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function GET(request: Request) {
  const role = await roleFromRequest(request);
  if (!role) return json({ error: 'unauthorized' }, 401);
  if (!hasStore()) return json({ error: 'no store' }, 503);
  const url = new URL(request.url);
  const img = url.searchParams.get('img');
  if (img) {
    if (!ID.test(img)) return json({ error: 'not found' }, 404);
    const data = await getJSON<string>(imgKey(img));
    if (!data) return json({ error: 'not found' }, 404);
    const bytes = Uint8Array.from(atob(data.slice(data.indexOf(',') + 1)), (c) => c.charCodeAt(0));
    return new Response(bytes, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=31536000, immutable' } });
  }
  const list = (await getJSON<ArtMeta[]>(LIST)) ?? [];
  if (url.searchParams.has('gifts')) {
    if (role !== 'admin') return json({ gifts: [] });
    const ids = (await getJSON<string[]>(GIFTS)) ?? [];
    return json({ gifts: ids.map((id) => list.find((a) => a.id === id)).filter(Boolean) });
  }
  return json({ art: list });
}

export async function POST(request: Request) {
  const role = await roleFromRequest(request);
  if (!role) return json({ error: 'unauthorized' }, 401);
  if (!hasStore()) return json({ error: 'no store' }, 503);
  const body = (await request.json().catch(() => null)) as { art?: Record<string, unknown>; dedicate?: Record<string, unknown>; seen?: unknown } | null;

  if (body?.seen !== undefined) {
    if (role !== 'admin') return json({ error: 'forbidden' }, 403);
    const id = String(body.seen);
    const ids = (await getJSON<string[]>(GIFTS)) ?? [];
    await setJSON(
      GIFTS,
      ids.filter((x) => x !== id),
    );
    return new Response(null, { status: 204 });
  }

  if (role !== 'partner') return json({ error: 'forbidden' }, 403);
  const list = (await getJSON<ArtMeta[]>(LIST)) ?? [];

  if (body?.dedicate) {
    const id = String(body.dedicate.id ?? '');
    const art = list.find((a) => a.id === id);
    if (!art) return json({ error: 'not found' }, 404);
    art.dedicated = Date.now();
    art.note = text(body.dedicate.note, 200) || art.note;
    await setJSON(LIST, list);
    const ids = (await getJSON<string[]>(GIFTS)) ?? [];
    if (!ids.includes(id)) await setJSON(GIFTS, [...ids, id].slice(-30));
    return json({ art });
  }

  const a = body?.art;
  const img = a?.img;
  if (typeof img !== 'string' || !img.startsWith('data:image/jpeg;base64,') || img.length > 900_000) return json({ error: 'bad image' }, 400);
  const meta: ArtMeta = { id: `a${Date.now().toString(36)}`, title: text(a?.title, 60) || 'ציור', at: Date.now() };
  if (a?.dedicate) {
    meta.dedicated = Date.now();
    meta.note = text(a.note, 200) || undefined;
  }
  await setJSON(imgKey(meta.id), img);
  // Capped so the gallery never outgrows the free store; the oldest image goes with its entry.
  const all = [meta, ...list];
  await setJSON(LIST, all.slice(0, MAX_ART));
  await Promise.all(all.slice(MAX_ART).map((x) => del(imgKey(x.id))));
  if (meta.dedicated) {
    const ids = (await getJSON<string[]>(GIFTS)) ?? [];
    await setJSON(GIFTS, [...ids, meta.id].slice(-30));
  }
  return json({ art: meta });
}

export async function DELETE(request: Request) {
  if ((await roleFromRequest(request)) !== 'partner') return json({ error: 'forbidden' }, 403);
  if (!hasStore()) return json({ error: 'no store' }, 503);
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!ID.test(id)) return json({ error: 'bad id' }, 400);
  const list = (await getJSON<ArtMeta[]>(LIST)) ?? [];
  await setJSON(
    LIST,
    list.filter((a) => a.id !== id),
  );
  const ids = (await getJSON<string[]>(GIFTS)) ?? [];
  if (ids.includes(id))
    await setJSON(
      GIFTS,
      ids.filter((x) => x !== id),
    );
  await del(imgKey(id));
  return new Response(null, { status: 204 });
}
