import { build } from 'esbuild';
import { compile } from 'sass';
import { zipSync } from 'fflate';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';

const target = process.argv[2] || 'chrome';
if (!['chrome', 'firefox', 'opera'].includes(target)) throw new Error('Unknown browser: ' + target);
const out = `build/${target}`;
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(path.join(dir, e.name)) : path.join(dir, e.name)))).flat();
}
async function rebuild() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await cp('src', out, { recursive: true, filter: src => !['scripts', 'styles', 'images'].includes(path.basename(src)) });
  for (const dir of ['shared', target]) {
    try { await cp(`src/images/${dir}`, `${out}/images`, { recursive: true }); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await mkdir(`${out}/styles`, { recursive: true });
  for (const file of (await files('src/styles')).filter(f => !f.endsWith('.scss'))) {
    const dest = path.join(out, 'styles', path.relative('src/styles', file));
    await mkdir(path.dirname(dest), { recursive: true });
    await cp(file, dest);
  }
  for (const file of (await files('src/styles')).filter(f => f.endsWith('.scss') && !path.basename(f).startsWith('_'))) {
    const css = compile(file, { style: 'compressed' }).css;
    await writeFile(`${out}/styles/${path.basename(file, '.scss')}.css`, css);
  }
  const entries = (await readdir('src/scripts')).filter(f => f.endsWith('.js') && f !== 'livereload.js').map(f => `src/scripts/${f}`);
  await build({ entryPoints: entries, outdir: `${out}/scripts`, bundle: true, minify: true, target: ['chrome120', 'firefox128'] });
  const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
  if (target !== 'firefox') {
    manifest.manifest_version = 3;
    if (manifest.browser_action) { manifest.action = manifest.browser_action; delete manifest.browser_action; }
    if (manifest.background?.scripts) manifest.background = { service_worker: manifest.background.scripts[0] };
  }
  await writeFile(`${out}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
  if (process.argv.includes('--zip')) {
    const entries = {};
    for (const f of await files(out)) entries[path.relative(out, f).split(path.sep).join('/')] = new Uint8Array(await readFile(f));
    await mkdir('dist', { recursive: true });
    await writeFile(`dist/${target}.zip`, zipSync(entries));
  }
  console.log(`Built ${out}`);
}
await rebuild();
if (process.argv.includes('--watch')) {
  let timer;
  watch('src', { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(() => rebuild().catch(console.error), 150); });
}
