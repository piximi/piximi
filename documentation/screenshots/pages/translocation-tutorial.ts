// Tutorial: "Piximi beginner tutorial" with the "Translocation Tutorial"
// example project (docs page: pages/tutorial/translocation_tutorial.md).
// The steps follow the tutorial from loading the project to the swarm plot:
// segment the cells with Cellpose-SAM, look at them, categorize a few and
// train a classifier on them, predict the rest, then measure and plot.
//
// Unlike most pages the steps here build on each other (the tutorial is a
// pipeline): inspect/classify/fit/evaluate need the cells that `segment`
// creates, so run the whole page rather than single steps. `measure` only
// needs the project itself.
//
// Cellpose-SAM needs WebGPU: run with DOCS_BROWSER_CHANNEL=chromium (or chrome).
//
// The tutorial asks the reader to categorize cells by eye. The capture cannot,
// so it labels the first visible cells in thirds. The pictures only need
// categorized cells; the labels carry no meaning.

import os from "node:os";
import path from "node:path";

import { BASE_URL } from "../config.ts";
import {
  area,
  docId,
  help,
  iconButton,
  learningTaskHeader,
  markGridArea,
  svgIcon,
} from "../lib/locators.ts";
import {
  shootFullPage,
  shootGridArea,
  shootPadded,
  shootUnion,
} from "../lib/output.ts";
import { openProject } from "../lib/project.ts";
import { closePopper, openPopper } from "../lib/popper.ts";

import type { Locator, Page } from "playwright";

import type {
  CalloutSpec,
  DocPage,
  ProjectSource,
  ShotContext,
} from "../lib/types.ts";

const PROJECT: ProjectSource = {
  kind: "example",
  name: "Translocation Tutorial",
};

const MODEL = /cellpose-sam/i;
const OUTPUT_KIND = "cellpose_cells";
const NEW_CATEGORIES = ["Cytoplasmic_GFP", "Nuclear_GFP", "No_GFP"];
const MAX_CELLS_PER_CATEGORY = 8;
// The measurement the tutorial plots (image-level total intensity of the GFP channel).
const GFP_CHANNEL = "Channel-1";
const GFP_MEASUREMENT = `total-${GFP_CHANNEL}`;

// The model weights (~588 MB) are downloaded on first load.
const LOAD_TIMEOUT_MS = 5 * 60 * 1000;
const RUN_TIMEOUT_MS = 30 * 60 * 1000;
const FIT_TIMEOUT_MS = 10 * 60 * 1000;
// Predicting crops and classifies every uncategorized cell, which is slow in a
// headless browser.
const PREDICT_TIMEOUT_MS = 15 * 60 * 1000;

const IN = { at: "tl", dx: 6, dy: 2 } as const;

const dialog = (p: Page) => p.locator(".MuiDialog-paper").last();
const popper = (p: Page) => p.locator("#transition-popper");
const park = (page: Page) => page.mouse.move(1150, 12);
const segmentationToggle = (p: Page) =>
  p.getByRole("button", { name: "Segmentation", exact: true });
const classificationToggle = (p: Page) =>
  p.getByRole("button", { name: "Classification", exact: true });
const runButton = (p: Page) =>
  p.getByRole("button", { name: /run segmentation/i });
const kindTabs = (p: Page) => help(p, "kind-tabs");
const outputTab = (p: Page) =>
  kindTabs(p).getByText(OUTPUT_KIND, { exact: true });
const selectAll = (p: Page) => p.getByTestId("select-all-button");
const gridButton = (p: Page, icon: string) =>
  iconButton(docId(p, "grid-actions"), icon);
const awayTarget = (p: Page) => learningTaskHeader(p);

// --- Callouts --------------------------------------------------------------

const EXAMPLE_DIALOG: CalloutSpec = [
  {
    n: 1,
    label: "Translocation Tutorial",
    target: (p) =>
      dialog(p)
        .getByText(/^Translocation Tutorial$/)
        .first(),
    at: "left",
  },
];

const PROJECT_IMAGES: CalloutSpec = [
  {
    n: 1,
    label: "Categories",
    target: (p) => docId(p, "categories-list"),
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Images",
    target: (p) => area(p, "image-grid"),
    cover: true,
    at: "tl",
    dx: 12,
    dy: 4,
  },
];

