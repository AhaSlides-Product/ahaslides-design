#!/usr/bin/env node
/**
 * favicons.mjs — renders logo/favicon/ from logo/thesplash.svg (colour mark, centred, 10% padding).
 *
 *   node favicons.mjs     writes favicon-32.png, favicon-180.png (white ground), favicon-512.png, favicon.ico (16+32+48)
 *
 * Needs headless Chrome: set CHROME_BIN, or it falls back to a Playwright download.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const OUT = join(root, 'logo', 'favicon');
const PADDING = 0.1;
const CHROME = process.env.CHROME_BIN || join(homedir(), '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
if (!existsSync(CHROME)) { console.error('favicons: set CHROME_BIN to a Chrome binary'); process.exit(1); }

const svg = readFileSync(join(root, 'logo', 'thesplash.svg'), 'utf8').replace(/<svg\s+width="\d+"\s+height="\d+"/, '<svg width="100%" height="100%"');
const work = mkdtempSync(join(tmpdir(), 'favicons-'));

function render(size, background) {
  const page = join(work, `p${size}.html`);
  const pad = Math.round(size * PADDING);
  writeFileSync(page, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:${size}px;height:${size}px;background:${background}}div{box-sizing:border-box;width:${size}px;height:${size}px;padding:${pad}px}</style><div>${svg}</div>`);
  const png = join(work, `f${size}.png`);
  execFileSync(CHROME, ['--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${size},${size}`, `--default-background-color=${background === 'transparent' ? '00000000' : 'FFFFFFFF'}`,
    `--screenshot=${png}`, `file://${page}`], { stdio: 'ignore' });
  return readFileSync(png);
}

function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i;
    header[at] = size; header[at + 1] = size;
    header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(data.length, at + 8); header.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map(i => i.data)]);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'favicon-32.png'), render(32, 'transparent'));
writeFileSync(join(OUT, 'favicon-180.png'), render(180, '#FFFFFF'));
writeFileSync(join(OUT, 'favicon-512.png'), render(512, 'transparent'));
writeFileSync(join(OUT, 'favicon.ico'), ico([16, 32, 48].map(size => ({ size, data: render(size, 'transparent') }))));
console.log('favicons: wrote logo/favicon/');
