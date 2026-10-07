// Image Viewer (the annotator). Reached from the project view by selecting
// everything and pressing "Image Viewer". Needs a project that already has a
// kind with annotations (the tutorial project does), so the Annotations drawer
// and canvas have something to show and new shapes can be confirmed.

import {
  area,
  docId,
  help,
  iconButton,
  markGridArea,
  svgIcon,
} from "../lib/locators.ts";
import {
  setTransparentBackgrounds,
  shootFullPage,
  shootGridArea,
  shootIcon,
  shootPadded,
} from "../lib/output.ts";

import type { Locator, Page } from "playwright";

import type { CalloutSpec, DocPage, ShotContext } from "../lib/types.ts";

// --- Callouts --------------------------------------------------------------
// Badges sit just inside the top-left corner of narrow drawer sections so they
// stay within the clipped screenshot.
const IN = { at: "tl", dx: 12, dy: 4 } as const;

const OVERVIEW: CalloutSpec = [
  {
    n: 1,
    label: "Drawer tabs (Images | Annotations)",
    target: (p) => area(p, "drawer-action-selection"),
    at: "right",
    cover: true,
  },
  {
    n: 2,
    label: "Drawer",
    target: (p) => area(p, "action-drawer"),
    at: "center",
    cover: true,
  },
  {
    n: 3,
    label: "Zoom & position tools",
    target: (p) => help(p, "zoom-and-position"),
    at: "below",
    cover: true,
  },
  {
    n: 4,
    label: "Canvas",
    target: (p) => area(p, "stage"),
    at: "center",
    cover: true,
  },
  {
    n: 5,
    label: "Image info strip",
    target: (p) => docId(p, "image-info-strip"),
    at: "above",
    cover: true,
  },
  {
    n: 6,
    label: "Tools",
    target: (p) => area(p, "side-tools"),
    at: "left",
    cover: true,
  },
];

const IMAGES_DRAWER: CalloutSpec = [
  {
    n: 1,
    label: "Image list",
    target: (p) => docId(p, "image-list"),
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Channels",
    target: (p) => help(p, "channel-adjustment"),
    cover: true,
    ...IN,
  },
];

const ANNOTATIONS_DRAWER: CalloutSpec = [
  {
    n: 1,
    label: "Plane scope",
    target: (p) => docId(p, "plane-scope"),
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Filters",
    target: (p) => help(p, "annotation-filter-section"),
    cover: true,
    ...IN,
  },
  {
    n: 3,
    label: "Object features",
    target: (p) => help(p, "feature-filters"),
    cover: true,
    ...IN,
  },
  {
    n: 4,
    label: "Kinds & categories",
    target: (p) => help(p, "category-selection"),
    cover: true,
    ...IN,
  },
  {
    n: 5,
    label: "Selection actions (Delete / Categorize / Export)",
    target: (p) => docId(p, "selection-footer"),
    cover: true,
    ...IN,
  },
];

const TOOLS: CalloutSpec = [
  {
    n: 1,
    label: "Utility tools (Selection, Measure)",
    target: (p) => docId(p, "utility-tools"),
    at: "left",
    cover: true,
  },
  {
    n: 2,
    label: "Annotation creation tools",
    target: (p) => docId(p, "creation-tools"),
    at: "left",
    cover: true,
  },
];

// Buttons of the floating confirm bar, left to right.
const chromeButton = (p: Page, i: number) =>
  help(p, "object-manipulation-tools").locator("button").nth(i);
const CHROME: CalloutSpec = [
  { n: 1, label: "Confirm", target: (p) => chromeButton(p, 0), at: "above" },
  {
    n: 2,
    label: "Add as new annotation",
    target: (p) => chromeButton(p, 1),
    at: "above",
  },
  {
    n: 3,
    label: "Combine",
    target: (p) => chromeButton(p, 2),
    at: "above",
  },
  {
    n: 4,
    label: "Subtract",
    target: (p) => chromeButton(p, 3),
    at: "above",
  },
  {
    n: 5,
    label: "Intersection",
    target: (p) => chromeButton(p, 4),
    at: "above",
  },
  { n: 6, label: "Cancel", target: (p) => chromeButton(p, 5), at: "above" },
];

// --- State helpers ---------------------------------------------------------

// Somewhere with no tooltip trigger and no stage hover (so the info strip
// reads "n/a"): the empty right end of the top toolbar.
const park = (page: Page) => page.mouse.move(1150, 12);

async function tagAreas(page: Page) {
  for (const name of [
    "top-tools",
    "drawer-action-selection",
    "action-drawer",
    "stage",
    "side-tools",
  ]) {
    await markGridArea(page, name);
  }
}

async function showDrawer(page: Page, which: "images" | "annotations") {
  const icon = which === "images" ? "ImageOutlinedIcon" : "FormatShapesIcon";
  await iconButton(page, icon).click();
  await park(page);
  await page.waitForTimeout(400);
  await tagAreas(page);
}

