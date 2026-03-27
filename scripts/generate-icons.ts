/**
 * Generate simple PNG icons for the RecDex PWA.
 * Creates solid dark squares with "RD" text.
 *
 * Usage: npx tsx scripts/generate-icons.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Minimal PNG encoder — creates an uncompressed PNG from raw RGBA pixels
function createPNG(width: number, height: number, pixels: Uint8Array): Buffer {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk("IHDR", ihdr);

  // IDAT chunk — raw image data with zlib wrapper
  // Each row has a filter byte (0 = none) followed by RGBA pixels
  const rawRows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const filterByte = Buffer.from([0]);
    const row = Buffer.from(pixels.buffer, y * width * 4, width * 4);
    rawRows.push(Buffer.concat([filterByte, row]));
  }
  const rawData = Buffer.concat(rawRows);

  // Use Node's zlib to deflate
  const zlib = require("zlib");
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk("IDAT", compressed);

  // IEND chunk
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Draw "RD" text as simple pixel art on a dark background
function generateIcon(size: number, maskable: boolean): Buffer {
  const pixels = new Uint8Array(size * size * 4);

  // Background: #1C1917
  const bgR = 0x1c,
    bgG = 0x19,
    bgB = 0x17;
  // Text color: #F97316 (orange)
  const fgR = 0xf9,
    fgG = 0x73,
    fgB = 0x16;

  // Fill background
  for (let i = 0; i < size * size; i++) {
    pixels[i * 4] = bgR;
    pixels[i * 4 + 1] = bgG;
    pixels[i * 4 + 2] = bgB;
    pixels[i * 4 + 3] = 255;
  }

  // Simple "RD" bitmap pattern (7x5 per character, 15 cols total with spacing)
  // prettier-ignore
  const R = [
    [1,1,1,0],
    [1,0,0,1],
    [1,1,1,0],
    [1,0,1,0],
    [1,0,0,1],
  ];
  // prettier-ignore
  const D = [
    [1,1,1,0],
    [1,0,0,1],
    [1,0,0,1],
    [1,0,0,1],
    [1,1,1,0],
  ];

  const letters = [R, D];
  const letterWidth = 4;
  const letterHeight = 5;
  const gap = 1;
  const totalWidth = letterWidth * 2 + gap; // 9
  const totalHeight = letterHeight; // 5

  // Scale factor: letter block size relative to icon
  const safeZone = maskable ? 0.3 : 0.15; // maskable needs more padding
  const usable = size * (1 - safeZone * 2);
  const blockSize = Math.floor(usable / Math.max(totalWidth, totalHeight));
  const startX = Math.floor((size - totalWidth * blockSize) / 2);
  const startY = Math.floor((size - totalHeight * blockSize) / 2);

  function drawBlock(bx: number, by: number) {
    for (let dy = 0; dy < blockSize; dy++) {
      for (let dx = 0; dx < blockSize; dx++) {
        const px = bx + dx;
        const py = by + dy;
        if (px >= 0 && px < size && py >= 0 && py < size) {
          const idx = (py * size + px) * 4;
          pixels[idx] = fgR;
          pixels[idx + 1] = fgG;
          pixels[idx + 2] = fgB;
          pixels[idx + 3] = 255;
        }
      }
    }
  }

  let offsetX = startX;
  for (const letter of letters) {
    for (let row = 0; row < letterHeight; row++) {
      for (let col = 0; col < letterWidth; col++) {
        if (letter[row][col]) {
          drawBlock(
            offsetX + col * blockSize,
            startY + row * blockSize
          );
        }
      }
    }
    offsetX += (letterWidth + gap) * blockSize;
  }

  return createPNG(size, size, pixels);
}

// Generate icons
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const sizes: [number, string, boolean][] = [
  [192, "icon-192.png", false],
  [512, "icon-512.png", false],
  [512, "icon-maskable-512.png", true],
];

for (const [size, name, maskable] of sizes) {
  const png = generateIcon(size, maskable);
  const path = join(outDir, name);
  writeFileSync(path, png);
  console.log(`Generated ${name} (${size}x${size}, ${png.length} bytes)`);
}

console.log("Done! Icons written to public/icons/");
