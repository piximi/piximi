// Writing screenshots: capture as lossless PNG, then convert to WEBP to match
// the docs' existing image format.

import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { WEBP_QUALITY } from "../config.ts";
import { area } from "./locators.ts";

import type { Locator, Page } from "playwright";

const execFileAsync = promisify(execFile);

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

// Uses `sharp` if installed, else the `cwebp` CLI (brew install webp), else
// leaves the PNG in place with a warning.
async function toWebp(pngPath: string) {
  const webpPath = pngPath.replace(/\.png$/, ".webp");
  try {
    const sharpModule: string = "sharp"; // variable keeps tsc from requiring it
    const { default: sharp } = await import(sharpModule);
    await sharp(pngPath)
      .webp({ quality: WEBP_QUALITY, smartSubsample: true })
      .toFile(webpPath);
    fs.unlinkSync(pngPath);
    return webpPath;
  } catch {
    // fall through
  }
  try {
    await execFileAsync("cwebp", [
      "-q",
      String(WEBP_QUALITY),
      "-sharp_yuv",
      pngPath,
      "-o",
      webpPath,
    ]);
    fs.unlinkSync(pngPath);
    return webpPath;
  } catch {
    console.warn(
      `  ! could not convert to webp (no sharp, no cwebp on PATH) - left as ${pngPath}`,
    );
    console.warn(
      `    install the CLI with: brew install webp   (or: pnpm add -D sharp)`,
    );
    return pngPath;
  }
}

async function finish(outPngPath: string) {
  const finalPath = await toWebp(outPngPath);
  console.log(`  saved ${finalPath}`);
}

// MUI tooltips open on hover *and* focus, so a stray one can end up in a shot
// (e.g. "Select all" after a toolbar click). Hide them for every capture; the
// docs never want them. Idempotent.
async function hideTooltips(page: Page) {
  await page.evaluate(() => {
    if (document.getElementById("__docs_hide_tooltips__")) return;
    (document.activeElement as HTMLElement | null)?.blur();
    const style = document.createElement("style");
    style.id = "__docs_hide_tooltips__";
    style.textContent = ".MuiTooltip-popper{visibility:hidden!important}";
    document.head.appendChild(style);
  });
}

export async function shootFullPage(page: Page, outPngPath: string) {
  await hideTooltips(page);
  ensureDir(path.dirname(outPngPath));
  await page.screenshot({ path: outPngPath });
  await finish(outPngPath);
}

// Screenshot the element whose computed CSS grid-area is `areaName`.
export async function shootGridArea(
  page: Page,
  areaName: string,
  outPngPath: string,
) {
  const handle = await page.evaluateHandle((name) => {
    for (const el of document.querySelectorAll("body *")) {
      if (getComputedStyle(el).gridArea.replace(/\s/g, "") === name) return el;
    }
    return null;
  }, areaName);
  const el = handle.asElement();
  if (!el) {
    console.warn(
      `  ! grid-area "${areaName}" not found - skipping ${outPngPath}`,
    );
    return;
  }
  await hideTooltips(page);
  ensureDir(path.dirname(outPngPath));
  await el.screenshot({ path: outPngPath });
  await finish(outPngPath);
}

// Screenshot a tagged region (see markGridArea/markSelector), extended
// downward by `padBottom` px (room for badges placed below small toolbars).
export async function shootRegion(
  page: Page,
  areaName: string,
  padBottom: number,
  outPngPath: string,
) {
  const box = await area(page, areaName).first().boundingBox();
  if (!box) {
    console.warn(`  ! region "${areaName}" not found - skipping ${outPngPath}`);
    return;
  }
  const vp = page.viewportSize()!;
  const clip = {
    x: Math.max(0, box.x),
    y: Math.max(0, box.y),
    width: Math.min(box.width, vp.width - Math.max(0, box.x)),
    height: Math.min(box.height + padBottom, vp.height - Math.max(0, box.y)),
  };
  await hideTooltips(page);
  ensureDir(path.dirname(outPngPath));
  await page.screenshot({ path: outPngPath, clip });
  await finish(outPngPath);
}

// Like shootRegion, but with room on every side (for badges that sit outside a
// narrow element, e.g. the side toolbar). `target` is any locator.
export async function shootPadded(
  page: Page,
  target: Locator,
  pad: { l?: number; t?: number; r?: number; b?: number },
  outPngPath: string,
) {
  let box = null;
  try {
    await target.first().waitFor({ state: "visible", timeout: 3000 });
    box = await target.first().boundingBox();
  } catch {
    // handled below
  }
  if (!box) {
    console.warn(`  ! region not found - skipping ${outPngPath}`);
    return;
  }
  const vp = page.viewportSize()!;
  const x = Math.max(0, box.x - (pad.l ?? 0));
  const y = Math.max(0, box.y - (pad.t ?? 0));
  const right = Math.min(vp.width, box.x + box.width + (pad.r ?? 0));
  const bottom = Math.min(vp.height, box.y + box.height + (pad.b ?? 0));
  await hideTooltips(page);
  ensureDir(path.dirname(outPngPath));
  await page.screenshot({
    path: outPngPath,
    clip: { x, y, width: right - x, height: bottom - y },
  });
  await finish(outPngPath);
}

