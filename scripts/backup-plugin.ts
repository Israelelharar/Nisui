/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import type { Plugin } from 'vite';
import { buildZip, type ZipInput } from '../src/lib/zip';

/**
 * Packs this couple's own content (clients/<slug>/: texts, letters, photos) into
 * /backup/content.zip on every build, with docs/BACKUP-README.md on top. The admin's
 * backup button (src/components/ProjectBackup.tsx) downloads it and adds the live data.
 * Only the admin can fetch it (middleware.ts).
 *
 * The site's code is never in it: the code is the owner's, and a buyer's backup is their
 * story, not the product. Demo deployments (DEMO=1) build no backup at all.
 */
function walk(dir: string, root: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, root, out);
    else if (!/(^|\/)\.DS_Store$/.test(name)) out.push(relative(root, full).split(sep).join('/'));
  }
}

export function projectBackup(client: string): Plugin {
  const TOP = `${client}-site`;
  return {
    name: 'project-backup',
    apply: 'build',
    generateBundle() {
      if (process.env.VITE_PREVIEW || process.env.DEMO === '1') return;
      const root = process.cwd();
      const paths: string[] = [];
      walk(join(root, 'clients', client), root, paths);
      paths.sort();
      const file = (name: string, data: Uint8Array): ZipInput => ({ name: `${TOP}/${name}`, data, deflated: deflateRawSync(data, { level: 9 }) });
      const manifest = { builtAt: new Date().toISOString(), commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null, client, files: paths.length };
      const files: ZipInput[] = [
        file('READ-ME-FIRST.md', readFileSync(join(root, 'docs/BACKUP-README.md'))),
        file('backup-manifest.json', new TextEncoder().encode(JSON.stringify(manifest, null, 2))),
        ...paths.map((p) => file(`content/${p.replace(`clients/${client}/`, '')}`, readFileSync(join(root, p)))),
      ];
      this.emitFile({ type: 'asset', fileName: 'backup/content.zip', source: buildZip(files) });
    },
  };
}
