import { roleFromRequest } from './_lib/session.js';
import { hasStore, getJSON, setJSON, del } from './_lib/store.js';

/**
 * The partner's pet (the whole game state as one JSON) and the gifts
 * the admin sends it. Only the partner's session saves the pet; the admin can look and send
 * gifts.
 *
 * Also the pig's photo album: each photo (a small JPEG) under its own key,
 * plus a list. `GET ?photos=1` lists them, `GET ?photo=<id>` serves one image.
 */
const PET = 'pet:partner';
/** One snapshot per day (local time), the last 45 days. The progress can always be brought back. */
const BAKS = 'pet:partner:baks';
const bakKey = (date: string) => `pet:partner:bak:${date}`;
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: process.env.SITE_TZ ?? 'Asia/Jerusalem' });

async function backup(pet: unknown) {
  const date = today();
  await setJSON(bakKey(date), pet);
  const list = (await getJSON<string[]>(BAKS)) ?? [];
  if (list.includes(date)) return;
  const next = [date, ...list].slice(0, 45);
  await setJSON(BAKS, next);
  await Promise.all(list.filter((d) => !next.includes(d)).map((d) => del(bakKey(d))));
}
const GIFTS = 'pet:gifts';
const PHOTOS = 'pet:photos';
const photoKey = (id: string) => `pet:photo:${id}`;
const MAX_PHOTOS = 150;
/** Food ids differ per species (src/pet/species), so the server only checks the shape. */
const isFoodId = (v: unknown): v is string => typeof v === 'string' && /^[a-z][a-zA-Z]{1,24}$/.test(v);
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

interface PhotoMeta {
  id: string;
  caption: string;
  at: number;
}

interface Gift {
  id: string;
  coins: number;
  note?: string;
  food?: string;
  at: number;
}

