/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

/**
 * The pages that exist outside the app: the browser title, the login page and
 * the home-screen manifest. They're templates in shell/ with {{TOKENS}}
 * filled from the client's profile.json, so nothing about a couple is
 * hard-coded and no client content ever reaches the (public) login page.
 */
interface Profile {
  title: string;
  shortTitle?: string;
  admin: { name: string; gender: 'm' | 'f' };
  partner: { name: string; gender: 'm' | 'f' };
}

const PAGES = ['login.html', 'manifest.webmanifest'];

export function clientShell(clientDir: string): Plugin {
  const profile = JSON.parse(readFileSync(join(clientDir, 'profile.json'), 'utf8')) as Profile;
  const f = profile.partner.gender === 'f';
  const tokens: Record<string, string> = {
    TITLE: profile.title,
    SHORT: profile.shortTitle ?? 'העולם שלנו',
    TO: `ל${profile.partner.name}`,
    TRY_AGAIN: f ? 'נסי שוב' : 'נסה שוב',
    DESC: `כל יום משהו חדש מ${profile.admin.name}`,
  };
  const fill = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (m, k: string) => tokens[k] ?? m);
  const page = (name: string) => fill(readFileSync(join(process.cwd(), 'shell', name), 'utf8'));

  return {
    name: 'client-shell',
    transformIndexHtml: (html) => fill(html),
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split('?')[0].slice(1) ?? '';
        if (!PAGES.includes(name)) return next();
        res.setHeader('Content-Type', name.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/manifest+json');
        res.end(page(name));
      });
    },
    generateBundle() {
      for (const name of PAGES) this.emitFile({ type: 'asset', fileName: name, source: page(name) });
    },
  };
}