const SELECT_ALL: CalloutSpec = [
  {
    n: 1,
    label: "Select all",
    target: selectAll,
    at: "below",
  },
];

const SEGMENTER_SECTION: CalloutSpec = [
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
    label: "Output kind name",
    target: (p) => docId(p, "output-kind-name"),
    at: "right",
  },
  {
    n: 2,
    label: "Run Segmentation",
    target: runButton,
    at: "left",
  },
];

const OBJECTS: CalloutSpec = [
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
    target: outputTab,
    cover: true,
    ...IN,
  },
];

const CLASSIFIER_DRAWER: CalloutSpec = [
  {
    n: 1,
    label: "Classification",
    target: classificationToggle,
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "New Category",
    target: (p) => help(p, "create-category"),
    at: "left",
  },
  {
    n: 3,
    label: "Categories",
    target: (p) => docId(p, "categories-list"),
    cover: true,
    ...IN,
  },
];

const CATEGORY_DIALOG: CalloutSpec = [
  {
    n: 1,
    label: "Name",
    target: (p) => dialog(p).getByTestId("category-name-input"),
    at: "left",
  },
  {
    n: 2,
    label: "Confirm",
    target: (p) => dialog(p).getByRole("button", { name: /confirm/i }),
    at: "left",
  },
];

const CATEGORIZE: CalloutSpec = [
  {
    n: 1,
    label: "Categorize",
    target: (p) => gridButton(p, "LabelOutlinedIcon"),
    at: "below",
  },
  {
    n: 2,
    label: "Category",
    target: (p) => popper(p).getByText(NEW_CATEGORIES[0], { exact: true }),
    at: "left",
  },
];

const TRAINING_SETTINGS: CalloutSpec = [
  {
    n: 1,
    label: "Model Architecture",
    target: (p) => help(dialog(p), "model-architecture"),
    at: "left",
  },
  {
    n: 2,
    label: "Input Shape",
    target: (p) => help(dialog(p), "input-shape"),
    at: "left",
  },
  {
    n: 3,
    label: "Training Percentage",
    target: (p) => dialog(p).getByText("Training Percentage:"),
    at: "left",
  },
  {
    n: 4,
    label: "Fit Classifier",
    target: (p) => dialog(p).getByRole("button", { name: /fit classifier/i }),
    at: "left",
  },
];

const PREDICT: CalloutSpec = [
  {
    n: 1,
    label: "Predict",
    target: (p) => help(p, "predict-model"),
    cover: true,
    ...IN,
  },
];

const ACCEPT: CalloutSpec = [
  {
    n: 1,
    label: "Clear Predictions",
    target: (p) => p.getByText("Clear predictions"),
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Accept Predictions",
    target: (p) => p.getByText(/accept predictions/i),
    cover: true,
    ...IN,
  },
];

const NAV_MEASURE: CalloutSpec = [
  {
    n: 1,
    label: "Measure",
    target: (p) => help(p, "navigate-to-measurements"),
    at: "below",
  },
];

const TABLE_DIALOG: CalloutSpec = [
  {
    n: 1,
    label: "Kind",
    target: (p) => dialog(p).getByRole("combobox"),
    at: "left",
  },
  {
    n: 2,
    label: "Confirm",
    target: (p) => dialog(p).getByRole("button", { name: /confirm/i }),
    at: "left",
  },
];

const DATA_GRID: CalloutSpec = [
  {
    n: 1,
    label: "Measurements",
    target: (p) => help(p, "intensity-measurements"),
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Split options",
    target: (p) => docId(p, "pivot-config"),
    cover: true,
    ...IN,
  },
  {
    n: 3,
    label: "Data grid",
    target: (p) => docId(p, "data-grid"),
    cover: true,
    ...IN,
  },
];

const PLOT_SWITCH: CalloutSpec = [
  {
    n: 1,
    label: "Plot view",
    target: (p) =>
      help(p, "measurement-group-view").getByRole("button", {
        name: /plot view/i,
      }),
    at: "below",
  },
];

