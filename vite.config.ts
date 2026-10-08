import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectBackup } from './scripts/backup-plugin';
import { clientShell } from './scripts/shell-plugin';
import { devApi } from './scripts/dev-api-plugin';

/**
 * CLIENT picks the couple: clients/<CLIENT>/ (defaults to the demo couple).
 * Each client's Vercel project sets it as an environment variable.
 */
const CLIENT = process.env.CLIENT || 'demo';
const clientDir = resolve(__dirname, 'clients', CLIENT);
if (!existsSync(resolve(clientDir, 'index.ts'))) throw new Error(`Unknown CLIENT "${CLIENT}": clients/${CLIENT}/index.ts is missing`);

// VITE_PREVIEW=1 builds a static preview (hash routes, relative paths, no server).
export default defineConfig({
  base: process.env.VITE_PREVIEW ? './' : '/',
  resolve: { alias: { '@client': clientDir } },
  plugins: [react(), tailwindcss(), clientShell(clientDir), devApi(), projectBackup(CLIENT)],
});
