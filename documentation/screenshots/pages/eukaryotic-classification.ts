// Tutorial: "Image Classification" with the Human U2OS-cells example project
// (docs page: pages/tutorial/classify-example-eukaryotic-image.md). The steps
// follow the tutorial: open the example, look at the categories, categorize,
// fit, evaluate, predict. Unlike the other pages this uses an example project
// (not the tutorial zip), because the tutorial itself starts from it.

import { BASE_URL } from "../config.ts";
import {
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

import type { Page } from "playwright";

import type {
  CalloutSpec,
  DocPage,
  ProjectSource,
  ShotContext,
} from "../lib/types.ts";

const PROJECT: ProjectSource = {
  kind: "example",
  name: "Human U2OS-cells example project",
};

const IN = { at: "tl", dx: 6, dy: 2 } as const;

const dialog = (p: Page) => p.locator(".MuiDialog-paper").last();
const popper = (p: Page) => p.locator("#transition-popper");
const park = (page: Page) => page.mouse.move(1150, 12);

// --- Callouts --------------------------------------------------------------

const CATEGORIES: CalloutSpec = [
  {
    n: 1,
    label: "Categories",
    target: (p) => docId(p, "categories-list"),
    cover: true,
    ...IN,
  },
];

const CATEGORY_FILTERS: CalloutSpec = [
  {
    n: 1,
    label: "Sort | Filter",
    target: (p) => gridButton(p, "FilterAltOutlinedIcon"),
    at: "left",
  },
  {
    n: 2,
    label: "Category Filters",
    target: (p) => popper(p).getByText("Category Filters"),
    at: "left",
  },
];

const CATEGORIZE: CalloutSpec = [
  {
    n: 1,
    label: "Deselect",
    target: (p) => gridButton(p, "DeselectIcon"),
    at: "below",
  },
  {
    n: 2,
    label: "Categorize",
    target: (p) => gridButton(p, "LabelOutlinedIcon"),
    at: "below",
  },
  {
    n: 3,
    label: "Negative Control",
    target: (p) =>
      popper(p)
        .getByText(/negative control/i)
        .first(),
    at: "left",
  },
];

const FIT_BUTTON: CalloutSpec = [
  {
    n: 1,
    label: "Classification",
    target: (p) =>
      p.getByRole("button", { name: "Classification", exact: true }),
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Fit",
    target: (p) => help(p, "fit-model"),
    cover: true,
    ...IN,
  },
];

const FIT_DIALOG: CalloutSpec = [
  {
    n: 1,
    label: "Training Percentage",
    target: (p) => dialog(p).getByText("Training Percentage:"),
    at: "left",
  },
  {
    n: 2,
    label: "Fit Classifier",
    target: (p) => dialog(p).getByRole("button", { name: /fit classifier/i }),
    at: "left",
  },
];

const FIT_EXIT: CalloutSpec = [
  {
    n: 1,
    label: "Close",
    target: (p) => svgIcon(dialog(p), "CloseIcon"),
    at: "left",
  },
];

const PREDICT: CalloutSpec = [
  {
    n: 1,
    label: "Evaluate",
    target: (p) => help(p, "evaluate-model"),
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Predict",
    target: (p) => help(p, "predict-model"),
    cover: true,
    ...IN,
  },
  {
    n: 3,
    label: "Clear Predictions",
    target: (p) => p.getByText("Clear predictions"),
    cover: true,
    ...IN,
  },
  {
    n: 4,
    label: "Accept Predictions",
    target: (p) => p.getByText(/accept predictions/i),
    cover: true,
    ...IN,
  },
];

// --- State helpers ---------------------------------------------------------

// The Images grid is the only view this tutorial uses, so it is shown already;
// tag the regions we crop to.
async function tagAreas(page: Page) {
  await markGridArea(page, "action-drawer");
  await markGridArea(page, "image-grid");
}

// The filter, deselect and categorize buttons sit in the grid's toolbar.
const gridButton = (page: Page, icon: string) =>
  iconButton(docId(page, "grid-actions"), icon);

// Somewhere harmless to click when closing click-away poppers.
const awayTarget = (page: Page) => learningTaskHeader(page);

// Start each theme from an untrained classifier: the model is kept in the page
// between themes, so remove the one the previous theme trained.
async function resetClassifier(page: Page) {
  await page
    .getByRole("button", { name: "Classification", exact: true })
    .click();
  const remove = help(page, "delete-model");
  if ((await remove.count()) && (await remove.first().isEnabled())) {
    await remove.first().click();
    await page.waitForTimeout(500);
  }
  await park(page);
}

async function closeFitDialog(page: Page) {
  await svgIcon(dialog(page), "CloseIcon").click();
  await dialog(page)
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(400);
}

// --- Steps -----------------------------------------------------------------

// 1. Load images: the "Open Example Project" dialog on the start screen.
async function loadExample(ctx: ShotContext) {
  const { page, out } = ctx;
  await page.goto(BASE_URL);
  await page.getByTestId("open-example-project").click();
  const chooser = dialog(page);
  await chooser.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(900); // slide-in transition
  await chooser
    .getByText(/Human U2OS-cells example project/i)
    .first()
    .hover();
  await page.waitForTimeout(300);
  await shootPadded(page, chooser, {}, out("open-example"));
  // Later steps need the project, so open it for real.
  await openProject(page, PROJECT);
}

// 2. Categorize images: the Categories list and the Category Filters.
async function categories(ctx: ShotContext) {
  const { page, out } = ctx;
  await tagAreas(page);
  await park(page);
  await ctx.annotate("categories", CATEGORIES);
  await shootGridArea(page, "action-drawer", out("categories"));
  await ctx.clearAnnotations();

  // Hide the uncategorized images through the Category Filters.
  const filter = gridButton(page, "FilterAltOutlinedIcon");
  await openPopper(page, filter);
  // The section opens from the chevron button next to its title, not the title.
  await popper(page)
    .getByText("Category Filters")
    .locator("xpath=following::button[1]")
    .click();
  await popper(page)
    .getByText("Unknown", { exact: true })
    .first()
    .waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(500);
  await popper(page).getByText("Unknown", { exact: true }).first().click();
  await page.waitForTimeout(600);
  await ctx.annotate("category filters", CATEGORY_FILTERS);
  await shootFullPage(page, out("category-filters"));
  await ctx.clearAnnotations();

  // Put the filter back.
  await popper(page)
    .locator(".MuiChip-deleteIcon")
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(400);
  await closePopper(page, filter, awayTarget(page));
  await park(page);
}

// 2 (cont.). Select a few images and open the Categorize menu. The menu is
// closed again without choosing a category, so the project's labels stay as
// they were.
async function categorize(ctx: ShotContext) {
  const { page, out } = ctx;
  await tagAreas(page);
  const deselect = gridButton(page, "DeselectIcon");
  if (await deselect.isEnabled()) await deselect.click();
  const tiles = page.locator('[data-testid^="grid-item-"]');
  for (const i of [0, 1, 2]) await tiles.nth(i).click();
  await page.waitForTimeout(300);

  const categorizeButton = gridButton(page, "LabelOutlinedIcon");
  await openPopper(page, categorizeButton);
  await page.mouse.move(2, 2);
  await ctx.annotate("categorize", CATEGORIZE);
  await shootFullPage(page, out("categorize"));
  await ctx.clearAnnotations();

  await closePopper(page, categorizeButton, awayTarget(page));
  await deselect.click();
  await park(page);
}

// 3. Train model: the Learning Task section, then the Fit dialog.
async function fit(ctx: ShotContext) {
  const { page, out } = ctx;
  await resetClassifier(page);
  await tagAreas(page);

  await ctx.annotate("fit button", FIT_BUTTON);
  await shootUnion(
    page,
    [learningTaskHeader(page), docId(page, "model-task-section")],
    { t: 4, b: 4, l: 4, r: 4 },
    out("fit-button"),
  );
  await ctx.clearAnnotations();

  await help(page, "fit-model").click();
  await dialog(page).waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(900); // slide-in transition
  await park(page);
  await ctx.annotate("fit dialog", FIT_DIALOG);
  await shootPadded(page, dialog(page), {}, out("fit-dialog"));
  await ctx.clearAnnotations();

  // Train with the default settings.
  const fitButton = dialog(page).getByRole("button", {
    name: /fit classifier/i,
  });
  await fitButton.click();
  await fitButton.waitFor({ state: "hidden", timeout: 30000 }).catch(() => {});
  await fitButton.waitFor({ state: "visible", timeout: 5 * 60 * 1000 });
  await page.waitForTimeout(2000); // plots settle, evaluation runs
  await park(page);
  await shootPadded(page, dialog(page), {}, out("training-plots"));

  await ctx.annotate("fit exit", FIT_EXIT);
  await shootUnion(
    page,
    [
      dialog(page).getByText("Fit Model", { exact: true }),
      svgIcon(dialog(page), "CloseIcon"),
    ],
    { t: 12, b: 12, l: 12, r: 12 },
    out("fit-exit"),
  );
  await ctx.clearAnnotations();
  await closeFitDialog(page);
}

// 4. Evaluate, then predict the unlabelled images (and clear the result).
async function predict(ctx: ShotContext) {
  const { page, out } = ctx;
  await tagAreas(page);

  const evaluate = help(page, "evaluate-model");
  if (await evaluate.isDisabled()) {
    console.warn("  ! Evaluate is disabled (no trained model) - skipped");
    return;
  }
  await evaluate.click();
  await dialog(page).waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(1200);
  await park(page);
  await shootPadded(page, dialog(page), {}, out("evaluate"));
  await page.keyboard.press("Escape");
  await dialog(page)
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(400);

  await help(page, "predict-model").click();
  const clear = page.getByText("Clear predictions");
  await clear.waitFor({ state: "visible", timeout: 60000 });
  await page.waitForTimeout(800);
  await park(page);
  await ctx.annotate("predict", PREDICT);
  await shootFullPage(page, out("predict"));
  await ctx.clearAnnotations();
  await clear.click();
  await page.waitForTimeout(500);
}

export const eukaryoticClassification: DocPage = {
  name: "eukaryotic-classification",
  project: PROJECT,
  steps: [
    { name: "load-example", run: loadExample },
    { name: "categories", run: categories },
    { name: "categorize", run: categorize },
    { name: "fit", run: fit },
    { name: "predict", run: predict },
  ],
};
