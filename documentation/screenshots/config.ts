// Shared settings for the docs screenshot tool. Everything tweakable lives
// here (or in an env var) so the rest of the code stays free of magic values.

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

// Dev server to drive.
export const BASE_URL = process.env.PIXIMI_URL || "http://localhost:3000";

// Where images are written: the docs repo's img/ folder. Defaults to a sibling
// checkout named piximi-documentation next to this repo.
export const OUT_DIR =
  process.env.DOCS_IMG_DIR ||
  path.resolve(
    SCRIPT_DIR,
    "../../../piximi-documentation/documentation/piximi-documentation/img",
  );

// A saved project used by tutorial pages / `--project`.
export const DEFAULT_PROJECT_FILE = path.join(
  SCRIPT_DIR,
  "Piximi_Translocation_Tutorial-Docs.zip",
);

// Layout size. The app is laid out at this size; SCALE only raises the pixel
// density of the output (2 => a full page is 2400x1400) so text and icons stay
// crisp when the docs scale images or on retina displays.
export const VIEWPORT = { width: 1200, height: 700 };
export const SCALE = Number(process.env.DOCS_IMG_SCALE) || 2;

// WEBP quality (1-100). Chroma subsampling, which smears coloured text and thin
// icon strokes, is switched off in lib/output.ts.
export const WEBP_QUALITY = Number(process.env.DOCS_WEBP_QUALITY) || 92;

// Numbered callout badges. NO_ANNOTATE=1 captures clean screenshots instead.
export const ANNOTATE = !process.env.NO_ANNOTATE;
export const BADGE = { size: 25, margin: 4 };

// Badge/cover colours, picked by callout number (n - 1, cycling).
export const COLORS = ["#02aec5", "#BC96E6", "#4F518C", "#D84727", "#748E54"];
