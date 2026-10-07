// Classification section of the Project Viewer's Learning Task panel and its
// dialogs (docs page: pages/detail/projectviewer-classification.md).
// Needs a project with a trained classifier (the tutorial project has one).

import { DEFAULT_PROJECT_FILE } from "../config.ts";
import { docId, help } from "../lib/locators.ts";
import { shootPadded } from "../lib/output.ts";

import type { Page } from "playwright";

import type { CalloutSpec, DocPage, ShotContext } from "../lib/types.ts";

const IN = { at: "tl", dx: 12, dy: 4 } as const;

const SECTION: CalloutSpec = [
  {
    n: 1,
    label: "Task selection",
    target: (p) => help(p, "learning-task"),
    cover: true,
    at: "tl",
    dx: 6,
    dy: 2,
  },
  {
    n: 2,
    label: "Model I/O",
    target: (p) => docId(p, "model-io"),
    cover: true,
    at: "tl",
    dx: 6,
    dy: 2,
  },
  {
    n: 3,
    label: "Model selection",
    target: (p) => docId(p, "model-select"),
    cover: true,
    at: "tl",
    dx: 6,
    dy: 2,
  },
  {
    n: 4,
    label: "Model operations (Fit | Predict | Evaluate)",
    target: (p) => docId(p, "model-actions"),
    cover: true,
    at: "tl",
    dx: 6,
    dy: 2,
  },
];

const dialog = (p: Page) => p.locator(".MuiDialog-paper").last();

const FIT: CalloutSpec = [
  {
    n: 1,
    label: "Dialog tabs",
    target: (p) => dialog(p).getByRole("tablist"),
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Model architecture & name",
    target: (p) => docId(dialog(p), "model-picker"),
    cover: true,
    ...IN,
  },
  {
    n: 3,
    label: "Data preprocessing",
    target: (p) => docId(dialog(p), "preprocessing-settings"),
    cover: true,
    ...IN,
  },
  {
    n: 4,
    label: "Optimization",
    target: (p) => docId(dialog(p), "optimizer-settings"),
    cover: true,
    ...IN,
  },
  {
    n: 5,
    label: "Export hyperparameters",
    target: (p) =>
      dialog(p).getByRole("button", { name: /export hyperparameters/i }),
    at: "above",
  },
  {
    n: 6,
    label: "Fit classifier",
    target: (p) => dialog(p).getByRole("button", { name: /fit classifier/i }),
    at: "above",
  },
];

// --- State helpers ---------------------------------------------------------

const park = (page: Page) => page.mouse.move(1150, 12);

// The tutorial project ships without trained models, so the first time through
// we fit a short one on the labelled images. Models live in the page (not the
// project file), so later steps and the second theme reuse it.
const EPOCHS = process.env.DOCS_CLASSIFIER_EPOCHS ?? "3";
const TRAIN_TIMEOUT_MS = 15 * 60 * 1000;

async function trainQuickModel(page: Page) {
  console.log(`  no trained classifier yet - fitting one (${EPOCHS} epochs)`);
  await openDialog(page, "fit-model");
  await dialog(page)
    .getByRole("tab", { name: /hyperparameters/i })
    .click();
  const epochs = dialog(page)
    .locator("#epochs")
    .or(dialog(page).getByText("Epochs:").locator("..").locator("input"))
    .first();
  await epochs.fill(EPOCHS);
  await epochs.blur(); // the field commits on blur
  await page.waitForTimeout(300);

  const fitButton = dialog(page).getByRole("button", {
    name: /fit classifier/i,
  });
  await fitButton.click();
  // Only shown when predictions exist; there are none in the tutorial project.
  const lost = page
    .getByRole("dialog")
    .filter({ hasText: /predictions will be lost/i });
  if (await lost.count()) {
    await lost.getByRole("button", { name: /confirm|ok|yes/i }).click();
  }
  // The button is swapped for a progress bar while training and returns after.
  await fitButton.waitFor({ state: "hidden", timeout: 30000 }).catch(() => {});
  await fitButton.waitFor({ state: "visible", timeout: TRAIN_TIMEOUT_MS });
  await page.waitForTimeout(3000); // automatic evaluation after the run
  await closeDialog(page);
}

