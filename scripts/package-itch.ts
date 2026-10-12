import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dir, '..');
const dist = path.join(root, 'dist');
const zipPath = path.join(root, 'cyberspace-trail-itch.zip');

const result = spawnSync('zip', ['-r', zipPath, '.'], { cwd: dist, stdio: 'inherit' });
if (result.status !== 0) {
  console.error('zip failed — install zip (e.g. nix develop) and retry.');
  process.exit(result.status ?? 1);
}
console.log(`Wrote ${zipPath}`);
