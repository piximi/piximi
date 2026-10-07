// Tutorial: "Image Segmentation" with the U2OS cell-painting example project
// (docs page: pages/tutorial/segmentation-tutorial.md). The steps follow the
// tutorial: open the example, switch to Segmentation, pick and load a model,
// run it, look at the objects it found. Like the other tutorial page this uses
// an example project (it has one image and two existing kinds), because the
// tutorial itself starts from it.
//
// Cellpose-SAM needs WebGPU: run with DOCS_BROWSER_CHANNEL=chromium (or chrome).

import { BASE_URL } from "../config.ts";
import { docId, help, learningTaskHeader } from "../lib/locators.ts";
import { shootFullPage, shootPadded, shootUnion } from "../lib/output.ts";
import { openProject } from "../lib/project.ts";

import type { Page } from "playwright";

import type {
  CalloutSpec,
  DocPage,
  ProjectSource,
  ShotContext,
} from "../lib/types.ts";

const EXAMPLE_TAB = "Image and Object Sets";
const EXAMPLE_NAME = "U2OS cell-painting experiment";
const PROJECT: ProjectSource = {
  kind: "example",
  tab: EXAMPLE_TAB,
  name: EXAMPLE_NAME,
};

const MODEL = /cellpose-sam/i;
const OUTPUT_KIND = "cellpose_cells";
// The model weights (~588 MB) are downloaded on first load.
const LOAD_TIMEOUT_MS = 5 * 60 * 1000;
const RUN_TIMEOUT_MS = 10 * 60 * 1000;

const IN = { at: "tl", dx: 6, dy: 2 } as const;

const dialog = (p: Page) => p.locator(".MuiDialog-paper").last();
const park = (page: Page) => page.mouse.move(1150, 12);
const segmentationToggle = (p: Page) =>
  p.getByRole("button", { name: "Segmentation", exact: true });
const runButton = (p: Page) =>
  p.getByRole("button", { name: /run segmentation/i });
const kindTabs = (p: Page) => help(p, "kind-tabs");

// --- Callouts --------------------------------------------------------------

const EXAMPLE_DIALOG: CalloutSpec = [
  {
    n: 1,
    label: "Image and Object Sets",
    target: (p) =>
      dialog(p).getByRole("tab", { name: /image and object sets/i }),
    at: "left",
  },
  {
    n: 2,
    label: "U2OS cell-painting experiment",
    target: (p) =>
      dialog(p)
        .getByText(/U2OS cell-painting experiment/i)
        .first(),
    at: "left",
  },
];

const SECTION: CalloutSpec = [
  {
    n: 1,
    label: "Segmentation",
    target: segmentationToggle,
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Select Model",
    target: (p) => help(p, "load-classification-model"),
    at: "left",
  },
];

const MODEL_DIALOG: CalloutSpec = [
  {
    n: 1,
    label: "Pre-trained Models",
    target: (p) => dialog(p).getByRole("combobox"),
    at: "left",
  },
];

const MODEL_LIST: CalloutSpec = [
  {
    n: 1,
    label: "Cellpose-SAM",
    target: (p) => p.getByRole("option", { name: MODEL }),
    at: "left",
  },
];

const MODEL_SELECTED: CalloutSpec = [
  {
    n: 1,
    label: "Load Model",
    target: (p) => dialog(p).getByRole("button", { name: /load model/i }),
    at: "left",
  },
];

const RUN: CalloutSpec = [
  {
    n: 1,
    label: "Selected image",
    target: (p) => p.locator('[data-testid^="grid-item-"]').first(),
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Output kind name",
    target: (p) => docId(p, "output-kind-name"),
    at: "right",
  },
  {
    n: 3,
    label: "Run Segmentation",
    target: runButton,
    at: "left",
  },
];

const RESULTS: CalloutSpec = [
  {
    n: 1,
    label: "Annotations",
    target: (p) => p.getByRole("button", { name: "Annotations", exact: true }),
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Output kind",
    target: (p) => kindTabs(p).getByText(OUTPUT_KIND, { exact: true }),
    cover: true,
    ...IN,
  },
];

// --- State helpers ---------------------------------------------------------

async function switchGridView(page: Page, view: "Images" | "Annotations") {
  await page.getByRole("button", { name: view, exact: true }).click();
  await page.mouse.move(600, 350);
  await page.waitForTimeout(500);
}

async function showSegmentation(page: Page) {
  await segmentationToggle(page).click();
  await park(page);
  await page.waitForTimeout(500);
}

async function openModelDialog(page: Page) {
  await help(page, "load-classification-model").click();
  await dialog(page).waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(900); // slide-in transition
}

async function modelLoaded(page: Page) {
  return (await docId(page, "segmenter-settings").count()) > 0;
}

// Choose Cellpose-SAM in the open dialog and load it.
async function pickAndLoad(page: Page) {
  const combo = dialog(page).getByRole("combobox");
  if (!(await page.getByRole("option", { name: MODEL }).count())) {
    await combo.click();
  }
  await page.getByRole("option", { name: MODEL }).first().click();
  await page.waitForTimeout(500);
  await dialog(page)
    .getByRole("button", { name: /load model/i })
    .click();
  await docId(page, "segmenter-settings").waitFor({
    state: "visible",
    timeout: LOAD_TIMEOUT_MS,
  });
  await page.waitForTimeout(800);
}

