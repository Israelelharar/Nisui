// `npm run build`: every couple in clients/ (not the _ folders) into one deployment,
// dist/<slug>/, each with its own address /<slug>/. Plus the server's list of sites.
import { execSync } from 'node:child_process';
import { readdirSync, existsSync, writeFileSync, rmSync } from 'node:fs';

const run = (cmd, env = {}) => execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });
run('node scripts/gen-sites.mjs');
run('tsc -p tsconfig.json && tsc -p tsconfig.server.json');
const only = process.env.CLIENT;
const slugs = readdirSync('clients').filter((s) => !s.startsWith('_') && existsSync(`clients/${s}/index.ts`) && (!only || s === only));
rmSync('dist', { recursive: true, force: true });
for (const slug of slugs) {
  console.log(`\n== ${slug}`);
  run(`npx vite build --logLevel warn --outDir dist/${slug} --emptyOutDir`, { CLIENT: slug });
}
writeFileSync('dist/robots.txt', 'User-agent: *\nDisallow: /\n');
console.log(`\nbuilt: ${slugs.map((s) => `/${s}/`).join('  ')}`);