const SWARM_PLOT: CalloutSpec = [
  { n: 1, label: "Plot", target: (p) => p.locator("#plot-select"), at: "left" },
  {
    n: 2,
    label: "Y-axis",
    target: (p) => p.locator("#y-axis-select"),
    at: "left",
  },
  {
    n: 3,
    label: "SwarmGroup",
    target: (p) => p.locator("#swarmGroup-select"),
    at: "left",
  },
  {
    n: 4,
    label: "Show Statistics",
    target: (p) => p.getByText("Show Statistics"),
    at: "left",
  },
];

// --- State helpers ---------------------------------------------------------

async function tagAreas(page: Page) {
  await markGridArea(page, "action-drawer");
  await markGridArea(page, "image-grid");
}

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

async function openDialogFrom(page: Page, trigger: Locator) {
  await trigger.click();
  await dialog(page).waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(900); // slide-in transition
}

async function closeDialog(page: Page) {
  await page.keyboard.press("Escape");
  await dialog(page)
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(400);
}

// Fail early (with a pointer) when a step that needs the segmented cells runs
// on a project that has none.
async function requireCells(page: Page) {
  await switchGridView(page, "Annotations");
  if (!(await outputTab(page).count())) {
    throw new Error(
      `No "${OUTPUT_KIND}" kind in the project: run the "segment" step first (steps build on each other).`,
    );
  }
  await outputTab(page).click();
  await page.waitForTimeout(1000);
}

// Click the first `count` visible grid tiles.
async function clickTiles(page: Page, from: number, to: number) {
  const tiles = page.locator('[data-testid^="grid-item-"]');
  for (let i = from; i < to; i++) await tiles.nth(i).click();
  await page.waitForTimeout(300);
}

async function deselectAll(page: Page) {
  const deselect = gridButton(page, "DeselectIcon");
  if (await deselect.isEnabled()) await deselect.click();
  await page.waitForTimeout(300);
}

// Drag a chip from one pivot zone to another. dnd-kit needs real pointer
// movement, so move in steps. Returns false if either end is missing.
async function dragChip(page: Page, chip: Locator, zone: Locator) {
  const from = await chip.boundingBox({ timeout: 3000 }).catch(() => null);
  const to = await zone.boundingBox({ timeout: 3000 }).catch(() => null);
  if (!from || !to) return false;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + 20, to.y + 10, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  return true;
}

// Choose an option of a MUI Select (found by id) by its exact text.
async function pickOption(page: Page, selectId: string, option: string) {
  await page.locator(`#${selectId}`).click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await page.waitForTimeout(600);
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
  await outputTab(page).waitFor({ state: "visible", timeout: 60000 });
}

// When a wait times out, say what the page was showing: a screenshot in the
// temp folder, and the text of any dialog or alert (the app reports errors in
// one), so a failure is not just "timed out".
async function dumpState(page: Page, label: string) {
  const file = path.join(os.tmpdir(), `docs-${label}.png`);
  await page.screenshot({ path: file }).catch(() => {});
  const texts = await page
    .locator('[role="dialog"], [role="alert"], .MuiAlert-root')
    .allInnerTexts()
    .catch(() => []);
  console.warn(`  ! ${label}: screenshot at ${file}`);
  for (const text of texts)
    console.warn(`  ! on screen: ${text.slice(0, 400)}`);
}

// --- Steps -----------------------------------------------------------------

// 1. Load the Piximi project: the "Open Example Project" dialog.
async function loadExample(ctx: ShotContext) {
  const { page, out } = ctx;
  await page.goto(BASE_URL);
  await page.getByTestId("open-example-project").click();
  const chooser = dialog(page);
  await chooser.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(900); // slide-in transition
  await chooser
    .getByText(/^Translocation Tutorial$/)
    .first()
    .hover();
  await page.waitForTimeout(300);
  await ctx.annotate("example dialog", EXAMPLE_DIALOG);
  await shootPadded(page, chooser, {}, out("open-example"));
  await ctx.clearAnnotations();
  // Later steps need the project (and a clean, model-free page), so open it.
  await openProject(page, PROJECT);
}

