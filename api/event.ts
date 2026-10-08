import { roleFromRequest } from './_lib/session.js';
import { notifyAdmin } from './_lib/notify.js';
import { journalGET, journalPOST } from './_lib/journal.js';

/**
 * Meaningful moments only. Only the partner's session notifies; the admin
 * browsing the site never does. The site writes the message itself (it knows
 * both names and the right Hebrew forms, see src/lib/events.ts), so the server
 * stays the same for every client: it checks the type and passes the text on.
 */
const TYPES = new Set([
  'visit',
  'letter_opened',
  'strength',
  'missing_you',
  'call_request',
  'message',
  'pet_adopted',
  'goodnight',
  'wish',
  'goals',
  'goals_set',
  'chapter_read',
  'voucher',
  'mood',
]);

/** GET /api/event?journal: the partner's meeting journal (api/_lib/journal.ts). */
export async function GET(request: Request) {
  if (new URL(request.url).searchParams.has('journal')) return journalGET(request);
  return new Response(null, { status: 404 });
}

export async function POST(request: Request) {
  if (new URL(request.url).searchParams.has('journal')) return journalPOST(request);
  const role = await roleFromRequest(request);
  if (role !== 'partner') return new Response(null, { status: 204 });
  const { type, text } = (await request.json().catch(() => ({}))) as { type?: string; text?: unknown };
  if (!type || !TYPES.has(type) || typeof text !== 'string' || !text.trim()) return new Response(null, { status: 400 });
  await notifyAdmin(text.trim().slice(0, 300));
  return new Response(null, { status: 204 });
}
