import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

const svg = readFileSync(resolve(publicDir, 'logo-app-icon.svg'));

const icons = [
  { size: 512, file: 'icon-512.png' },
  { size: 192, file: 'icon-192.png' },
  { size: 180, file: 'apple-touch-icon.png' },
  { size: 32,  file: 'favicon-32.png' },
];

for (const { size, file } of icons) {
  await sharp(svg).resize(size, size).png().toFile(resolve(publicDir, file));
  console.log(`✓ ${file} (${size}x${size})`);
}

console.log('\nÍcones gerados em /public');
