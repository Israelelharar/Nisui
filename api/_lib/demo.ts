import { sign, verify, type Role } from './session.js';

/**
 * Demo links (deployments with DEMO=1). The owner makes a link per person from the admin page; it
 * logs them in as a guest for a few days and then stops working. Signed with SESSION_SECRET, so
 * nobody can make or stretch one.
 */
export const isDemo = () => process.env.DEMO === '1';

const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

export async function makeDemoToken(role: Role, days: number, label: string) {
  const exp = Math.floor(Date.now() / 1000) + Math.round(Math.max(1, Math.min(30, days)) * 86_400);
  const payload = `${role}.${exp}.${b64(label.trim().slice(0, 40) || 'דמו')}`;
  return `${payload}.${await sign(`demo:${payload}`)}`;
}

export type DemoToken = { role: Role; exp: number; label: string };

/** The token, 'expired', or null when it is not a real one. */
export async function readDemoToken(token: string): Promise<DemoToken | 'expired' | null> {
  const parts = token.split('.');
  if (parts.length !== 4) return null;
  const [role, exp, label, sig] = parts;
  if ((role !== 'admin' && role !== 'partner') || !/^\d+$/.test(exp)) return null;
  if (!(await verify(`demo:${role}.${exp}.${label}`, sig))) return null;
  if (Number(exp) < Date.now() / 1000) return 'expired';
  try {
    return { role, exp: Number(exp), label: unb64(label) };
  } catch {
    return null;
  }
}