// For steps that need a loaded model but do not shoot the picker.
async function ensureModel(page: Page) {
  await showSegmentation(page);
  if (await modelLoaded(page)) return;
  await openModelDialog(page);
  await pickAndLoad(page);
}

// Click Run Segmentation and wait until the new kind exists.
async function runSegmentation(page: Page) {
  await runButton(page).click();
  await page.waitForTimeout(1500);
  // The button is disabled while the model is predicting.
  await page.waitForFunction(
    () => {
      const b = [...document.querySelectorAll("button")].find((x) =>
        /run segmentation/i.test(x.textContent ?? ""),
      );
      return !!b && !(b as HTMLButtonElement).disabled;
    },
    undefined,
    { timeout: RUN_TIMEOUT_MS },
  );
  await switchGridView(page, "Annotations");
  await kindTabs(page)
    .getByText(OUTPUT_KIND, { exact: true })
    .waitFor({ state: "visible", timeout: 60000 });
  await switchGridView(page, "Images");
}

// --- Steps -----------------------------------------------------------------

// 1. Load images: the "Open Example Project" dialog, second tab.
async function loadExample(ctx: ShotContext) {
  const { page, out } = ctx;
  await page.goto(BASE_URL);
  await page.getByTestId("open-example-project").click();
  const chooser = dialog(page);
  await chooser.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(900); // slide-in transition
  await chooser.getByRole("tab", { name: /image and object sets/i }).click();
  await chooser
    .getByText(/U2OS cell-painting experiment/i)
    .first()
    .waitFor({ state: "visible", timeout: 5000 });
  await chooser
    .getByText(/U2OS cell-painting experiment/i)
    .first()
    .hover();
  await page.waitForTimeout(300);
  await ctx.annotate("example dialog", EXAMPLE_DIALOG);
  await shootPadded(page, chooser, {}, out("open-example"));
  await ctx.clearAnnotations();
  // Later steps need the project (and a clean, model-free page), so open it.
  await openProject(page, PROJECT);
}

// 2. Load models: switch the Learning Task to Segmentation.
async function section(ctx: ShotContext) {
  const { page, out } = ctx;
  await showSegmentation(page);
  await ctx.annotate("segmentation section", SECTION);
  await shootUnion(
    page,
    [learningTaskHeader(page), docId(page, "model-task-section")],
    { t: 4, b: 4, l: 4, r: 4 },
    out("section"),
  );
  await ctx.clearAnnotations();
}

// 2 (cont.). The model picker: empty, with the list open, with details shown.
async function selectModel(ctx: ShotContext) {
  const { page, out } = ctx;
  await showSegmentation(page);
  await openModelDialog(page);
  await park(page);
  await ctx.annotate("model dialog", MODEL_DIALOG);
  await shootPadded(page, dialog(page), {}, out("select-model"));
  await ctx.clearAnnotations();

  await dialog(page).getByRole("combobox").click();
  await page.getByRole("option", { name: MODEL }).first().waitFor({
    state: "visible",
    timeout: 5000,
  });
  await page.waitForTimeout(400);
  await park(page);
  await ctx.annotate("model list", MODEL_LIST);
  await shootUnion(
    page,
    [dialog(page), page.getByRole("listbox")],
    { t: 8, b: 8, l: 8, r: 8 },
    out("model-list"),
  );
  await ctx.clearAnnotations();

  await page.getByRole("option", { name: MODEL }).first().click();
  await page.waitForTimeout(500);
  await park(page);
  await ctx.annotate("model selected", MODEL_SELECTED);
  await shootPadded(page, dialog(page), {}, out("model-selected"));
  await ctx.clearAnnotations();

  await dialog(page)
    .getByRole("button", { name: /load model/i })
    .click();
  await docId(page, "segmenter-settings")
    .waitFor({ state: "visible", timeout: LOAD_TIMEOUT_MS })
    .catch(() => console.warn("  ! model did not finish loading in time"));
  await page.waitForTimeout(800);
  await park(page);
}

// 3. Run the model on the (selected) image.
async function run(ctx: ShotContext) {
  const { page, out } = ctx;
  await ensureModel(page);
  await switchGridView(page, "Images");
  const tile = page.locator('[data-testid^="grid-item-"]').first();
  await tile.click(); // select the image
  await park(page);
  await page.waitForTimeout(300);
  await ctx.annotate("run segmentation", RUN);
  await shootFullPage(page, out("run"));
  await ctx.clearAnnotations();
  await runSegmentation(page);
}

// 4. Segmentation output: the new kind in the Annotations view.
async function results(ctx: ShotContext) {
  const { page, out } = ctx;
  await ensureModel(page);
  const outputTab = kindTabs(page).getByText(OUTPUT_KIND, { exact: true });
  await switchGridView(page, "Annotations");
  if (!(await outputTab.count())) {
    await switchGridView(page, "Images");
    await runSegmentation(page);
    await switchGridView(page, "Annotations");
  }
  await outputTab.click();
  await page.waitForTimeout(1500); // object tiles render
  await park(page);
  await ctx.annotate("results", RESULTS);
  await shootFullPage(page, out("results"));
  await ctx.clearAnnotations();
  await switchGridView(page, "Images");
}

export const segmentationTutorial: DocPage = {
  name: "segmentation-tutorial",
  project: PROJECT,
  steps: [
    { name: "load-example", run: loadExample },
    { name: "section", run: section },
    { name: "select-model", run: selectModel },
    { name: "run", run },
    { name: "results", run: results },
  ],
};
