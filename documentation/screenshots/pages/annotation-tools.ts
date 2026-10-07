// Annotation Tools (pages/detail/imageviewer-tools-annotation.md): one short
// animated clip per tool, plus the three ways of combining a new shape with an
// existing annotation. They replace the old screen-recorded GIFs.
//
// Each clip is the canvas plus the tool strip, recorded while a scripted
// pointer draws on one nucleus of the Translocation Tutorial's first image.
// `lib/clip.ts` explains how clips are made.
//
// How the clips find their way around the image
//   The image is not annotated and Piximi shows no coordinates of its own, so
//   targets are chosen once, on the image fitted to the canvas, as offsets from
//   its centre (measured on a screenshot of the Image Viewer). `setup` turns
//   them into image-pixel positions using the x/y read-out of the Image Info
//   Strip, then zooms in. Every clip re-reads the read-out to learn where the
//   image currently is, so the clips stay correct if the canvas moves.
//
// Every clip starts from a canvas with no annotations (it deletes them all
// first) and a kind to put new ones in, created by `setup`.

import {
  area,
  docId,
  help,
  iconButton,
  markGridArea,
} from "../lib/locators.ts";
import {
  centre,
  clickAt,
  clickLocator,
  dragPath,
  glide,
  jump,
  recordClip,
  setPointer,
  sleep,
  trace,
} from "../lib/clip.ts";
import { enterImageViewer } from "./image-viewer.ts";

import type { Locator, Page } from "playwright";

import type { Pt, Region } from "../lib/clip.ts";
import type { DocPage, ShotContext } from "../lib/types.ts";

// --- Targets ---------------------------------------------------------------

// Wheel steps used to zoom in. Each step is x1.035 (ZOOM_SPEED in the app), so
// 36 steps is about 3.5x. Offsets below must keep nuclei well inside the canvas
// at that zoom (|dx| <= ~95, -60 <= dy <= ~35 in fit-screen px).
const ZOOM_STEPS = 36;

type Nucleus = { dx: number; dy: number; w: number; h: number };

// Offsets (CSS px) of nuclei from the image centre with the image fitted to the
// canvas, and their size there, taken from a screenshot of that view.
const NUCLEI = {
  rectangle: { dx: -71, dy: 8, w: 12, h: 16 },
  ellipse: { dx: 86, dy: -17, w: 17, h: 14 },
  polygon: { dx: -33, dy: -35, w: 15, h: 15 },
  pen: { dx: -79, dy: -43, w: 14, h: 18 },
  lasso: { dx: 63, dy: 31, w: 17, h: 12 },
  magnetic: { dx: 2, dy: 21, w: 18, h: 12 },
  color: { dx: 75, dy: -43, w: 9, h: 18 },
  quick: { dx: 86, dy: -27, w: 17, h: 14 },
  threshold: { dx: -2, dy: 21, w: 28, h: 12 },
  operations: { dx: -33, dy: -35, w: 15, h: 15 },
} satisfies Record<string, Nucleus>;
type Key = keyof typeof NUCLEI;

// --- Reading where the image is -------------------------------------------

// Linear map from image pixels to screen px: screen = o + image * s.
type View = { o: Pt; s: number };

const infoStrip = (p: Page) => docId(p, "image-info-strip");

// Hover a screen point and read the image pixel under it from the info strip.
async function readImagePoint(page: Page, at: Pt): Promise<Pt> {
  await jump(page, at);
  await page.waitForTimeout(200);
  const text = await infoStrip(page).innerText();
  const m = text.match(/x:\s*(-?\d+)\s*,\s*y:\s*(-?\d+)/);
  if (!m) throw new Error(`Could not read the image position from: "${text}"`);
  return { x: Number(m[1]), y: Number(m[2]) };
}