// Drag out a rectangle on the canvas with the rectangle tool.
async function drawRectangle(
  page: Page,
  from: { dx: number; dy: number },
  to: { dx: number; dy: number },
) {
  await help(page, "rectangle-tool").click();
  await markGridArea(page, "stage");
  const box = await area(page, "stage").boundingBox();
  if (!box) throw new Error("stage not found");
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx + from.dx, cy + from.dy);
  await page.mouse.down();
  await page.mouse.move(cx + to.dx, cy + to.dy, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
}

const confirmBar = (p: Page) => help(p, "object-manipulation-tools");

// project view -> image viewer, with every image selected. The tutorial
// project already has annotated images, so nothing is drawn here.
export async function enterImageViewer(page: Page) {
  await page.getByTestId("select-all-button").click();
  await help(page, "navigate-to-imageviewer").click();
  await page.waitForURL(/\/imageviewer/, { timeout: 15000 });
  await page.waitForTimeout(2000); // image + channels load
}

// --- Steps -----------------------------------------------------------------

async function overview(ctx: ShotContext) {
  const { page, out } = ctx;
  await showDrawer(page, "images");
  await ctx.annotate("overview", OVERVIEW);
  await shootFullPage(page, out("annotated"));
  await ctx.clearAnnotations();
  await shootFullPage(page, out("clean"));
}

async function drawers(ctx: ShotContext) {
  const { page, out } = ctx;

  await showDrawer(page, "images");
  await ctx.annotate("images drawer", IMAGES_DRAWER);
  await shootGridArea(page, "action-drawer", out("images-drawer"));
  await ctx.clearAnnotations();

  await showDrawer(page, "annotations");
  await ctx.annotate("annotations drawer", ANNOTATIONS_DRAWER);
  await shootGridArea(page, "action-drawer", out("annotations-drawer"));
  await ctx.clearAnnotations();
}

async function tools(ctx: ShotContext) {
  const { page, out } = ctx;
  await showDrawer(page, "annotations");
  await ctx.annotate("tools", TOOLS);
  await shootPadded(
    page,
    area(page, "side-tools"),
    { l: 40, r: 4 },
    out("tools"),
  );
  await ctx.clearAnnotations();
}

// A freshly drawn shape with the floating confirm bar showing.
async function manipulation(ctx: ShotContext) {
  const { page, out } = ctx;
  await showDrawer(page, "annotations");
  await drawRectangle(page, { dx: 30, dy: 20 }, { dx: 130, dy: 110 });
  await park(page);
  await ctx.annotate("confirm bar", CHROME);
  await shootPadded(
    page,
    confirmBar(page),
    { t: 40, b: 8, l: 8, r: 8 },
    out("confirm-bar"),
  );
  await ctx.clearAnnotations();
  await chromeButton(page, 5).click(); // Cancel
  await page.waitForTimeout(300);
}

// Individual tool icons for inline use in the docs text.
async function icons({ page, icon }: ShotContext) {
  await showDrawer(page, "annotations");
  await park(page);
  const first = (l: Locator) => l.locator("svg").first();
  const tools: Array<[string, Locator]> = [
    [
      "tool-selection",
      first(docId(page, "utility-tools").locator("button").nth(0)),
    ],
    ["tool-measure", svgIcon(page, "StraightenIcon")],
    ["tool-rectangle", first(help(page, "rectangle-tool"))],
    ["tool-ellipse", first(help(page, "ellipse-tool"))],
    ["tool-polygon", first(help(page, "polygon-tool"))],
    ["tool-pen", first(help(page, "pen-tool"))],
    ["tool-lasso", first(help(page, "lasso-tool"))],
    ["tool-magnetic", first(help(page, "magnetic-tool"))],
    ["tool-color", first(help(page, "color-tool"))],
    ["tool-quick", first(help(page, "quick-annotation-tool"))],
    ["tool-threshold", first(help(page, "threshold-tool"))],
    ["zoom-actual-size", svgIcon(page, "AspectRatioIcon")],
    ["zoom-fit-screen", svgIcon(page, "FitScreenIcon")],
    ["zoom-reset-position", svgIcon(page, "ControlCameraIcon")],
    [
      "zoom-center-toggle",
      help(page, "zoom-and-position").locator(".MuiToggleButtonGroup-root"),
    ],
  ];
  await setTransparentBackgrounds(page, true);
  for (const [name, loc] of tools) await shootIcon(page, loc, icon(name));
  await setTransparentBackgrounds(page, false);
}

export const imageViewer: DocPage = {
  name: "image-viewer",
  project: { kind: "example", name: "Translocation Tutorial" },
  setup: enterImageViewer,
  steps: [
    { name: "overview", run: overview },
    { name: "drawers", run: drawers },
    { name: "tools", run: tools },
    { name: "confirm-bar", run: manipulation },
    { name: "icons", run: icons },
  ],
};