// 2. Check the loaded images.
async function images(ctx: ShotContext) {
  const { page, out } = ctx;
  await tagAreas(page);
  await switchGridView(page, "Images");
  await park(page);
  await ctx.annotate("project images", PROJECT_IMAGES);
  await shootFullPage(page, out("project-images"));
  await ctx.clearAnnotations();
}

// 3. Segment the cells: select all images, pick a model, run it.
async function segment(ctx: ShotContext) {
  const { page, out } = ctx;
  await tagAreas(page);
  await switchGridView(page, "Images");
  await park(page);
  await ctx.annotate("select all", SELECT_ALL);
  await shootFullPage(page, out("select-all"));
  await ctx.clearAnnotations();
  await selectAll(page).click();
  await page.waitForTimeout(300);

  await showSegmentation(page);
  await ctx.annotate("segmenter section", SEGMENTER_SECTION);
  await shootUnion(
    page,
    [learningTaskHeader(page), docId(page, "model-task-section")],
    { t: 4, b: 4, l: 4, r: 4 },
    out("segmenter-section"),
  );
  await ctx.clearAnnotations();

  await openDialogFrom(page, help(page, "load-classification-model"));
  await park(page);
  await ctx.annotate("model dialog", MODEL_DIALOG);
  await shootPadded(page, dialog(page), {}, out("load-model"));
  await ctx.clearAnnotations();

  await dialog(page).getByRole("combobox").click();
  await page.getByRole("option", { name: MODEL }).first().click();
  await page.waitForTimeout(500);
  await park(page);
  await ctx.annotate("model selected", MODEL_SELECTED);
  await shootPadded(page, dialog(page), {}, out("open-model"));
  await ctx.clearAnnotations();

  await dialog(page)
    .getByRole("button", { name: /load model/i })
    .click();
  await docId(page, "segmenter-settings").waitFor({
    state: "visible",
    timeout: LOAD_TIMEOUT_MS,
  });
  await page.waitForTimeout(800);
  await park(page);
  await ctx.annotate("run segmentation", RUN);
  await shootFullPage(page, out("predict"));
  await ctx.clearAnnotations();

  await runSegmentation(page);
}

// 4. Look at the segmentation: the new kind, then the Image Viewer.
async function inspect(ctx: ShotContext) {
  const { page, out } = ctx;
  await requireCells(page);
  await park(page);
  await ctx.annotate("segmented cells", OBJECTS);
  await shootFullPage(page, out("cellpose-cells"));
  await ctx.clearAnnotations();

  await selectAll(page).click();
  await page.waitForTimeout(300);
  await help(page, "navigate-to-imageviewer").click();
  await page.waitForURL(/\/imageviewer/, { timeout: 15000 });
  await page.waitForTimeout(3000); // images and annotations load
  await park(page);
  await shootFullPage(page, out("image-viewer"));

  await page.goBack();
  await page.waitForURL(/\/project/, { timeout: 15000 });
  await page.waitForTimeout(1500);
  await requireCells(page);
  await deselectAll(page);
}

// 5. Classify the cells: new categories, then categorize a few cells.
async function classify(ctx: ShotContext) {
  const { page, out } = ctx;
  await requireCells(page);
  await tagAreas(page);
  await classificationToggle(page).click();
  await park(page);
  await ctx.annotate("classifier drawer", CLASSIFIER_DRAWER);
  await shootGridArea(page, "action-drawer", out("classifier-section"));
  await ctx.clearAnnotations();

  for (const [i, name] of NEW_CATEGORIES.entries()) {
    await help(page, "create-category").click();
    await dialog(page).waitFor({ state: "visible", timeout: 5000 });
    await page.waitForTimeout(900);
    // The test id is on the TextField wrapper, not the <input>.
    await dialog(page)
      .getByTestId("category-name-input")
      .locator("input")
      .fill(name);
    if (i === 0) {
      await park(page);
      await ctx.annotate("category dialog", CATEGORY_DIALOG);
      await shootPadded(
        page,
        dialog(page),
        {},
        out("classifier-create-category"),
      );
      await ctx.clearAnnotations();
    }
    await dialog(page)
      .getByRole("button", { name: /confirm/i })
      .click();
    await dialog(page)
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(500);
  }

  // Label the first visible cells in thirds (see the note at the top).
  const visible = await page.locator('[data-testid^="grid-item-"]').count();
  const per = Math.min(MAX_CELLS_PER_CATEGORY, Math.floor(visible / 3));
  if (per < 1) throw new Error("Too few visible cells to categorize.");
  const categorizeButton = gridButton(page, "LabelOutlinedIcon");
  for (const [i, name] of NEW_CATEGORIES.entries()) {
    await deselectAll(page);
    await clickTiles(page, i * per, (i + 1) * per);
    await openPopper(page, categorizeButton);
    await page.mouse.move(2, 2);
    if (i === 0) {
      await ctx.annotate("categorize", CATEGORIZE);
      await shootFullPage(page, out("categorize"));
      await ctx.clearAnnotations();
    }
    await popper(page).getByText(name, { exact: true }).click();
    await page.waitForTimeout(500);
    await closePopper(page, categorizeButton, awayTarget(page));
  }
  await deselectAll(page);
  await park(page);
}