async function calibrate(page: Page, stage: Region): Promise<View> {
  const p1 = {
    x: stage.x + stage.width * 0.4,
    y: stage.y + stage.height * 0.4,
  };
  const p2 = {
    x: stage.x + stage.width * 0.6,
    y: stage.y + stage.height * 0.6,
  };
  const i1 = await readImagePoint(page, p1);
  const i2 = await readImagePoint(page, p2);
  const s = (p2.x - p1.x + (p2.y - p1.y)) / (i2.x - i1.x + (i2.y - i1.y));
  if (!(s > 0)) throw new Error("Could not work out the image scale");
  return { o: { x: p1.x - i1.x * s, y: p1.y - i1.y * s }, s };
}

// Image-pixel position of each target, and the scale at fit (see setup).
const imagePos = new Map<Key, Pt>();
let fitScale = 0;

// --- Page helpers ----------------------------------------------------------

async function tagAreas(page: Page) {
  await markGridArea(page, "stage");
  await markGridArea(page, "side-tools");
}

const TOOL_HELP = {
  rectangle: "rectangle-tool",
  ellipse: "ellipse-tool",
  polygon: "polygon-tool",
  pen: "pen-tool",
  lasso: "lasso-tool",
  magnetic: "magnetic-tool",
  color: "color-tool",
  quick: "quick-annotation-tool",
  threshold: "threshold-tool",
} as const;
type Tool = keyof typeof TOOL_HELP | "selection";

const toolButton = (page: Page, tool: Tool): Locator =>
  tool === "selection"
    ? docId(page, "utility-tools").locator("button").nth(0)
    : help(page, TOOL_HELP[tool]);

// Buttons of the floating bar under a pending shape, left to right.
const BAR = { confirm: 0, combine: 2, subtract: 3, intersect: 4 } as const;
const barButton = (page: Page, i: number) =>
  help(page, "object-manipulation-tools").locator("button").nth(i);

// Click without the show: used for the parts of a clip that are not recorded.
async function quickClick(page: Page, loc: Locator) {
  const box = await loc.first().boundingBox();
  if (!box) throw new Error("quickClick: element not visible");
  const c = centre(box);
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.mouse.up();
  setPointer(c);
}

// Pick a tool and give it the time it needs to get ready (the magnetic and
// quick tools analyse the image when they are chosen).
const READY_MS: Partial<Record<Tool, number>> = {
  magnetic: 2500,
  quick: 3500,
};
async function selectTool(page: Page, tool: Tool) {
  await quickClick(page, toolButton(page, tool));
  await page.waitForTimeout(READY_MS[tool] ?? 500);
}

// Choose a tool from a clean slate. A tool's size slider only starts again at
// its default when the tool is chosen after another one, so tools that have a
// slider go through the rectangle tool first (otherwise a second clip would find
// the slider where the first one left it).
async function selectToolFresh(page: Page, tool: Tool) {
  if (tool !== "rectangle") await selectTool(page, "rectangle");
  await selectTool(page, tool);
}

// Delete every annotation on the image, through the Annotations drawer.
async function clearAnnotations(page: Page) {
  await page.keyboard.press("Escape"); // drop anything pending
  await iconButton(page, "FormatShapesIcon").click();
  await page.waitForTimeout(300);
  await docId(page, "selection-footer")
    .getByRole("button", { name: /delete/i })
    .click();
  const item = page.getByRole("menuitem", { name: /^Whole image/ });
  await item.waitFor({ state: "visible", timeout: 5000 });
  if (await item.isDisabled()) {
    await page.keyboard.press("Escape"); // nothing to delete
    await page.waitForTimeout(300);
    return;
  }
  await item.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await dialog.waitFor({ state: "hidden", timeout: 5000 });
  await page.waitForTimeout(400);
}

