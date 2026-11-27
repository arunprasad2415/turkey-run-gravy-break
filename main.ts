// Gravy Break, entry program for make.fun's turkey-run-game-01 bounty.
// Runs on Node 22 with the standard library only. It stages the shipped game and its screenshots in
// the output directory and writes dossier.json there with the kit's own buildDossier, which is the
// file the judge reads. /output is the grader's directory; MAKEFUN_OUTPUT_DIR stands in outside it.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Nothing is fetched and nothing is generated here: what goes in is exactly what the repository
// holds, which is what the gate later re-reads from /output.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps the scorer applies. buildDossier refuses rather than writing a dossier the gate would
// reject, so an over-size game fails here, loudly, instead of being discovered at submission.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function countTree(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const inner = countTree(path);
      files += inner.files;
      bytes += inner.bytes;
    } else {
      files += 1;
      bytes += 1;
    }
  }
  return { files, bytes };
}

function copyInto(source, target) {
  if (!existsSync(source)) throw new Error(`missing ${source}: the entry ships its game and screenshots`);
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(outDir, { recursive: true });

copyInto(join(root, 'game'), join(outDir, 'game'));
copyInto(join(root, 'screenshots'), join(outDir, 'screenshots'));

const dossier = buildDossier(outDir, CAPS);
writeFileSync(join(outDir, 'dossier.json'), dossier);

const game = countTree(join(outDir, 'game'));
const shots = readdirSync(join(outDir, 'screenshots')).filter((name) => /\.(png|jpe?g)$/i.test(name));
process.stdout.write(
  `gravy-break: staged game/ (${game.files} files) and ${shots.length} screenshots in ${outDir}\n`
  + `gravy-break: wrote dossier.json, ${dossier.byteLength} bytes\n`,
);