// Copies Figma SVGs and converts Figma rasters into right-sized WebP under public/.
// Sources are the files downloaded from Figma into docs/design/assets (see docs/figma-map.md). That folder is
// kept locally and not published; its output in public/ is committed.
// Run: node scripts/assets/build-public-assets.mjs
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "docs/design/assets";
const OUT = "public";

// [source, destination] — SVGs kept byte-for-byte as exported.
const svgs = [
  ["header/caret-down.svg", "icons/caret-down-nav.svg"],
  ["header/caret-down-active.svg", "icons/caret-down-nav-active.svg"],
  ["header/arrow-right-blue.svg", "icons/arrow-right-dark.svg"],
  ["mega-menu/arrow-right.svg", "icons/arrow-right-brand.svg"],
  ["footer/arrow-right-white.svg", "icons/arrow-right-white.svg"],
  ["mega-menu/seal-check.svg", "icons/seal-check.svg"],
  ["mega-menu/seal-check-active.svg", "icons/seal-check-active.svg"],
  ["mega-menu/pointer-triangle.svg", "icons/menu-pointer.svg"],
  ["lead-form/caret-down.svg", "icons/caret-down-field.svg"],
  ["lead-form/check-badge.svg", "icons/check-badge.svg"],
  ["lead-form/field-tab-vector.svg", "images/field-fold.svg"],
  ["lead-form/stars-g2.svg", "images/stars-g2.svg"],
  ["lead-form/stars-trustpilot.svg", "images/stars-trustpilot.svg"],
  ["lead-form/divider.svg", "images/divider-form.svg"],
  ["footer/divider.svg", "images/divider-footer.svg"],
  ["footer/ellipse-glow.svg", "images/footer-glow.svg"],
  ["lead-form/klearstack-monogram.svg", "images/klearstack-monogram.svg"],
];

// Rasters → WebP at 2× their rendered CSS size (for high-DPI screens).
// `extract` crops sprite sheets to the region the design actually shows.
const rasters = [
  { src: "lead-form/landmark-group.png", out: "images/logos/landmark-group.webp", height: 56 },
  { src: "lead-form/network-international.png", out: "images/logos/network-international.webp", height: 35 },
  { src: "lead-form/elevation-10k.png", out: "images/logos/elevation-10k.webp", height: 56 },
  { src: "lead-form/konica-minolta.png", out: "images/logos/konica-minolta.webp", height: 92 },
  // G2: design shows the centre square of a 2:1 image (width 200%, left -50%).
  { src: "lead-form/g2-logo-source.png", out: "images/badge-g2.webp", height: 72, extract: { left: 256, top: 0, width: 512, height: 512 } },
  // Trustpilot: design shows the first green star tile of the logo sprite (width 560%, top -157.89%).
  { src: "lead-form/trustpilot-source.png", out: "images/badge-trustpilot.webp", height: 72, extract: { left: 5, top: 705, width: 446, height: 446 } },
  { src: "header/arrow-forward-white.png", out: "icons/arrow-forward-white.webp", height: 32 },
  { src: "footer/instagram.png", out: "icons/instagram.webp", height: 36 },
  { src: "footer/mail.png", out: "icons/mail.webp", height: 36 },
  { src: "footer/whatsapp.png", out: "icons/whatsapp.webp", height: 36 },
  { src: "footer/call.png", out: "icons/call.webp", height: 36 },
];

async function ensureDir(file) {
  await mkdir(path.dirname(file), { recursive: true });
}

for (const [from, to] of svgs) {
  const dest = path.join(OUT, to);
  await ensureDir(dest);
  await copyFile(path.join(SRC, from), dest);
}

for (const { src, out, height, extract } of rasters) {
  const dest = path.join(OUT, out);
  await ensureDir(dest);
  let image = sharp(path.join(SRC, src));
  if (extract) image = image.extract(extract);
  const info = await image.resize({ height, withoutEnlargement: true }).webp({ quality: 90, alphaQuality: 100 }).toFile(dest);
  console.log(`${out}  ${info.width}×${info.height}  ${info.size} B`);
}
console.log(`copied ${svgs.length} SVGs`);
