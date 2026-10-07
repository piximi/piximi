// Segmentation section of the Project Viewer's Learning Task panel
// (docs page: pages/detail/projectviewer-segmentation.md).

import { DEFAULT_PROJECT_FILE } from "../config.ts";
import { docId, help, learningTaskHeader } from "../lib/locators.ts";
import { shootPadded, shootUnion } from "../lib/output.ts";

import type { Page } from "playwright";

import type { CalloutSpec, DocPage, ShotContext } from "../lib/types.ts";

const SECTION: CalloutSpec = [
  {
    n: 1,
    label: "Select model / run segmentation",
    target: (p) => docId(p, "segmenter-section"),
    cover: true,
    at: "tl",
    dx: 6,
    dy: 2,
  },
];

// Badges sit beside their text rather than covering it. The headers are
// centred dividers, so "left" lands on the rule just before the label.
const SETTINGS: CalloutSpec = [
  {
    n: 1,
    label: "Run Segmentation",
    target: (p) => p.getByRole("button", { name: /run segmentation/i }),
    at: "left",
  },
  {
    n: 2,
    label: "Output kind name",
    target: (p) => docId(p, "output-kind-name"),
    at: "right",
  },
  {
    n: 3,
    label: "Channel mapping",
    target: (p) => docId(p, "channel-mapping-header"),
    at: "left",
  },
  {
    n: 4,
    label: "Additional settings",
    target: (p) => docId(p, "options-header"),
    at: "left",
  },
];

const dialog = (p: Page) => p.locator(".MuiDialog-paper").last();
const park = (page: Page) => page.mouse.move(1150, 12);

async function showSegmentation(page: Page) {
  await page.getByRole("button", { name: "Segmentation", exact: true }).click();
  await park(page);
  await page.waitForTimeout(500);
}

async function section(ctx: ShotContext) {
  const { page, out } = ctx;
  await showSegmentation(page);
  await ctx.annotate("segmenter section", SECTION);
  await shootUnion(
    page,
    [learningTaskHeader(page), docId(page, "model-task-section")],
    { t: 4, b: 4, l: 4, r: 4 },
    out("section"),
  );
  await ctx.clearAnnotations();
}

// Open the model picker, choose the first pre-trained model and load it.
async function loadModel(ctx: ShotContext) {
  const { page, out } = ctx;
  await showSegmentation(page);
  await help(page, "load-classification-model").click();
  await dialog(page).waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(900);
  await shootPadded(page, dialog(page), {}, out("load-model"));

  await dialog(page).getByRole("combobox").click();
  // DOCS_SEGMENTER_MODEL (regex) picks the model; default is the first listed.
  const wanted = process.env.DOCS_SEGMENTER_MODEL;
  const options = page.getByRole("option");
  await (
    wanted
      ? options.filter({ hasText: new RegExp(wanted, "i") }).first()
      : options.first()
  ).click();
  await page.waitForTimeout(500);
  await park(page);
  await shootPadded(page, dialog(page), {}, out("load-model-selected"));

  await dialog(page).getByRole("button", { name: /load/i }).last().click();
  // Weights are fetched on first use; give the download time.
  await docId(page, "segmenter-settings")
    .waitFor({ state: "visible", timeout: 180000 })
    .catch(() => console.warn("  ! model did not finish loading in time"));
  await page.waitForTimeout(800);
  await park(page);
  await ctx.annotate("segmenter settings", SETTINGS);
  await shootUnion(
    page,
    [learningTaskHeader(page), docId(page, "model-task-section")],
    { t: 4, b: 4, l: 4, r: 4 },
    out("settings"),
  );
  await ctx.clearAnnotations();
}

export const segmenter: DocPage = {
  name: "segmenter",
  project: { kind: "file", path: DEFAULT_PROJECT_FILE },
  steps: [
    { name: "section", run: section },
    { name: "load-model", run: loadModel },
  ],
};