// 6. Train the classifier.
async function fit(ctx: ShotContext) {
  const { page, out } = ctx;
  await requireCells(page);
  await classificationToggle(page).click();
  await park(page);

  await openDialogFrom(page, help(page, "fit-model"));
  await dialog(page)
    .getByRole("tab", { name: /hyperparameters/i })
    .click();
  // The tutorial's settings: Simple CNN (the default) with a 48x48x3 input and
  // 75% of the labelled cells for training.
  for (const [id, value] of [
    ["shape-cols", "48"],
    ["shape-rows", "48"],
    ["shape-channels", "3"],
  ] as const) {
    const field = dialog(page).locator(`#${id}`);
    if (await field.isEnabled()) {
      await field.fill(value);
      await field.blur(); // the field commits on blur
    }
  }
  // data-help sits on the label text, so take the input that follows it.
  const trainPct = help(dialog(page), "train-percentage").locator(
    "xpath=following::input[1]",
  );
  await trainPct.fill("0.75");
  await trainPct.blur();
  await park(page);
  await page.waitForTimeout(300);
  await ctx.annotate("training settings", TRAINING_SETTINGS);
  await shootPadded(page, dialog(page), {}, out("training-settings"));
  await ctx.clearAnnotations();

  const fitButton = dialog(page).getByRole("button", {
    name: /fit classifier/i,
  });
  await fitButton.click();
  await fitButton.waitFor({ state: "hidden", timeout: 30000 }).catch(() => {});
  await fitButton.waitFor({ state: "visible", timeout: FIT_TIMEOUT_MS });
  await page.waitForTimeout(2000); // plots settle, evaluation runs
  await park(page);
  await shootPadded(page, dialog(page), {}, out("training-plots"));
  await svgIcon(dialog(page), "CloseIcon").click();
  await dialog(page)
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(400);
}

// 7. Evaluate the model, predict the remaining cells, accept (or clear) them.
async function evaluate(ctx: ShotContext) {
  const { page, out } = ctx;
  await requireCells(page);
  await classificationToggle(page).click();
  await park(page);

  const evaluateButton = help(page, "evaluate-model");
  if (await evaluateButton.isDisabled()) {
    console.warn("  ! Evaluate is disabled (no trained model) - skipped");
    return;
  }
  await openDialogFrom(page, evaluateButton);
  await page.waitForTimeout(600);
  await park(page);
  await shootPadded(page, dialog(page), {}, out("training-eval"));
  await closeDialog(page);

  await ctx.annotate("predict", PREDICT);
  await shootUnion(
    page,
    [learningTaskHeader(page), docId(page, "model-task-section")],
    { t: 4, b: 4, l: 4, r: 4 },
    out("predict-classifier"),
  );
  await ctx.clearAnnotations();
  await help(page, "predict-model").click();
  const clear = page.getByText("Clear predictions");
  try {
    await clear.waitFor({ state: "visible", timeout: PREDICT_TIMEOUT_MS });
  } catch (error) {
    await dumpState(page, "predict-timeout");
    throw error;
  }
  await page.waitForTimeout(800);
  await park(page);
  await ctx.annotate("accept predictions", ACCEPT);
  await shootFullPage(page, out("accept-predictions"));
  await ctx.clearAnnotations();
  // Leave the labels as they were (the tutorial's measurements use image categories).
  await clear.click();
  await page.waitForTimeout(500);
}

