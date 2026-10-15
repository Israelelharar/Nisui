/**
 * Signed session cookie: `<role>.<expires>.<hmac>`. Works on the edge
 * (middleware) and in Node functions (Web Crypto in both).
 */
export type Role = 'admin' | 'partner';

export const COOKIE = 'cs_s';
const MAX_AGE_S = 400 * 24 * 60 * 60;

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

/**
 * `guest`: someone the owner showed the demo to with a link (DEMO=1 deployments). They look around
 * as the role in the link until it expires, and can never change anything or make more links.
 */
export async function createSessionCookie(role: Role, opts: { guest?: boolean; maxAge?: number } = {}) {
  const maxAge = Math.max(60, Math.min(MAX_AGE_S, Math.floor(opts.maxAge ?? MAX_AGE_S)));
  const exp = Math.floor(Date.now() / 1000) + maxAge;
  const payload = opts.guest ? `${role}.${exp}.g` : `${role}.${exp}`;
  const value = `${payload}.${await hmac(secret(), payload)}`;
  return `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export const clearSessionCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

export interface Session {
  role: Role;
  guest: boolean;
}

export async function sessionFromRequest(req: Request): Promise<Session | null> {
  const raw = req.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))?.[1];
  if (!raw) return null;
  const parts = raw.split('.');
  const sig = parts.pop();
  const [role, exp, flag] = parts;
  if ((role !== 'admin' && role !== 'partner') || !exp || !sig || parts.length > 3 || (flag !== undefined && flag !== 'g')) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  if (!(await verify(parts.join('.'), sig))) return null;
  return { role, guest: flag === 'g' };
}

export async function roleFromRequest(req: Request): Promise<Role | null> {
  return (await sessionFromRequest(req))?.role ?? null;
}

/** Constant-time check of an HMAC over `payload`. */
export async function verify(payload: string, sig: string) {
  const expected = await hmac(secret(), payload);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export const sign = async (payload: string) => hmac(secret(), payload);

/** Passwords live in env vars, never in the repo. Case and spaces are forgiven (phone keyboards). */
export function roleForPassword(password: string): Role | null {
  const norm = (s: string | undefined) => (s ?? '').trim().toLowerCase();
  const p = norm(password);
  if (!p) return null;
  if (p === norm(process.env.ADMIN_PASSWORD)) return 'admin';
  if (p === norm(process.env.PARTNER_PASSWORD)) return 'partner';
  return null;
}
