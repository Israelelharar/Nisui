/**
 * Signed session cookie, one per site: `cs_<slug>` = `<slug>.<role>.<expires>[.g].<hmac>`.
 * Works on the edge (middleware) and in Node functions (Web Crypto in both). A cookie only ever
 * opens the site it was made for.
 */
import { SITES } from './sites.gen.js';

export type Role = 'admin' | 'partner';

const MAX_AGE_S = 400 * 24 * 60 * 60;
export const cookieName = (slug: string) => `cs_${slug}`;

const enc = new TextEncoder();

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 24) throw new Error('SESSION_SECRET is missing or too short');
  return s;
}

export const sign = (payload: string) => hmac(secret(), payload);

/** Constant-time check of an HMAC over `payload`. */
export async function verify(payload: string, sig: string) {
  const expected = await sign(payload);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function createSessionCookie(slug: string, role: Role) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_S;
  const payload = `${slug}.${role}.${exp}`;
  return `${cookieName(slug)}=${payload}.${await sign(payload)}; Path=/; Max-Age=${MAX_AGE_S}; HttpOnly; Secure; SameSite=Lax`;
}

export const clearSessionCookie = (slug: string) => `${cookieName(slug)}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

export interface Session {
  role: Role;
  /** Looking only, never changing anything: everyone on the demo site. */
  guest: boolean;
}

/**
 * Who is this, on site `slug`. The demo site needs no login: everyone is a guest, seeing the
 * partner's site or (with `x-demo-view: admin`) the admin page.
 */
export async function sessionFromRequest(req: Request, slug: string): Promise<Session | null> {
  const site = SITES[slug];
  if (!site) return null;
  if (site.demo) return { role: req.headers.get('x-demo-view') === 'admin' ? 'admin' : 'partner', guest: true };
  const raw = req.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${cookieName(slug)}=([^;]+)`))?.[1];
  if (!raw) return null;
  const parts = raw.split('.');
  const sig = parts.pop();
  const [s, role, exp] = parts;
  if (parts.length !== 3 || s !== slug || (role !== 'admin' && role !== 'partner') || !sig) return null;
  if (!(Number(exp) > Date.now() / 1000)) return null;
  if (!(await verify(parts.join('.'), sig))) return null;
  return { role, guest: false };
}

/**
 * Logging in is just your first name, the way the original site worked: hers opens her site,
 * his opens the admin page. Case, spaces, geresh and niqqud are forgiven (phone keyboards).
 * Extra accepted spellings come from profile.json `login`. In `npm run dev`, also admin / partner.
 */
const norm = (s: string) => s.normalize('NFKC').replace(/[֑-ׇ]/g, '').replace(/[\s'"׳״`.\-_]/g, '').toLowerCase();

export function roleForPassword(slug: string, password: string): Role | null {
  const site = SITES[slug];
  const p = norm(password);
  if (!site || !p) return null;
  if (process.env.DEV_LOGINS === '1') {
    if (p === 'admin') return 'admin';
    if (p === 'partner') return 'partner';
  }
  if (site.admin.login.some((n) => norm(n) === p)) return 'admin';
  if (site.partner.login.some((n) => norm(n) === p)) return 'partner';
  return null;
}
