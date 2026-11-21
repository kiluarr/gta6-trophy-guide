// Leonida Legend — the entry program (Node 22, standard library only).
//
// What it hands in: this repository's app/ (the offline trophy guide and
// tracker: index.html, its modules, styles and data/trophies.json) plus
// screenshots/ (3 or 4 real renders of the guide), copied to /output, with
// /output/dossier.json written by the vendored make.fun library — the summary
// the judge reads (the screenshots, the first load's files and bytes, and the
// source outline). vendor/makefun-frontend.ts stays exactly as the kit ships
// it: the scorer rebuilds the dossier with its own copy and compares bytes.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The scorer's own caps for this bounty (reference/gate.json): the dossier
// text is capped at 160 KiB; at most 4 screenshots, each at most 256 KiB;
// app/ at most 993 files and directories and 48 MiB in all. The program
// refuses an entry the scorer would refuse, so a bad build fails loudly here
// instead of silently at the gate.
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function countShots(dir) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((name) => {
    const file = join(dir, name);
    return !name.startsWith('.') && statSync(file).isFile();
  }).length;
}

const shotCount = countShots(join(repoRoot, 'screenshots'));
if (shotCount < 3 || shotCount > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shotCount}`);
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_OPTIONS));
