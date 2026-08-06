/**
 * Génère un sous-ensemble de Boxicons limité aux icônes réellement utilisées.
 *
 * La police complète pèse 115 Ko (woff2) + 68 Ko de CSS pour 1634 icônes, alors
 * que le site n'en utilise qu'une centaine. Ce script produit :
 *   - public/assets/fonts/boxicons.subset.woff2
 *   - public/assets/css/boxicons.subset.css
 *
 * Toutes les classes d'icônes du projet sont des littéraux (aucune construction
 * dynamique du type `'bx-' + name`), donc un scan statique est exhaustif.
 * Si un jour une classe est construite dynamiquement, ajoute-la à EXTRA_ICONS.
 *
 * Usage : node scripts/subsetBoxicons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SOURCE_CSS = path.join(root, 'public/assets/css/boxicons.min.css');
const SOURCE_FONT = path.join(root, 'public/assets/fonts/boxicons.woff2');
const OUT_CSS = path.join(root, 'public/assets/css/boxicons.subset.css');
const OUT_FONT = path.join(root, 'public/assets/fonts/boxicons.subset.woff2');

// Répertoires scannés pour repérer les classes utilisées.
const SCAN_DIRS = [path.join(root, 'src'), path.join(root, 'public/assets/js')];
const SCAN_EXT = /\.(astro|js|ts|md|mdx|json|html|css)$/;

// Filet de sécurité : icônes à toujours inclure même si le scan ne les voit pas.
const EXTRA_ICONS = [];

const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
      )
    : [];

// --- 1. Table classe -> point de code, depuis la CSS d'origine ---------------
const css = fs.readFileSync(SOURCE_CSS, 'utf8');
const codepoints = new Map();
for (const m of css.matchAll(/\.(bx[a-z]?-[a-z0-9-]+):before\{content:"\\([0-9a-f]+)"\}/g)) {
  codepoints.set(m[1], String.fromCodePoint(parseInt(m[2], 16)));
}

// --- 2. Classes réellement utilisées ----------------------------------------
const used = new Set(EXTRA_ICONS);
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir).filter((f) => SCAN_EXT.test(f))) {
    // On ignore les artefacts générés pour ne pas se scanner soi-même.
    if (file === OUT_CSS || file === SOURCE_CSS) continue;
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/\bbx[a-z]?-[a-z0-9-]+/g)) {
      if (codepoints.has(m[0])) used.add(m[0]);
    }
  }
}

const sorted = [...used].sort();
if (sorted.length === 0) throw new Error('Aucune icône détectée — scan probablement cassé.');

// --- 3. Sous-ensemble de la police ------------------------------------------
const glyphs = sorted.map((c) => codepoints.get(c)).join('');
const subset = await subsetFont(fs.readFileSync(SOURCE_FONT), glyphs, { targetFormat: 'woff2' });
fs.writeFileSync(OUT_FONT, subset);

// --- 4. CSS minimale : règles utilitaires + seulement les icônes retenues ----
// On conserve les règles hors ':before' (.bx, .bx-ul, .bx-spin, tailles, rotations…)
// car elles peuvent être utilisées, et elles sont négligeables en taille.
const utility = css
  .slice(css.indexOf('.bx{'))
  .match(/\.[a-z][^{}]*\{[^}]*\}/g)
  .filter((rule) => !/:before\{content:"\\[0-9a-f]+"\}/.test(rule))
  .join('');

const fontFace =
  "@font-face{font-family:boxicons;font-weight:400;font-style:normal;font-display:swap;" +
  "src:url(../fonts/boxicons.subset.woff2) format('woff2')}";

const icons = sorted
  .map((c) => `.${c}:before{content:"\\${codepoints.get(c).codePointAt(0).toString(16)}"}`)
  .join('');

fs.writeFileSync(OUT_CSS, fontFace + utility + icons + '\n');

// --- 5. Rapport --------------------------------------------------------------
const kb = (p) => (fs.statSync(p).size / 1024).toFixed(1) + ' Ko';
console.log(`Icônes : ${sorted.length} retenues sur ${codepoints.size} disponibles`);
console.log(`Police : ${kb(SOURCE_FONT)} -> ${kb(OUT_FONT)}`);
console.log(`CSS    : ${kb(SOURCE_CSS)} -> ${kb(OUT_CSS)}`);
