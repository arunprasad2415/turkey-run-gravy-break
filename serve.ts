// A static server for the game, used while building and play-testing it: `node serve.ts` prints the
// address and serves game/ from the repository root, so game/index.html opens at
// http://localhost:8080 exactly as a finalist reviewer would serve it. No dependency, no build step.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
const port = Number(process.env.PORT ?? 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

const server = createServer(async (req, res) => {
  const wanted = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const path = normalize(join(root, wanted === '/' ? 'index.html' : wanted));
  if (!path.startsWith(root)) {
    res.writeHead(403).end('outside the game');
    return;
  }
  try {
    const info = await stat(path);
    if (!info.isFile()) throw new Error('not a file');
    const body = await readFile(path);
    res.writeHead(200, {
      'content-type': TYPES[extname(path)] ?? 'application/octet-stream',
      'content-length': body.length,
      'cache-control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Gravy Break at http://localhost:${port}\n`);
});