// Create the kind new annotations go into (the confirm bar refuses the
// built-in Unknown kind). Creating it also selects it.
async function createKind(page: Page) {
  await iconButton(page, "FormatShapesIcon").click();
  await page.getByText("Add Kind", { exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByTestId("taxonomy-name-input")
    .locator("input")
    .fill("Nucleus");
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await dialog.waitFor({ state: "hidden", timeout: 5000 });
  await page.waitForTimeout(400);
}

// --- Setup -----------------------------------------------------------------

async function setup(page: Page) {
  await enterImageViewer(page);
  await createKind(page);
  await tagAreas(page);

  // Work out where each target is, with the image fitted to the canvas.
  await iconButton(page, "FitScreenIcon").click();
  await page.waitForTimeout(500);
  const stage = await area(page, "stage").boundingBox();
  if (!stage) throw new Error("stage not found");
  const fit = await calibrate(page, stage);
  fitScale = fit.s;
  const c = centre(stage);
  for (const [key, n] of Object.entries(NUCLEI) as [Key, Nucleus][]) {
    imagePos.set(key, {
      x: (c.x + n.dx - fit.o.x) / fit.s,
      y: (c.y + n.dy - fit.o.y) / fit.s,
    });
  }

  // Zoom in around the image centre (the app's default zoom behaviour).
  await jump(page, c);
  for (let i = 0; i < ZOOM_STEPS; i++) {
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(15);
  }
  await page.waitForTimeout(500);
}

// --- Per-clip view ---------------------------------------------------------

// `scale` is screen px per image pixel, to size things given in image pixels.
type Spot = { c: Pt; rx: number; ry: number; scale: number };
type ClipView = { region: Region; at: (key: Key) => Spot };

// Re-read where the image is now, and work out the clip region (canvas plus
// tool strip).
async function viewForClip(page: Page): Promise<ClipView> {
  await tagAreas(page);
  const stage = await area(page, "stage").boundingBox();
  const tools = await area(page, "side-tools").boundingBox();
  if (!stage || !tools) throw new Error("stage or tools not found");
  const v = await calibrate(page, stage);
  const zoom = v.s / fitScale;
  if (zoom < 2.5 || zoom > 5) {
    throw new Error(
      `Zoom is x${zoom.toFixed(1)}, expected about x3.5: the targets would be off`,
    );
  }
  return {
    region: {
      x: stage.x,
      y: stage.y,
      width: tools.x + tools.width - stage.x,
      height: stage.height,
    },
    at: (key) => {
      const img = imagePos.get(key)!;
      const n = NUCLEI[key];
      return {
        c: { x: v.o.x + img.x * v.s, y: v.o.y + img.y * v.s },
        rx: Math.max(16, (n.w * zoom) / 2),
        ry: Math.max(16, (n.h * zoom) / 2),
        scale: v.s,
      };
    },
  };
}

// --- Drawing (not recorded) ------------------------------------------------

const around = (s: Spot, k: number): [Pt, Pt] => [
  { x: s.c.x - s.rx * k, y: s.c.y - s.ry * k },
  { x: s.c.x + s.rx * k, y: s.c.y + s.ry * k },
];

// Draw a shape fast with `tool` and confirm it, so the clip starts with an
// annotation on the canvas.
async function annotateQuickly(page: Page, tool: Tool, a: Pt, b: Pt) {
  await selectTool(page, tool);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 12 });
  await page.mouse.up();
  setPointer(b);
  await page.waitForTimeout(300);
  await barButton(page, BAR.confirm).click();
  await page.waitForTimeout(500);
}

// --- What every clip ends with ---------------------------------------------

async function confirmShape(page: Page) {
  await sleep(600); // the bar has appeared; let it be seen
  await clickLocator(page, barButton(page, BAR.confirm));
  await sleep(900);
}

async function pickBarButton(page: Page, i: number) {
  await sleep(600);
  await clickLocator(page, barButton(page, i));
  await sleep(1100); // the result is previewed
}

// Run one clip: start clean, get ready, record `act`.
async function clip(
  ctx: ShotContext,
  name: string,
  prepare: (v: ClipView) => Promise<void>,
  act: (v: ClipView) => Promise<void>,
) {
  const { page, out } = ctx;
  await clearAnnotations(page);
  await tagAreas(page);
  const v = await viewForClip(page);
  await prepare(v);
  await recordClip(page, v.region, out(name), () => act(v));
}