export async function GET(request: Request) {
  const role = await roleFromRequest(request);
  if (!role) return json({ error: 'unauthorized' }, 401);
  const mine = role === 'partner';
  const url = new URL(request.url);
  const photo = url.searchParams.get('photo');
  if (photo) {
    if (!/^p[a-z0-9]{4,20}$/.test(photo) || !hasStore()) return json({ error: 'not found' }, 404);
    const img = await getJSON<string>(photoKey(photo));
    if (!img) return json({ error: 'not found' }, 404);
    const bytes = Uint8Array.from(atob(img.slice(img.indexOf(',') + 1)), (c) => c.charCodeAt(0));
    return new Response(bytes, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=31536000, immutable' } });
  }
  if (url.searchParams.has('backups')) {
    if (role !== 'admin' || !hasStore()) return json({ backups: [] });
    const dates = (await getJSON<string[]>(BAKS)) ?? [];
    if (await getJSON(bakKey('before-restore'))) dates.unshift('before-restore');
    const backups = await Promise.all(
      dates.map(async (date) => {
        const b = await getJSON<{ level?: number; coins?: number; name?: string }>(bakKey(date));
        return { date, level: b?.level ?? 0, coins: b?.coins ?? 0, name: b?.name ?? '' };
      }),
    );
    return json({ backups });
  }
  if (url.searchParams.has('photos')) {
    if (!hasStore()) return json({ photos: [], store: false });
    return json({ photos: (await getJSON<PhotoMeta[]>(PHOTOS)) ?? [], store: true });
  }
  if (!hasStore()) return json({ pet: null, gifts: [], store: false, mine });
  const [pet, gifts] = await Promise.all([getJSON(PET), getJSON<Gift[]>(GIFTS)]);
  return json({ pet, gifts: gifts ?? [], store: true, mine });
}

/** PUT { pet } (partner only). An older copy than the saved one is refused with the saved one. */
export async function PUT(request: Request) {
  const role = await roleFromRequest(request);
  if (!role) return json({ error: 'unauthorized' }, 401);
  if (role !== 'partner' || !hasStore()) return new Response(null, { status: 204 });
  const text = await request.text();
  if (text.length > 60_000) return json({ error: 'too big' }, 413);
  let pet: Record<string, unknown> | undefined;
  try {
    pet = (JSON.parse(text || 'null') as { pet?: Record<string, unknown> } | null)?.pet;
  } catch {
    return json({ error: 'bad json' }, 400);
  }
  if (!pet || typeof pet !== 'object' || typeof pet.name !== 'string' || typeof pet.savedAt !== 'number') return json({ error: 'bad pet' }, 400);
  const cur = await getJSON<{ savedAt?: number; adoptedAt?: number }>(PET);
  if (cur) {
    // A different pet (say, a fresh adoption on a phone that couldn't load the saved one) never replaces the saved pet.
    if (typeof cur.adoptedAt === 'number' && cur.adoptedAt !== pet.adoptedAt) return json({ pet: cur }, 409);
    if (typeof cur.savedAt === 'number' && cur.savedAt > pet.savedAt) return json({ pet: cur }, 409);
  }
  await setJSON(PET, pet);
  await backup(pet).catch(() => {});
  return new Response(null, { status: 204 });
}

/**
 * POST { photo: { img, caption } } (partner: a new photo for the album),
 * POST { gift: { coins, note?, food? } } (admin only), or
 * POST { restore: 'YYYY-MM-DD' } (admin only): brings back the pet as it was that day.
 */
export async function POST(request: Request) {
  const role = await roleFromRequest(request);
  if (!role) return json({ error: 'unauthorized' }, 401);
  if (!hasStore()) return json({ error: 'no store' }, 503);
  const body = (await request.json().catch(() => null)) as { gift?: Record<string, unknown>; photo?: Record<string, unknown>; restore?: unknown } | null;
  if (body?.restore !== undefined) {
    if (role !== 'admin') return json({ error: 'forbidden' }, 403);
    const date = String(body.restore);
    if (!/^(\d{4}-\d{2}-\d{2}|before-restore)$/.test(date)) return json({ error: 'bad date' }, 400);
    const old = await getJSON<Record<string, unknown>>(bakKey(date));
    if (!old) return json({ error: 'not found' }, 404);
    // The state right before the restore is kept, so a restore can itself be undone.
    const cur = await getJSON(PET);
    if (cur) await setJSON(bakKey('before-restore'), cur);
    const pet = { ...old, savedAt: Date.now() };
    await setJSON(PET, pet);
    return json({ pet });
  }
  if (body?.photo) {
    if (role !== 'partner') return json({ error: 'forbidden' }, 403);
    const img = body.photo.img;
    if (typeof img !== 'string' || !img.startsWith('data:image/jpeg;base64,') || img.length > 700_000) return json({ error: 'bad photo' }, 400);
    const caption = typeof body.photo.caption === 'string' ? body.photo.caption.slice(0, 120) : '';
    const meta: PhotoMeta = { id: `p${Date.now().toString(36)}`, caption, at: Date.now() };
    await setJSON(photoKey(meta.id), img);
    // Capped so the album never outgrows the free store; the oldest image goes with its entry.
    const all = [meta, ...((await getJSON<PhotoMeta[]>(PHOTOS)) ?? [])];
    await setJSON(PHOTOS, all.slice(0, MAX_PHOTOS));
    await Promise.all(all.slice(MAX_PHOTOS).map((p) => del(photoKey(p.id))));
    return json({ photo: meta });
  }
  if (role !== 'admin') return json({ error: 'forbidden' }, 403);
  const g = body?.gift ?? {};
  const coins = Math.max(0, Math.min(1000, Math.round(Number(g.coins) || 0)));
  const note = typeof g.note === 'string' && g.note.trim() ? g.note.trim().slice(0, 200) : undefined;
  const food = isFoodId(g.food) ? g.food : undefined;
  if (!coins && !note && !food) return json({ error: 'empty gift' }, 400);
  const gift: Gift = { id: `g${Date.now().toString(36)}`, coins, note, food, at: Date.now() };
  const gifts = [gift, ...((await getJSON<Gift[]>(GIFTS)) ?? [])].slice(0, 100);
  await setJSON(GIFTS, gifts);
  return json({ gifts });
}

/** DELETE ?photo=<id> (partner only): removes a photo from the album. */
export async function DELETE(request: Request) {
  if ((await roleFromRequest(request)) !== 'partner') return json({ error: 'forbidden' }, 403);
  if (!hasStore()) return json({ error: 'no store' }, 503);
  const id = new URL(request.url).searchParams.get('photo') ?? '';
  if (!/^p[a-z0-9]{4,20}$/.test(id)) return json({ error: 'bad id' }, 400);
  const list = (await getJSON<PhotoMeta[]>(PHOTOS)) ?? [];
  await setJSON(
    PHOTOS,
    list.filter((p) => p.id !== id),
  );
  await del(photoKey(id));
  return new Response(null, { status: 204 });
}
