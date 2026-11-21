// Leonida Legend — entry program for gta6-trophy-guide-01 (Node 22, stdlib only).
//
// The guide itself is plain static files under app/ (index.html, ES modules,
// CSS, data/trophies.json) that any static server can host and that work with
// the network off. This program hands the guide in: it copies app/ and
// screenshots/ next to this file into the output directory and writes
// dossier.json there with the vendored make.fun library, byte for byte what
// the scorer rebuilds. vendor/makefun-frontend.ts is the kit's copy, untouched.
//
// Run locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader MAKEFUN_OUTPUT_DIR is unset and /output is used.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps for this bounty (reference/gate.json): the dossier text
// is capped at 160 KiB; at most 4 screenshots of 256 KiB each; app/ holds at
// most 993 files and directories and 48 MiB in all.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function fail(message) {
  throw new Error(`leonida-legend main.ts: ${message}`);
}

// Sanity checks before anything is copied, so a broken hand-in fails here
// with a readable message instead of failing the gate later.
function checkHandIn() {
  const trophyPath = join(repoRoot, 'app', 'data', 'trophies.json');
  if (!existsSync(trophyPath)) fail('app/data/trophies.json is missing');
  const data = JSON.parse(readFileSync(trophyPath, 'utf8'));
  const list = Array.isArray(data) ? data : data.trophies;
  if (!Array.isArray(list) || list.length !== 55) {
    fail(`expected 55 trophies, found ${Array.isArray(list) ? list.length : 'no list'}`);
  }
  for (const trophy of list) {
    if (typeof trophy.name !== 'string' || !trophy.name.trim()) fail('a trophy has no name');
    if (typeof trophy.guide !== 'string' || !trophy.guide.trim()) fail(`trophy ${trophy.name} has no guide`);
  }
  const shotsDir = join(repoRoot, 'screenshots');
  if (!existsSync(shotsDir)) fail('screenshots/ is missing');
  const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    fail(`expected 3 or 4 screenshots, found ${shots.length}`);
  }
  return { trophies: list.length, shots: shots.length };
}

function handIn() {
  const checked = checkHandIn();
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outputDir, dossierCaps);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  console.log(
    `Leonida Legend handed in: ${checked.trophies} trophies, ${checked.shots} screenshots, dossier ${dossier.length} bytes -> ${outputDir}`,
  );
}

handIn();