// A single-tool clip: select the tool (unrecorded, pointer left on its button),
// then draw one shape and confirm it.
function toolClip(
  tool: Exclude<Tool, "selection">,
  key: Key,
  draw: (page: Page, s: Spot) => Promise<void>,
  setUp?: (page: Page) => Promise<void>,
) {
  return (ctx: ShotContext) =>
    clip(
      ctx,
      tool,
      async () => {
        if (setUp) await selectToolFresh(ctx.page, tool);
        else await selectTool(ctx.page, tool);
        await setUp?.(ctx.page);
      },
      async (v) => {
        await draw(ctx.page, v.at(key));
        await confirmShape(ctx.page);
      },
    );
}

// --- Shapes ------------------------------------------------------------------

const ring = (s: Spot, k: number, n: number, from = -Math.PI / 2): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = from + (i / n) * Math.PI * 2;
    return {
      x: s.c.x + Math.cos(a) * s.rx * k,
      y: s.c.y + Math.sin(a) * s.ry * k,
    };
  });

const rectangle = (page: Page, s: Spot) => {
  const [a, b] = around(s, 1.4);
  return dragPath(page, [a, b], 0.25);
};

const ellipse = (page: Page, s: Spot) => {
  const [a, b] = around(s, 1.4);
  return dragPath(page, [a, b], 0.25);
};

// Click each corner of a rough pentagon, then the first corner again.
async function polygon(page: Page, s: Spot) {
  const corners = ring(s, 1.5, 5);
  for (const p of corners) await clickAt(page, p, 450);
}

// Make a tool's size smaller than its default by pressing the minus button of
// the slider that opens from the tool button (the slider is not dragged: the
// buttons set exact values). The panel is closed again afterwards.
//
// `settleMs` is for tools that redo work when the size changes: the quick tool
// recomputes its superpixels, throttled so that only the first value in a burst
// of changes is used. So the last step is pressed on its own, after the burst
// has been computed, to make sure the final size is the one that is applied.
async function shrinkSlider(
  page: Page,
  tool: "pen" | "quick",
  from: number,
  to: number,
  settleMs = 0,
) {
  await quickClick(page, toolButton(page, tool)); // opens the slider
  await page.waitForTimeout(600);
  const minus = area(page, "side-tools")
    .locator(".MuiSlider-vertical")
    .locator("xpath=..")
    .getByRole("button")
    .last();
  const last = settleMs ? to + 1 : to;
  for (let v = from; v > last; v--) {
    await minus.click();
    await page.waitForTimeout(80);
  }
  if (settleMs) {
    await page.waitForTimeout(settleMs);
    await minus.click();
    await page.waitForTimeout(settleMs);
  }
  await page.waitForTimeout(700); // let the value label fade
  await quickClick(page, toolButton(page, tool)); // closes it again
  await page.waitForTimeout(500);
}

// The pen's brush is made smaller than its default of 10 (the stroke would
// swamp a nucleus).
const PEN_SIZE = 4;
const shrinkPen = (page: Page) => shrinkSlider(page, "pen", 10, PEN_SIZE);

// The quick tool's region size (default 40) sets how big its predicted regions
// are; around the size of a nucleus lets a clip build one from a few of them.
const QUICK_SIZE = 14;
const shrinkQuick = (page: Page) =>
  shrinkSlider(page, "quick", 40, QUICK_SIZE, 4000);

// Fill the nucleus with back-and-forth strokes, rows a brush-width apart.
async function pen(page: Page, s: Spot) {
  const spacing = Math.max(8, PEN_SIZE * s.scale * 0.8);
  const top = s.c.y - s.ry * 0.85;
  const rows = Math.max(2, Math.ceil((s.ry * 1.7) / spacing) + 1);
  const left = s.c.x - s.rx * 0.8;
  const right = s.c.x + s.rx * 0.8;
  const pts: Pt[] = [];
  for (let i = 0; i < rows; i++) {
    const y = top + i * spacing;
    pts.push(i % 2 === 0 ? { x: left, y } : { x: right, y });
    pts.push(i % 2 === 0 ? { x: right, y } : { x: left, y });
  }
  await dragPath(page, pts, 0.15);
}