// One crop around several locators (the smallest box that holds them all),
// for sections whose header is a sibling of the body in the DOM.
export async function shootUnion(
  page: Page,
  targets: Locator[],
  pad: { l?: number; t?: number; r?: number; b?: number },
  outPngPath: string,
) {
  const boxes = [];
  for (const target of targets) {
    try {
      await target.first().waitFor({ state: "visible", timeout: 3000 });
      const box = await target.first().boundingBox();
      if (box) boxes.push(box);
    } catch {
      // handled below
    }
  }
  if (boxes.length !== targets.length) {
    console.warn(`  ! region not found - skipping ${outPngPath}`);
    return;
  }
  const vp = page.viewportSize()!;
  const x = Math.max(0, Math.min(...boxes.map((b) => b.x)) - (pad.l ?? 0));
  const y = Math.max(0, Math.min(...boxes.map((b) => b.y)) - (pad.t ?? 0));
  const right = Math.min(
    vp.width,
    Math.max(...boxes.map((b) => b.x + b.width)) + (pad.r ?? 0),
  );
  const bottom = Math.min(
    vp.height,
    Math.max(...boxes.map((b) => b.y + b.height)) + (pad.b ?? 0),
  );
  await hideTooltips(page);
  ensureDir(path.dirname(outPngPath));
  await page.screenshot({
    path: outPngPath,
    clip: { x, y, width: right - x, height: bottom - y },
  });
  await finish(outPngPath);
}

// --- Icon crops ------------------------------------------------------------
// Backgrounds are made transparent for the capture, so one image works on any
// page background; the icon colour still follows the theme, hence separate
// dark and light variants.
const TRANSPARENT_CSS =
  "html,body,*{background:transparent!important;box-shadow:none!important}";

export async function setTransparentBackgrounds(page: Page, on: boolean) {
  await page.evaluate(
    ({ on, css }) => {
      document.getElementById("__docs_transparent__")?.remove();
      if (!on) return;
      const style = document.createElement("style");
      style.id = "__docs_transparent__";
      style.textContent = css;
      document.head.appendChild(style);
    },
    { on, css: TRANSPARENT_CSS },
  );
}

export async function shootIcon(
  page: Page,
  target: Locator,
  outPngPath: string,
) {
  const loc = target.first();
  let box = null;
  try {
    await loc.waitFor({ state: "visible", timeout: 3000 });
    box = await loc.boundingBox();
  } catch {
    // handled below
  }
  if (!box) {
    console.warn(`  ! icon not found - skipping ${outPngPath}`);
    return;
  }
  const pad = 2;
  const clip = {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  };
  ensureDir(path.dirname(outPngPath));
  await page.screenshot({ path: outPngPath, clip, omitBackground: true });
  await finish(outPngPath);
}

// --- Popovers --------------------------------------------------------------
// MUI poppers render in a portal as a direct child of <body>. To capture just
// the popover (with clean rounded corners), hide everything else, make the page
// background transparent and screenshot the popper itself.
const POPOVER_SELECTOR = "#transition-popper";
const ISOLATE_POPOVER_CSS = `html,body{background:transparent!important}
body>*:not(${POPOVER_SELECTOR}){visibility:hidden!important}`;

export async function shootPopover(page: Page, outPngPath: string) {
  const popper = page.locator(POPOVER_SELECTOR);
  try {
    await popper.waitFor({ state: "visible", timeout: 3000 });
  } catch {
    console.warn(`  ! popover not open - skipping ${outPngPath}`);
    return;
  }
  // Keep the pointer off the popover so no menu item shows a hover highlight.
  await page.mouse.move(2, 2);
  await page.waitForTimeout(500); // let the fade-in finish
  await page.evaluate((css) => {
    document.getElementById("__docs_isolate__")?.remove();
    const style = document.createElement("style");
    style.id = "__docs_isolate__";
    style.textContent = css;
    document.head.appendChild(style);
  }, ISOLATE_POPOVER_CSS);
  ensureDir(path.dirname(outPngPath));
  await popper.screenshot({ path: outPngPath, omitBackground: true });
  await page.evaluate(() =>
    document.getElementById("__docs_isolate__")?.remove(),
  );
  await finish(outPngPath);
}
