// Animated clips: the replacement for the old screen-recorded GIFs.
//
// A clip is a run of screenshots of one region of the page, taken back to back
// while a script drives the mouse, joined into a single looping animated WEBP.
// Playwright never paints the pointer into a screenshot, so a stand-in cursor
// (a small arrow that follows the real mouse and ripples on a click) is injected
// into the page for the length of the recording.
//
// Frames identical to the one before are merged into it (the pauses in a clip
// cost nothing), and each frame's display time is the time it was on screen.

import fs from "node:fs";
import path from "node:path";

import { CLIP_FPS, CLIP_QUALITY, CLIP_SCALE } from "../config.ts";
import { ensureDir, hideTooltips } from "./output.ts";

import type { Locator, Page } from "playwright";

export type Pt = { x: number; y: number };
export type Region = { x: number; y: number; width: number; height: number };

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// --- Pointer ---------------------------------------------------------------
// Everything that moves the mouse goes through here so the position is known
// (a glide starts from where the pointer really is).

let pointer: Pt = { x: 0, y: 0 };

export const pointerAt = (): Pt => ({ ...pointer });
export const setPointer = (p: Pt) => {
  pointer = { ...p };
};

// Teleport (no animation).
export async function jump(page: Page, to: Pt) {
  await page.mouse.move(to.x, to.y);
  pointer = { ...to };
}

const ease = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

async function moveOver(page: Page, to: Pt, ms: number, eased: boolean) {
  const from = pointer;
  const t0 = performance.now();
  for (;;) {
    const t = Math.min(1, (performance.now() - t0) / ms);
    const e = eased ? ease(t) : t;
    await page.mouse.move(
      from.x + (to.x - from.x) * e,
      from.y + (to.y - from.y) * e,
    );
    if (t >= 1) break;
    await sleep(8);
  }
  pointer = { ...to };
}

// Move like a hand would: slow at both ends. Duration follows the distance
// unless given.
export async function glide(page: Page, to: Pt, ms?: number) {
  const dist = Math.hypot(to.x - pointer.x, to.y - pointer.y);
  if (dist < 0.5) return;
  await moveOver(
    page,
    to,
    ms ?? Math.min(900, Math.max(200, dist * 1.4)),
    true,
  );
}

// Follow a path at a steady speed (px per ms), for strokes the app is
// sampling as the mouse moves.
export async function trace(page: Page, pts: Pt[], speed = 0.3) {
  for (const p of pts) {
    const dist = Math.hypot(p.x - pointer.x, p.y - pointer.y);
    if (dist < 0.5) continue;
    await moveOver(page, p, Math.max(30, dist / speed), false);
  }
}

export async function press(page: Page, hold = 80) {
  await page.mouse.down();
  await sleep(hold);
  await page.mouse.up();
}

export async function clickAt(page: Page, to: Pt, ms?: number) {
  await glide(page, to, ms);
  await sleep(120);
  await press(page);
  await sleep(180);
}

export const centre = (b: Region): Pt => ({
  x: b.x + b.width / 2,
  y: b.y + b.height / 2,
});

export async function clickLocator(page: Page, loc: Locator, ms?: number) {
  const box = await loc.first().boundingBox();
  if (!box) throw new Error("clickLocator: element not visible");
  await clickAt(page, centre(box), ms);
}

// Press, follow `pts` at `speed`, release. The pointer glides to the first
// point before pressing.
export async function dragPath(page: Page, pts: Pt[], speed = 0.3) {
  await glide(page, pts[0]);
  await sleep(150);
  await page.mouse.down();
  await sleep(100);
  await trace(page, pts.slice(1), speed);
  await sleep(150);
  await page.mouse.up();
  await sleep(200);
}

// --- Stand-in cursor -------------------------------------------------------

const CURSOR_ID = "__docs_cursor__";

async function showCursor(page: Page) {
  await page.evaluate((id) => {
    document.getElementById(id)?.remove();
    const el = document.createElement("div");
    el.id = id;
    el.style.cssText =
      "position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;" +
      "pointer-events:none;opacity:0;will-change:transform";
    el.innerHTML =
      '<svg width="22" height="26" viewBox="0 0 22 26" ' +
      'style="position:absolute;left:0;top:0;overflow:visible;' +
      'filter:drop-shadow(0 1px 2px rgba(0,0,0,.55))">' +
      '<path d="M2 2 L2 19 L6.5 15 L9.6 22.5 L12.6 21.2 L9.5 13.8 L15.5 13.8 Z" ' +
      'fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>' +
      '<div class="ring" style="position:absolute;left:-15px;top:-15px;' +
      "width:30px;height:30px;border-radius:50%;border:3px solid #02aec5;" +
      'opacity:0;box-sizing:border-box"></div>';
    document.body.appendChild(el);
    const ring = el.querySelector(".ring") as HTMLElement;
    const onMove = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      el.style.opacity = "1";
    };
    const onDown = (e: MouseEvent) => {
      onMove(e);
      ring.animate(
        [
          { opacity: 1, transform: "scale(.35)" },
          { opacity: 0, transform: "scale(1.25)" },
        ],
        { duration: 450, easing: "ease-out" },
      );
    };
    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("mousedown", onDown, true);
    (el as unknown as { __off: () => void }).__off = () => {
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("mousedown", onDown, true);
    };
  }, CURSOR_ID);
}