const lasso = (page: Page, s: Spot) => {
  const pts = ring(s, 1.35, 28);
  return dragPath(page, pts, 0.2);
};

// Click to start on the nucleus edge, follow the edge round (the path snaps to
// it between clicks), click to anchor each quarter, click the start to close.
async function magnetic(page: Page, s: Spot) {
  const pts = ring(s, 1.5, 48);
  await clickAt(page, pts[0], 500);
  for (let q = 1; q <= 4; q++) {
    const arc = pts.slice((q - 1) * 12 + 1, q * 12 + 1);
    await trace(page, arc, 0.12);
    if (q < 4) {
      await sleep(150);
      await clickAt(page, arc[arc.length - 1], 50);
    }
  }
  await sleep(250);
  await clickAt(page, pts[0], 150);
}

// Press in the middle and drag outwards: the further, the more is filled.
async function colorFill(page: Page, s: Spot) {
  await glide(page, s.c);
  await sleep(250);
  await page.mouse.down();
  await sleep(150);
  await trace(page, [{ x: s.c.x + s.rx * 0.2, y: s.c.y - s.ry * 1.6 }], 0.045);
  await sleep(700);
  await page.mouse.up();
  await sleep(250);
}

// Hover (the prediction follows the pointer), then press and drag across the
// nucleus so that the regions under the pointer are added together.
async function quick(page: Page, s: Spot) {
  await glide(page, { x: s.c.x - s.rx * 1.8, y: s.c.y - s.ry * 1.5 });
  await trace(page, [{ x: s.c.x - s.rx * 0.9, y: s.c.y }], 0.12);
  await sleep(900);
  await page.mouse.down();
  await sleep(150);
  await trace(
    page,
    [
      { x: s.c.x - s.rx * 0.3, y: s.c.y - s.ry * 0.2 },
      { x: s.c.x + s.rx * 0.3, y: s.c.y + s.ry * 0.2 },
      { x: s.c.x + s.rx * 0.9, y: s.c.y },
    ],
    0.05,
  );
  await sleep(300);
  await page.mouse.up();
  await sleep(500);
}

// --- Steps -----------------------------------------------------------------

// Combine / subtract / intersect: a rectangle is already on the canvas; draw an
// ellipse across its corner, choose what to do with the two, confirm.
const operation =
  (button: number, name: string) => async (ctx: ShotContext) => {
    const { page } = ctx;
    await clip(
      ctx,
      name,
      async (v) => {
        const s = v.at("operations");
        const [a, b] = around(s, 1.7);
        await annotateQuickly(page, "rectangle", a, b);
        await selectTool(page, "ellipse");
      },
      async (v) => {
        const s = v.at("operations");
        await dragPath(
          page,
          [
            { x: s.c.x + s.rx * 0.2, y: s.c.y - s.ry * 1.1 },
            { x: s.c.x + s.rx * 3, y: s.c.y + s.ry * 1.9 },
          ],
          0.25,
        );
        await pickBarButton(page, button);
        await confirmShape(page);
      },
    );
  };

// Selection: three annotations are on the canvas; click one, click another,
// then drag a box round all three.
async function selection(ctx: ShotContext) {
  const { page } = ctx;
  const keys: Key[] = ["rectangle", "polygon", "magnetic"];
  await clip(
    ctx,
    "selection",
    async (v) => {
      for (const k of keys) {
        const [a, b] = around(v.at(k), 1.4);
        await annotateQuickly(page, "rectangle", a, b);
      }
      await selectTool(page, "selection");
    },
    async (v) => {
      const spots = keys.map((k) => v.at(k));
      await clickAt(page, spots[0].c);
      await sleep(700);
      await clickAt(page, spots[1].c);
      await sleep(900);
      const xs = spots.flatMap((s) => [s.c.x - s.rx * 2.2, s.c.x + s.rx * 2.2]);
      const ys = spots.flatMap((s) => [s.c.y - s.ry * 2.2, s.c.y + s.ry * 2.2]);
      const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
      const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
      await dragPath(
        page,
        [
          { x: x0, y: y0 },
          { x: x1, y: y1 },
        ],
        0.35,
      );
      await sleep(1200);
    },
  );
}

