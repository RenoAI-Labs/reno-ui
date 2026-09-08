#!/usr/bin/env node
/**
 * Regenerates `public/media/sample-photo.png`, the image the cropper demo uses.
 *
 * Why generated rather than a stock photo: the demo pages are swept by
 * `check-render.mjs`, which fails on a failed request, so the source has to be
 * served from this repository — and a checked-in photo is a licence question
 * nobody wants to answer twice. A gradient with an 80px grid and a centred ring
 * also demonstrates the component better than a photograph would: the grid is
 * what makes it obvious which part of the frame a crop kept.
 *
 * Usage: node scripts/make-sample-photo.mjs
 */

import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_PATH = join(ROOT, "public/media/sample-photo.png");

const WIDTH = 960;
const HEIGHT = 640;
const GRID = 80;
const RING_RADIUS = 160;

/** PNG chunk: length, type, data, CRC32 of type+data. */
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body) >>> 0, body.length + 4);
  return out;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

function pixels() {
  // One filter byte per scanline (0 = none) followed by RGB triples.
  const raw = Buffer.alloc(HEIGHT * (1 + WIDTH * 3));
  let offset = 0;

  for (let y = 0; y < HEIGHT; y += 1) {
    raw[offset] = 0;
    offset += 1;
    for (let x = 0; x < WIDTH; x += 1) {
      const t = (x / WIDTH) * 0.6 + (y / HEIGHT) * 0.4;
      let r = Math.round(40 + 180 * t);
      let g = Math.round(70 + 120 * (1 - t));
      let b = Math.round(140 + 90 * t);

      if (x % GRID < 2 || y % GRID < 2) {
        r = Math.min(255, r + 45);
        g = Math.min(255, g + 45);
        b = Math.min(255, b + 45);
      }

      const distance = Math.hypot(x - WIDTH / 2, y - HEIGHT / 2);
      if (Math.abs(distance - RING_RADIUS) < 3) [r, g, b] = [250, 250, 250];

      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      offset += 3;
    }
  }
  return raw;
}

const header = Buffer.alloc(13);
header.writeUInt32BE(WIDTH, 0);
header.writeUInt32BE(HEIGHT, 4);
header[8] = 8; // bit depth
header[9] = 2; // colour type: truecolour

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", header),
  chunk("IDAT", deflateSync(pixels(), { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

writeFileSync(OUT_PATH, png);
console.log(`wrote public/media/sample-photo.png (${WIDTH}x${HEIGHT}, ${png.length} bytes)`);
