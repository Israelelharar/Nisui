import { roleFromRequest } from './_lib/session.js';
import { hasStore, setJSON, allKeys, pipeline } from './_lib/store.js';
import { getSettings, sanitizeSettings, SETTINGS_KEY } from './_lib/settings.js';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** What each key is, for the storage meter in the admin page. */
const groupOf = (key: string) =>
  key.startsWith('pet:photo:') || key === 'pet:photos'
    ? 'photos'
    : key.startsWith('art:')
      ? 'art'
      : key.startsWith('pet:partner:bak')
        ? 'backups'
        : key.startsWith('pet:')
          ? 'pet'
          : 'site';

/**
 * GET              the settings (both of them)
 * GET ?usage=1     admin: how much space everything takes, key by key
 * GET ?raw=a,b,c   admin: the stored values of those keys exactly as they are (for the full backup)
 */
export async function GET(request: Request) {
  const role = await roleFromRequest(request);
  if (!role) return json({ error: 'unauthorized' }, 401);
  const url = new URL(request.url);

  if (url.searchParams.has('usage')) {
    if (role !== 'admin') return json({ error: 'forbidden' }, 403);
    if (!hasStore()) return json({ store: false });
    const keys = await allKeys();
    const [types, sizes] = await Promise.all([pipeline(keys.map((k) => ['TYPE', k])), pipeline(keys.map((k) => ['STRLEN', k]))]);
    const sets = keys.filter((_, i) => types[i]?.result === 'set');
    const cards = await pipeline(sets.map((k) => ['SCARD', k]));
    const list = keys.map((key, i) => {
      const type = String(types[i]?.result ?? 'string');
      const bytes = type === 'set' ? Number(cards[sets.indexOf(key)]?.result ?? 0) * 24 : Number(sizes[i]?.result ?? 0);
      return { key, type, bytes, group: groupOf(key) };
    });
    return json({ store: true, keys: list });
  }

  const raw = url.searchParams.get('raw');
  if (raw !== null) {
    if (role !== 'admin') return json({ error: 'forbidden' }, 403);
    if (!hasStore()) return json({ values: {} });
    const keys = raw.split(',').filter(Boolean).slice(0, 200);
    const types = await pipeline(keys.map((k) => ['TYPE', k]));
    const got = await pipeline(keys.map((k, i) => (types[i]?.result === 'set' ? ['SMEMBERS', k] : ['GET', k])));
    const values: Record<string, unknown> = {};
    keys.forEach((k, i) => {
      if (types[i]?.result !== 'none') values[k] = { type: types[i]?.result, value: got[i]?.result ?? null };
    });
    return json({ values });
  }

  return json({ settings: hasStore() ? await getSettings() : {} });
}

/** PUT { settings } (admin only). Replaces all settings. */
export async function PUT(request: Request) {
  if ((await roleFromRequest(request)) !== 'admin') return json({ error: 'forbidden' }, 403);
  if (!hasStore()) return json({ error: 'no store' }, 503);
  const body = (await request.json().catch(() => null)) as { settings?: unknown } | null;
  const settings = sanitizeSettings(body?.settings);
  await setJSON(SETTINGS_KEY, settings);
  return json({ settings });
}