// 8-9. Measure the images and plot the result.
async function measure(ctx: ShotContext) {
  const { page, out } = ctx;
  // Back to a plain project view, whatever the earlier steps left showing.
  await switchGridView(page, "Images");
  await park(page);
  await ctx.annotate("measure", NAV_MEASURE);
  await shootFullPage(page, out("nav-measurements"));
  await ctx.clearAnnotations();

  await help(page, "navigate-to-measurements").click();
  await page.waitForURL(/\/measurements/, { timeout: 15000 });
  await help(page, "new-measurement-table").click();
  await dialog(page).waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(900);
  await park(page);
  await ctx.annotate("table dialog", TABLE_DIALOG);
  await shootPadded(page, dialog(page), {}, out("measurements-table-create"));
  await ctx.clearAnnotations();
  // "Images" is the default kind.
  await dialog(page)
    .getByRole("button", { name: /confirm/i })
    .click();
  await dialog(page)
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});

  // Intensity > Total > GFP channel.
  const tree = help(page, "intensity-measurements");
  const expandIcon = 'svg[data-testid="TreeViewExpandIconIcon"]';
  await tree.waitFor({ state: "visible", timeout: 30000 });
  await tree.locator(expandIcon).first().click();
  await tree
    .getByText("Total", { exact: true })
    .locator(`xpath=preceding::*[@data-testid="TreeViewExpandIconIcon"][1]`)
    .click();
  // Click the visible checkbox (a forced click on the hidden <input> does not
  // register), then make sure the measurement really got selected.
  const channelItem = tree
    .getByText(GFP_CHANNEL, { exact: true })
    .locator("xpath=ancestor::*[@role='treeitem'][1]");
  await channelItem.locator(".MuiCheckbox-root").first().click();
  await page.waitForTimeout(300);
  if (
    !(await channelItem.locator("input[type=checkbox]").first().isChecked())
  ) {
    throw new Error(`Could not select ${GFP_CHANNEL} under Total in the tree.`);
  }
  await page.waitForTimeout(3000); // measurements compute
  await markGridArea(page, "dashboard");

  // Split by category: drag the chip into Column Grouping.
  const config = docId(page, "pivot-config");
  const chip = config.getByText("Category", { exact: true }).first();
  const zone = config.getByText(/drag dimensions here/i).first();
  if (!(await dragChip(page, chip, zone))) {
    console.warn("  ! pivot: chip or drop zone not found - skipped");
  }
  await park(page);
  await ctx.annotate("data grid", DATA_GRID);
  await shootFullPage(page, out("measurements-data-grid"));
  await ctx.clearAnnotations();

  const plotView = help(page, "measurement-group-view").getByRole("button", {
    name: /plot view/i,
  });
  await park(page);
  await ctx.annotate("plot switch", PLOT_SWITCH);
  await shootGridArea(page, "dashboard", out("measurements-plot-switch"));
  await ctx.clearAnnotations();
  await plotView.click();
  await page.waitForTimeout(800);

  await pickOption(page, "plot-select", "Swarm");
  await pickOption(page, "y-axis-select", GFP_MEASUREMENT);
  await pickOption(page, "swarmGroup-select", "category");
  await page.getByRole("checkbox", { name: /show statistics/i }).check();
  await page.waitForTimeout(1500);
  await park(page);
  await ctx.annotate("swarm plot", SWARM_PLOT);
  await shootFullPage(page, out("measurements-swarm-plot"));
  await ctx.clearAnnotations();
}

export const translocationTutorial: DocPage = {
  name: "translocation-tutorial",
  project: PROJECT,
  steps: [
    { name: "load-example", run: loadExample },
    { name: "images", run: images },
    { name: "segment", run: segment },
    { name: "inspect", run: inspect },
    { name: "classify", run: classify },
    { name: "fit", run: fit },
    { name: "evaluate", run: evaluate },
    { name: "measure", run: measure },
  ],
};
