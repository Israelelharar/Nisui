import { createRequire } from 'node:module';
import fs from 'node:fs';
import { spec } from './specs.mjs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const dir = new URL('.', import.meta.url).pathname;
const [v, mode = 'video', ...stills] = process.argv.slice(2);
const sp = spec(v);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto('file://' + dir + 'stage.html');
await p.evaluate((s) => window.setup(s), sp);
if (mode === 'still') {
  for (const t of stills) { await p.evaluate((t) => window.render(t), Number(t)); await p.screenshot({ path: `${dir}s2-${v}-${t}.jpg`, type: 'jpeg', quality: 85 }); }
} else {
  const fdir = `${dir}f2_${v}`; fs.rmSync(fdir, { recursive: true, force: true }); fs.mkdirSync(fdir);
  const n = Math.ceil(sp.duration * 30);
  for (let f = 0; f < n; f++) {
    await p.evaluate((t) => window.render(t), f / 30);
    await p.screenshot({ path: `${fdir}/${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93 });
  }
  console.log('frames', n);
}
await b.close();
fs.writeFileSync(`${dir}cuts${v}.json`, JSON.stringify(sp.scenes.map((s) => ({ t: s.t, kind: s.kind, streak: !!s.streak }))));
