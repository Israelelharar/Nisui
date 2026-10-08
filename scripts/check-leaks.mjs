#!/usr/bin/env node
/**
 * Nothing from the original private site may ship in the template: this
 * fails the check if any of its names, places, in-jokes or numbers show up
 * in the shared code or the demo client.
 *
 *   npm run check:leaks
 *
 * "ישראל" / "Israel" as the country (the map, the moon) is allowed on the
 * lines listed in ALLOW.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['.claude', 'src', 'api', 'shell', 'public', 'scripts', 'docs', 'clients/demo', 'clients/_template', 'clients/_test-photos', 'index.html', 'middleware.ts', 'README.md', 'CLAUDE.md', '.env.example', 'vercel.json'];
const BANNED = [/דניאל/, /ישראל/, /\bIsrael\b/, /\bisrael\b/, /Danielle/, /\bdaniel\b/i, /נתניה/, /אור עקיבא/, /(^|[^א-ת])בובי([^א-ת]|$)/, /ג׳סיקה/, /(^|[^א-ת])יריב([^א-ת]|$)/, /(^|[^א-ת])שרקי([^א-ת]|$)/, /buko|alfi|runda|sokuro/i, /דרבלק/, /פסקל קומו/, /546631352/, /37i9dQZF1F5p3rmiWPIYgZ/, /daniel-sheli/, /Israelelharar/, /hei-aw1sz5/];
const ALLOW = [/מפת ישראל/, /map of Israel/, /seen from Israel/, /over Israel/, /scripts\/check-leaks\.mjs/];
const SKIP = /\.(webp|png|jpg|jpeg|ico|woff2?)$/;

const files = [];
const walk = (p) => {
  if (statSync(p).isDirectory()) for (const n of readdirSync(p)) walk(join(p, n));
  else if (!SKIP.test(p)) files.push(p);
};
for (const r of ROOTS) {
  try {
    walk(r);
  } catch {
    /* optional root */
  }
}

const hits = [];
for (const f of files) {
  if (f === 'scripts/check-leaks.mjs') continue;
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (ALLOW.some((a) => a.test(line))) return;
      for (const b of BANNED) if (b.test(line)) hits.push(`${f}:${i + 1}: ${line.trim().slice(0, 140)}`);
    });
}
if (hits.length) {
  console.error(`✗ ${hits.length} leak(s):\n${hits.join('\n')}`);
  process.exit(1);
}
console.log(`✓ no leaks in ${files.length} files`);