// The threshold slider starts at its default (150) every time it opens, but the
// app remembers the last value it was given, so a second clip (the other theme)
// would start from where the first one left it. Pressing minus then plus sets
// the app's value to 150 and so makes the two agree again.
async function resetThreshold(page: Page) {
  await quickClick(page, toolButton(page, "threshold")); // opens the slider
  await page.waitForTimeout(600);
  const buttons = area(page, "side-tools")
    .locator(".MuiSlider-root")
    .locator("xpath=..")
    .getByRole("button");
  await buttons.first().click(); // minus
  await page.waitForTimeout(100);
  await buttons.last().click(); // plus
  await page.waitForTimeout(700);
  await quickClick(page, toolButton(page, "threshold")); // closes it again
  await page.waitForTimeout(500);
}

// Threshold: open the tool's slider (reset to its default of 150 beforehand),
// drag a box round the nucleus, lower the slider to THRESHOLD_VALUE and accept
// what is picked up there.
const THRESHOLD_VALUE = 34;
const THRESHOLD_MIN = 1;
const THRESHOLD_MAX = 255;
async function threshold(ctx: ShotContext) {
  const { page } = ctx;
  await clip(
    ctx,
    "threshold",
    async () => {
      await selectToolFresh(page, "threshold");
      await resetThreshold(page);
    },
    async (v) => {
      const s = v.at("threshold");
      await clickLocator(page, toolButton(page, "threshold")); // opens the slider
      await sleep(700);
      const [a, b] = around(s, 2.4);
      await dragPath(page, [a, b], 0.25);
      await sleep(800);
      const slider = area(page, "side-tools")
        .locator(".MuiSlider-root")
        .first();
      const thumb = slider.locator(".MuiSlider-thumb");
      const rail = await slider.boundingBox();
      const box = await thumb.boundingBox();
      if (!rail || !box) throw new Error("threshold slider not found");
      // Drag the thumb from the default (150) to THRESHOLD_VALUE.
      const from = centre(box);
      const to = {
        x:
          rail.x +
          ((THRESHOLD_VALUE - THRESHOLD_MIN) /
            (THRESHOLD_MAX - THRESHOLD_MIN)) *
            rail.width,
        y: from.y,
      };
      await dragPath(page, [from, to], 0.04);
      await sleep(400);
      // The drag lands within a point or two; the arrow keys step by exactly one.
      const input = thumb.locator("input");
      for (let i = 0; i < 20; i++) {
        const now = Number(await input.getAttribute("aria-valuenow"));
        if (now === THRESHOLD_VALUE) break;
        await input.press(now > THRESHOLD_VALUE ? "ArrowLeft" : "ArrowRight");
        await sleep(60);
      }
      await sleep(900);
      await confirmShape(page);
    },
  );
}

export const annotationTools: DocPage = {
  name: "annotation-tools",
  project: { kind: "example", name: "Translocation Tutorial" },
  setup,
  steps: [
    { name: "combine", run: operation(BAR.combine, "combine") },
    { name: "subtract", run: operation(BAR.subtract, "subtract") },
    { name: "intersect", run: operation(BAR.intersect, "intersect") },
    { name: "selection", run: selection },
    { name: "rectangle", run: toolClip("rectangle", "rectangle", rectangle) },
    { name: "ellipse", run: toolClip("ellipse", "ellipse", ellipse) },
    { name: "polygon", run: toolClip("polygon", "polygon", polygon) },
    { name: "pen", run: toolClip("pen", "pen", pen, shrinkPen) },
    { name: "lasso", run: toolClip("lasso", "lasso", lasso) },
    { name: "magnetic", run: toolClip("magnetic", "magnetic", magnetic) },
    { name: "color", run: toolClip("color", "color", colorFill) },
    { name: "quick", run: toolClip("quick", "quick", quick, shrinkQuick) },
    { name: "threshold", run: threshold },
  ],
};
