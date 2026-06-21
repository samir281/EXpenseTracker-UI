// Renders scripts/icon-source.svg into the PNG icons the PWA manifest needs.
// Run with Node 18: node scripts/gen-icons.mjs
import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const svg = readFileSync(join(here, "icon-source.svg"));
mkdirSync(join(root, "public"), { recursive: true });

const targets = [
  ["public/pwa-192.png", 192],
  ["public/pwa-512.png", 512],
  ["public/apple-touch-icon.png", 180],
  ["public/favicon-32.png", 32],
];

for (const [out, size] of targets) {
  await sharp(svg).resize(size, size).png().toFile(join(root, out));
  console.log(`  ✅ ${out} (${size}x${size})`);
}
console.log("Done.");
