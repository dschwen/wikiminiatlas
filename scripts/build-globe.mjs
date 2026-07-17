import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const poly2tri = await readFile(
  resolve(repositoryRoot, 'min/poly2tri.min.js'),
  'utf8'
);

await build({
  absWorkingDir: repositoryRoot,
  entryPoints: ['globe/main.mjs'],
  outfile: 'min/wma-globe.min.js',
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  legalComments: 'none',
  sourcemap: true,
  sourcesContent: true,
  banner: {
    js: `${poly2tri}\nglobalThis.p2t=p2t;`
  }
});

await build({
  absWorkingDir: repositoryRoot,
  entryPoints: ['globe/globe.css'],
  outfile: 'min/wma-globe.min.css',
  bundle: false,
  minify: true,
  legalComments: 'none',
  sourcemap: true,
  sourcesContent: true
});