// Make sure the Classification task is showing with a trained model selected.
async function prepare(page: Page) {
  await page.getByRole("button", { name: "Classification" }).click();
  const select = docId(page, "model-select").getByRole("combobox");
  if ((await select.getAttribute("aria-disabled")) === "true") {
    await trainQuickModel(page);
  }
  const current = (await select.textContent())?.trim();
  if (!current || current === "New Model") {
    await select.click();
    const trained = page
      .getByRole("option")
      .filter({ hasNotText: "New Model" });
    if (await trained.count()) {
      await trained.first().click();
    } else {
      await page.keyboard.press("Escape");
      console.warn("  ! no trained classifier found in the project");
    }
  }
  await park(page);
  await page.waitForTimeout(500);
}

async function openDialog(page: Page, trigger: string) {
  await help(page, trigger).click();
  await dialog(page).waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(900); // slide-in transition
  await park(page);
}

async function closeDialog(page: Page) {
  await page.keyboard.press("Escape");
  await dialog(page)
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(400);
}

// --- Steps -----------------------------------------------------------------

async function section(ctx: ShotContext) {
  const { page, out } = ctx;
  await prepare(page);
  await ctx.annotate("classifier section", SECTION);
  await shootPadded(
    page,
    docId(page, "model-task-section"),
    { t: 4, b: 4, l: 4, r: 4 },
    out("section"),
  );
  await ctx.clearAnnotations();
}

async function loadModel(ctx: ShotContext) {
  const { page, out } = ctx;
  await prepare(page);
  await openDialog(page, "load-classification-model");
  await shootPadded(page, dialog(page), {}, out("load-model"));
  await closeDialog(page);
}

async function fit(ctx: ShotContext) {
  const { page, out } = ctx;
  await prepare(page);
  await openDialog(page, "fit-model");
  await dialog(page)
    .getByRole("tab", { name: /hyperparameters/i })
    .click();
  await page.waitForTimeout(400);
  await ctx.annotate("fit dialog", FIT);
  await shootPadded(page, dialog(page), {}, out("fit-hyperparameters"));
  await ctx.clearAnnotations();

  const tabs: Array<[RegExp, string]> = [
    [/training plots/i, "fit-training-plots"],
    [/model summary/i, "fit-model-summary"],
    [/model runs summary/i, "fit-runs-summary"],
  ];
  for (const [name, file] of tabs) {
    await dialog(page).getByRole("tab", { name }).click();
    await page.waitForTimeout(1200); // plots animate in
    await park(page);
    await shootPadded(page, dialog(page), {}, out(file));
  }
  await closeDialog(page);
}

// Run the trained model on unlabeled images, capture the result, then undo it.
async function predict(ctx: ShotContext) {
  const { page, out } = ctx;
  await prepare(page);
  const button = help(page, "predict-model");
  if (await button.isDisabled()) {
    console.warn("  ! Predict is disabled (no unlabeled images?) - skipped");
    return;
  }
  await button.click();
  const clear = page.getByText("Clear predictions");
  await clear.waitFor({ state: "visible", timeout: 60000 });
  await page.waitForTimeout(500);
  await park(page);
  await shootPadded(
    page,
    docId(page, "model-task-section"),
    { t: 4, b: 4, l: 4, r: 4 },
    out("predict-options"),
  );
  await clear.click();
  await page.waitForTimeout(500);
}

async function evaluate(ctx: ShotContext) {
  const { page, out } = ctx;
  await prepare(page);
  const button = help(page, "evaluate-model");
  if (await button.isDisabled()) {
    console.warn("  ! Evaluate is disabled (no trained run) - skipped");
    return;
  }
  await openDialog(page, "evaluate-model");
  await page.waitForTimeout(1000);
  await shootPadded(page, dialog(page), {}, out("evaluate"));
  await closeDialog(page);
}

export const classifier: DocPage = {
  name: "classifier",
  project: { kind: "file", path: DEFAULT_PROJECT_FILE },
  steps: [
    { name: "section", run: section },
    { name: "load-model", run: loadModel },
    { name: "fit", run: fit },
    { name: "predict", run: predict },
    { name: "evaluate", run: evaluate },
  ],
};
