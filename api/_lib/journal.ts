import { roleFromRequest } from './session.js';
import { hasStore, getJSON, setJSON } from './store.js';
import { notifyAdmin } from './notify.js';

/**
 * "היומן ממשיך": the partner writes about a meeting after it happens. Each
 * entry reaches the admin in full (WhatsApp / mail / push), stays here for
 * both of them, and can later become a chapter in the book (the client's
 * book content marks the chapter with `journalId`).
 *
 * Served by api/event.ts as /api/event?journal (not its own function: the
 * Hobby plan allows 12 functions per deployment, and the middleware counts).
 */
const KEY = 'journal';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export interface JournalEntry {
  id: string;
  /** The day they met, YYYY-MM-DD. */
  date: string;
  place?: string;
  text: string;
  writtenAt: string;
  editedAt?: string;
}

const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const he = (iso: string) => `${Number(iso.slice(8))}.${Number(iso.slice(5, 7))}.${iso.slice(0, 4)}`;
/** Notification services cut long texts; the full entry is always on the site. */
const clip = (s: string, max = 1200) => (s.length > max ? `${s.slice(0, max)}…\n(ההמשך באתר)` : s);

export async function journalGET(request: Request) {
  const role = await roleFromRequest(request);
  if (!role) return json({ error: 'unauthorized' }, 401);
  if (!hasStore()) return json({ entries: [], store: false });
  return json({ entries: (await getJSON<JournalEntry[]>(KEY)) ?? [], store: true });
}

/**
 * POST { id?, date, place?, text, headline? }. Without id: a new entry. With id: an edit of one. Partner only.
 * `headline` is the first line of the notification, written by the site with the right names.
 */
export async function journalPOST(request: Request) {
  const role = await roleFromRequest(request);
  if (!role) return json({ error: 'unauthorized' }, 401);
  if (role !== 'partner') return json({ error: 'only the partner writes here' }, 403);
  if (!hasStore()) return json({ error: 'no store' }, 503);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const text = str(body?.text, 8000);
  const date = body?.date;
  if (!text || !isDate(date)) return json({ error: 'missing text or date' }, 400);
  const place = str(body?.place, 80);

  const entries = (await getJSON<JournalEntry[]>(KEY)) ?? [];
  const now = new Date().toISOString();
  const id = typeof body?.id === 'string' ? body.id : undefined;
  const existing = id ? entries.find((e) => e.id === id) : undefined;
  let entry: JournalEntry;
  if (existing) {
    Object.assign(existing, { date, place, text, editedAt: now });
    entry = existing;
  } else {
    entry = { id: `j${Date.now().toString(36)}`, date, place, text, writtenAt: now };
    entries.push(entry);
  }
  entries.sort((a, b) => a.date.localeCompare(b.date) || a.writtenAt.localeCompare(b.writtenAt));
  await setJSON(KEY, entries.slice(-500));

  const head = `${str(body?.headline, 120) ?? (existing ? '✏️ עדכון ביומן הפגישות' : '📝 נכתב משהו חדש ביומן הפגישות')} ב־${he(date)}`;
  await notifyAdmin(`${head}${place ? ` (${place})` : ''}:\n\n${clip(text)}`).catch(() => null);
  return json({ entry, entries });
}
