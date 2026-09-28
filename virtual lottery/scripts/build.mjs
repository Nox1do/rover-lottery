import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const header = await readFile(path.join(root, 'src/userscript-header.txt'), 'utf8');
const manifest = [
  'src/main.js'
];
const parts = [];
for (const rel of manifest) parts.push(await readFile(path.join(root, rel), 'utf8'));
await mkdir(path.join(root, 'dist'), { recursive: true });
await writeFile(path.join(root, 'dist/virtual-lottery-v2-auto.user.js'), `${header.trim()}\n\n${parts.join('\n\n')}\n`, 'utf8');