async function hideCursor(page: Page) {
  await page
    .evaluate((id) => {
      const el = document.getElementById(id);
      (el as unknown as { __off?: () => void } | null)?.__off?.();
      el?.remove();
    }, CURSOR_ID)
    .catch(() => {});
}

// --- Recording -------------------------------------------------------------

type Frame = { t: number; png: Buffer };

// How long the last frame stays up before the loop restarts, so the finished
// result can be read.
const HOLD_END_MS = 1800;
const MIN_DELAY_MS = 20;

// Screenshot `region` repeatedly while `action` runs, then write
// `<outPngPath without .png>.webp`. Returns the written path.
export async function recordClip(
  page: Page,
  region: Region,
  outPngPath: string,
  action: () => Promise<void>,
): Promise<string> {
  const clip = {
    x: Math.floor(region.x),
    y: Math.floor(region.y),
    width: Math.floor(region.width),
    height: Math.floor(region.height),
  };
  const webpPath = outPngPath.replace(/\.png$/, ".webp");
  const gap = 1000 / CLIP_FPS;

  await hideTooltips(page);
  await showCursor(page);
  // Show the cursor where it already is, so it does not appear from nowhere.
  await page.mouse.move(pointer.x, pointer.y);

  const frames: Frame[] = [];
  let recording = true;
  const grabbing = (async () => {
    while (recording) {
      const t = performance.now();
      const png = await page.screenshot({
        clip,
        type: "png",
        scale: CLIP_SCALE === 2 ? "device" : "css",
      });
      frames.push({ t, png });
      const spent = performance.now() - t;
      if (spent < gap) await sleep(gap - spent);
    }
  })();

  let endT = 0;
  try {
    await sleep(250); // a beat on the starting state
    await action();
    await sleep(350);
    endT = performance.now();
  } finally {
    recording = false;
    await grabbing.catch(() => {});
    await hideCursor(page);
  }

  await writeAnimatedWebp(frames, endT, webpPath);
  return webpPath;
}

async function writeAnimatedWebp(frames: Frame[], endT: number, out: string) {
  if (frames.length === 0) throw new Error("clip: no frames were captured");

  // Merge runs of identical frames; each kept frame lasts until the next one.
  const kept: { png: Buffer; from: number; to: number }[] = [];
  frames.forEach((f, i) => {
    const to = i + 1 < frames.length ? frames[i + 1].t : endT || f.t + 100;
    const last = kept[kept.length - 1];
    if (last && last.png.equals(f.png)) last.to = to;
    else kept.push({ png: f.png, from: f.t, to });
  });
  const delays = kept.map((k) =>
    Math.min(65535, Math.max(MIN_DELAY_MS, Math.round(k.to - k.from))),
  );
  delays[delays.length - 1] += HOLD_END_MS;

  let sharp;
  try {
    const sharpModule: string = "sharp"; // variable keeps tsc from requiring it
    ({ default: sharp } = await import(sharpModule));
  } catch {
    throw new Error(
      "Animated clips need `sharp` (pnpm add -D sharp); it was not found.",
    );
  }

  const decoded = await Promise.all(
    kept.map((k) =>
      sharp(k.png).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    ),
  );
  type Decoded = { data: Buffer; info: { width: number; height: number } };
  const { width, height } = (decoded[0] as Decoded).info;
  if (
    (decoded as Decoded[]).some(
      (d) => d.info.width !== width || d.info.height !== height,
    )
  ) {
    throw new Error("clip: frames differ in size");
  }

  ensureDir(path.dirname(out));
  await sharp(Buffer.concat((decoded as Decoded[]).map((d) => d.data)), {
    raw: {
      width,
      height: height * decoded.length,
      channels: 4,
      pageHeight: height,
    },
  })
    .webp({
      quality: CLIP_QUALITY,
      effort: 4,
      smartSubsample: true,
      loop: 0,
      delay: delays,
    })
    .toFile(out);

  const kb = Math.round(fs.statSync(out).size / 1024);
  const secs = (delays.reduce((a, b) => a + b, 0) / 1000).toFixed(1);
  console.log(
    `  saved ${out} (${frames.length} shots -> ${kept.length} frames, ${secs}s, ${kb} KB)`,
  );
}
