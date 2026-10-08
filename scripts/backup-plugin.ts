/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import type { Plugin } from 'vite';
import { buildZip, type ZipInput } from '../src/lib/zip';

/**
 * Packs the project (code, this client's content and photos, docs, skills)
 * into /backup/project-source.zip on every build, with docs/RECOVERY.md on top
 * as READ-ME-FIRST.md. The admin's backup button (src/components/ProjectBackup.tsx)
 * downloads it and adds the live data. Only the admin can fetch it (middleware.ts).
 *
 * Other clients' folders are never packed: each couple's backup holds their
 * own content only.
 */
const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-preview', '.git', '.vercel', '.cache']);
const SKIP_FILES = /(^|\/)(\.env(?!\.example$).*|.*\.log|.*\.tsbuildinfo|\.DS_Store|settings\.local\.json)$/;

function walk(dir: string, root: string, out: string[], client: string) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(root, full).split(sep).join('/');
    if (statSync(full).isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      if (rel.startsWith('clients/') && rel !== `clients/${client}` && rel.split('/').length === 2 && name !== '_template') continue;
      walk(full, root, out, client);
    } else if (!SKIP_FILES.test(rel)) out.push(rel);
  }
}

export function projectBackup(client: string): Plugin {
  const TOP = `${client}-site`;
  return {
    name: 'project-backup',
    apply: 'build',
    generateBundle() {
      if (process.env.VITE_PREVIEW) return;
      const root = process.cwd();
      const paths: string[] = [];
      walk(root, root, paths, client);
      paths.sort();
      const file = (name: string, data: Uint8Array): ZipInput => ({ name: `${TOP}/${name}`, data, deflated: deflateRawSync(data, { level: 9 }) });
      const manifest = {
        builtAt: new Date().toISOString(),
        commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
        client,
        files: paths.length,
      };
      const files: ZipInput[] = [
        file('READ-ME-FIRST.md', readFileSync(join(root, 'docs/RECOVERY.md'))),
        file('backup-manifest.json', new TextEncoder().encode(JSON.stringify(manifest, null, 2))),
        ...paths.map((p) => file(`project/${p}`, readFileSync(join(root, p)))),
      ];
      this.emitFile({ type: 'asset', fileName: 'backup/project-source.zip', source: buildZip(files) });
    },
  };
}
