#!/usr/bin/env node
/**
 * Puts a backup of the site's data back into a (new) Upstash Redis store.
 *
 *   KV_REST_API_URL=... KV_REST_API_TOKEN=... [KV_PREFIX=...] node scripts/restore-data.mjs data/site-data.json
 *
 * The file is the one the backup button makes (kind "idw-backup"): every key
 * exactly as it was stored. Strings are SET, sets are SADDed. Existing keys
 * with the same name are overwritten. Nothing else in the store is touched.
 */
import { readFileSync } from 'node:fs';

const [file] = process.argv.slice(2);
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
/** Same KV_PREFIX as the site's Vercel project, when several sites share one database. */
const prefix = process.env.KV_PREFIX ?? '';
if (!file || !url || !token) {
  console.error('usage: KV_REST_API_URL=... KV_REST_API_TOKEN=... node scripts/restore-data.mjs <site-data.json>');
  process.exit(1);
}

const backup = JSON.parse(readFileSync(file, 'utf8'));
if (backup.kind !== 'idw-backup') {
  console.error('This does not look like a site backup (kind should be "idw-backup").');
  process.exit(1);
}

async function cmd(args) {
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  if (!res.ok) throw new Error(`${args[0]} ${args[1]} failed: ${res.status} ${await res.text()}`);
}

let done = 0;
let skipped = 0;
for (const [name, entry] of Object.entries(backup.keys)) {
  const key = prefix + name;
  const { type, value } = entry;
  if (type === 'string' && typeof value === 'string') {
    await cmd(['SET', key, value]);
  } else if (type === 'set' && Array.isArray(value)) {
    await cmd(['DEL', key]);
    for (let i = 0; i < value.length; i += 500) await cmd(['SADD', key, ...value.slice(i, i + 500)]);
  } else {
    console.warn(`skipped ${key} (type ${type})`);
    skipped++;
    continue;
  }
  done++;
  if (done % 25 === 0) console.log(`${done} keys restored…`);
}
console.log(`Done: ${done} keys restored${skipped ? `, ${skipped} skipped` : ''}. Backup was made on ${backup.exportedAt}.`);
