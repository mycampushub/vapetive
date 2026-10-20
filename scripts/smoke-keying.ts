/**
 * smoke-keying.ts — convert generated smoke plates (white smoke on
 * pure black) into TRUE transparent PNG overlays.
 *
 * Technique: luminance keying. For every pixel, alpha = luminance and
 * RGB is normalised to white, so the black backdrop disappears and the
 * remaining vapor is a clean white, alpha-graded texture. Resulting
 * PNGs can be tinted, blurred, scaled and blended (screen) freely in
 * CSS — perfect overlay layers for the neon smoke engine.
 *
 * Run: bun scripts/smoke-keying.ts
 */
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";

const SRC_DIR = path.resolve("scripts/smoke-src");
const OUT_DIR = path.resolve("public/smoke");

const PLATES: Array<{ file: string; out: string; width: number; gain: number }> = [
  { file: "smoke-raw-1.png", out: "smoke-plume.png", width: 1200, gain: 1.12 },
  { file: "smoke-raw-2.png", out: "smoke-wisps.png", width: 1200, gain: 1.18 },
  { file: "smoke-raw-3.png", out: "smoke-column.png", width: 860, gain: 1.1 },
];

async function keyPlate({ file, out, width, gain }: (typeof PLATES)[number]) {
  const src = path.join(SRC_DIR, file);
  const dst = path.join(OUT_DIR, out);

  const img = sharp(src).resize({ width, withoutEnlargement: true });
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const px = new Uint8Array(data);
  const FLOOR = 16; // backdrop noise threshold — anything below is transparent
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    // Luminance (max-channel keeps bright wisps; crushes the black bg)
    const lum = Math.max(r, g, b);
    let alpha = 0;
    if (lum > FLOOR) {
      // Normalised, gently gamma-lifted falloff with hard floor.
      const t = (lum - FLOOR) / (255 - FLOOR);
      alpha = Math.min(255, Math.round(Math.pow(t, 0.85) * 255 * gain));
    }
    px[i] = 255;
    px[i + 1] = 255;
    px[i + 2] = 255;
    px[i + 3] = alpha;
  }

  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, quality: 85, effort: 9 })
    .toFile(dst);

  const kb = (fs.statSync(dst).size / 1024).toFixed(0);
  console.log(`✓ ${out} — ${info.width}x${info.height}, ${kb} KB`);
}

for (const plate of PLATES) {
  await keyPlate(plate);
}
console.log("Smoke keying complete.");
