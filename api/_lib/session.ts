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

export async function createSessionCookie(role: Role) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_S;
  const payload = `${role}.${exp}`;
  const value = `${payload}.${await hmac(secret(), payload)}`;
  return `${COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE_S}; HttpOnly; Secure; SameSite=Lax`;
}

export const clearSessionCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

export async function roleFromRequest(req: Request): Promise<Role | null> {
  const raw = req.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))?.[1];
  if (!raw) return null;
  const [role, exp, sig] = raw.split('.');
  if ((role !== 'admin' && role !== 'partner') || !exp || !sig) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  const expected = await hmac(secret(), `${role}.${exp}`);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? role : null;
}

/** Passwords live in env vars, never in the repo. Case and spaces are forgiven (phone keyboards). */
export function roleForPassword(password: string): Role | null {
  const norm = (s: string | undefined) => (s ?? '').trim().toLowerCase();
  const p = norm(password);
  if (!p) return null;
  if (p === norm(process.env.ADMIN_PASSWORD)) return 'admin';
  if (p === norm(process.env.PARTNER_PASSWORD)) return 'partner';
  return null;
}
