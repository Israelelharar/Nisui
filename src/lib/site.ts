import { client } from '../client';
import type { Profile } from '../client/define';

/**
 * Every couple lives at /<slug>/ in one deployment. This module tags every /api call with the
 * site it belongs to (the server reads `x-site`), and, on the demo, with which side is being
 * shown (`x-demo-view`). Import it first (main.tsx).
 */
export const SITE = client.slug;
export const BASE = import.meta.env.BASE_URL;
export const IS_DEMO = !!(client as unknown as Profile).demo;
/** A path inside this site: at('admin') → /<slug>/admin. */
export const at = (path = '') => `${BASE}${path.replace(/^\//, '')}`;

const DEMO_VIEW = 'demo:view';
export function demoView(): 'admin' | 'partner' {
  try {
    return localStorage.getItem(DEMO_VIEW) === 'admin' ? 'admin' : 'partner';
  } catch {
    return 'partner';
  }
}
export function setDemoView(v: 'admin' | 'partner') {
  try {
    localStorage.setItem(DEMO_VIEW, v);
  } catch {
    /* fine */
  }
  window.location.assign(at(v === 'admin' ? 'admin' : ''));
}

const original = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const path = url.startsWith(location.origin) ? url.slice(location.origin.length) : url;
  if (!path.startsWith('/api/')) return original(input, init);
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  // The demo saves nothing. Background saves stay quiet; a button press says why.
  if (IS_DEMO && method !== 'GET' && method !== 'HEAD') {
    if (!/^\/api\/(pet|event|opened)(\?|$)/.test(path) || /^\/api\/pet/.test(path) && method === 'POST') {
      window.dispatchEvent(new CustomEvent('pet:notice', { detail: 'זה אתר לדוגמה, כאן רק מסתכלים 🙂' }));
    }
    return Promise.resolve(Response.json({ error: 'demo' }, { status: 403 }));
  }
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  headers.set('x-site', SITE);
  headers.set('x-demo-view', demoView());
  return original(input, { ...init, headers });
};
