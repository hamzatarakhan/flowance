/**
 * Post-build fixup for GitHub Pages deployment.
 * Runs after `vite build GH_PAGES=1` (which may partially fail at the Nitro SSR step).
 * Reads the Vite manifest to find entry JS/CSS, copies public/ statics, writes index.html.
 */
import { readFileSync, writeFileSync, readdirSync, copyFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const OUT = '.output/public';
const ASSETS = join(OUT, 'assets');
const BASE = '/flowance/';

mkdirSync(ASSETS, { recursive: true });

// --- find entry from Vite manifest (at outDir/.vite/manifest.json) ---
let entryJs = null;
let entryCss = [];

const manifestPath = join(OUT, '.vite', 'manifest.json');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  for (const chunk of Object.values(manifest)) {
    if (chunk.isEntry) {
      entryJs = chunk.file;           // e.g. "assets/index-HASH.js"
      if (chunk.css) entryCss = chunk.css; // e.g. ["assets/style-HASH.css"]
      break;
    }
  }
  console.log('Read manifest:', { entryJs, entryCss });
}

// fallback: glob assets/ dir (add "assets/" prefix for correct hrefs)
if (!entryJs) {
  const files = readdirSync(ASSETS);
  const jsFiles = files
    .filter(f => f.endsWith('.js'))
    .map(f => ({ f, size: statSync(join(ASSETS, f)).size }))
    .sort((a, b) => b.size - a.size);
  const cssFiles = files.filter(f => f.endsWith('.css'));
  entryJs = jsFiles[0] ? `assets/${jsFiles[0].f}` : null;
  entryCss = cssFiles.map(f => `assets/${f}`);
  console.log('Manifest not found — using glob fallback:', { entryJs, entryCss });
}

if (!entryJs) {
  console.error('ERROR: No entry JS found in', ASSETS);
  console.error('Directory contents:', readdirSync(ASSETS));
  process.exit(1);
}

// --- copy public/ static files that aren't already in output ---
if (existsSync('public')) {
  for (const f of readdirSync('public')) {
    const src = join('public', f);
    const dest = join(OUT, f);
    try {
      if (statSync(src).isFile() && !existsSync(dest)) {
        copyFileSync(src, dest);
      }
    } catch { /* skip dirs or permission errors */ }
  }
}

// --- generate index.html ---
const cssLinks = entryCss.map(f => `    <link rel="stylesheet" href="${BASE}${f}" />`).join('\n');

// TanStack Start expects window.$_TSR to be initialized by the SSR inline script.
// Without SSR, we must provide a minimal stub so the client entry doesn't crash.
const tsrStub = `<script>
    window.$_TSR = {
      router: { manifest: { routes: {}, assets: {} }, matches: [] },
      buffer: [],
      initialized: false,
      h: function() {},
      t: new Map()
    };
  </script>`;

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Flowance — أموالك، بوضوح</title>
    <meta name="description" content="تطبيق فلونس لإدارة المصاريف الشهرية، تتبّع المدفوعات ومراقبة الميزانية بوضوح." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
${cssLinks}
  </head>
  <body>
    ${tsrStub}
    <script type="module" src="${BASE}${entryJs}"></script>
  </body>
</html>`;

writeFileSync(join(OUT, 'index.html'), html);
writeFileSync(join(OUT, '404.html'), html);

console.log('index.html + 404.html written.');
console.log('Deploy dir:', readdirSync(OUT));
