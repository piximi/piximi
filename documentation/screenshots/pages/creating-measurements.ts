// "Creating Measurements" tutorial. A how-to walkthrough: open the Measurements
// view, create a table for an object kind, pick measurements, split the data,
// plot it (scatter, swarm, histogram) and export.
//
// Uses the default docs project file, which has a `cellpose_cells` kind. That is
// the kind measured; set DOCS_MEASURE_KIND (a regex) to choose another.
//
// Steps build on each other through `ensureTable`, which opens the Measurements
// view and creates the table if an earlier step has not, so any single step can
// also be run alone with `--only`.

import { docId, help, markGridArea } from "../lib/locators.ts";
import { shootFullPage, shootGridArea } from "../lib/output.ts";
import { openProject } from "../lib/project.ts";
import { DEFAULT_PROJECT_FILE } from "../config.ts";

import type { Locator, Page } from "playwright";

import type {
  CalloutSpec,
  DocPage,
  ProjectSource,
  ShotContext,
} from "../lib/types.ts";

const PROJECT: ProjectSource = {
  kind: "file",
  path: DEFAULT_PROJECT_FILE,
};

// The kind to measure. The table dialog also offers other kinds (such as
// "Unknown"), so match by name rather than taking the first non-image option.
const KIND_PATTERN = new RegExp(
  process.env.DOCS_MEASURE_KIND || "^cellpose_cells$",
  "i",
);

// Computing intensity measurements for every object can take a while.
const COMPUTE_TIMEOUT_MS = 5 * 60 * 1000;

const IN = { at: "tl", dx: 12, dy: 4 } as const;

const dialog = (p: Page) => p.locator(".MuiDialog-paper").last();
const park = (page: Page) => page.mouse.move(700, 12);
// Items of the open export menu. Match the whole name: "Statistics" is also a
// substring of "Statistics & Individual".
const exportItem = (p: Page, name: string) =>
  p.getByRole("menu").getByRole("menuitem", { name, exact: true });
const dataRows = (p: Page) => docId(p, "data-grid").locator(".MuiDataGrid-row");

// --- Callouts --------------------------------------------------------------

const NAV: CalloutSpec = [
  {
    n: 1,
    label: "Measure",
    target: (p) => help(p, "navigate-to-measurements"),
    at: "below",
  },
];

const ADD_TABLE: CalloutSpec = [
  {
    n: 1,
    label: "Add Table",
    target: (p) => help(p, "new-measurement-table"),
    at: "right",
  },
];

const KIND_DIALOG: CalloutSpec = [
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

const SELECT: CalloutSpec = [
  {
    n: 1,
    label: "Object measurements",
    target: (p) => help(p, "object-measurements"),
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Intensity measurements",
    target: (p) => help(p, "intensity-measurements"),
    cover: true,
    ...IN,
  },
];

const GRID: CalloutSpec = [
  {
    n: 1,
    label: "Split options",
    target: (p) => docId(p, "pivot-config"),
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Data grid",
    target: (p) => docId(p, "data-grid"),
    cover: true,
    ...IN,
  },
  {
    n: 3,
    label: "Plot view",
    target: (p) =>
      help(p, "measurement-group-view").getByRole("button", {
        name: /plot view/i,
      }),
    at: "left",
  },
];

const SCATTER: CalloutSpec = [
  { n: 1, label: "Plot", target: (p) => p.locator("#plot-select"), at: "left" },
  {
    n: 2,
    label: "X-axis",
    target: (p) => p.locator("#x-axis-select"),
    at: "left",
  },
  {
    n: 3,
    label: "Y-axis",
    target: (p) => p.locator("#y-axis-select"),
    at: "left",
  },
  {
    n: 4,
    label: "Color",
    target: (p) => p.locator("#color-select"),
    at: "left",
  },
  {
    n: 5,
    label: "Save plot",
    target: (p) => docId(p, "save-plot"),
    at: "left",
  },
];

const SWARM: CalloutSpec = [
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
];

const SWARM_STATS: CalloutSpec = [
  ...SWARM,
  {
    n: 4,
    label: "Show Statistics",
    target: (p) => p.getByText("Show Statistics"),
    at: "left",
  },
];

const HISTOGRAM: CalloutSpec = [
  { n: 1, label: "Plot", target: (p) => p.locator("#plot-select"), at: "left" },
  {
    n: 2,
    label: "X-axis",
    target: (p) => p.locator("#x-axis-select"),
    at: "left",
  },
  {
    n: 3,
    label: "Number of Bins",
    target: (p) => p.locator("#bin-size-text-field"),
    at: "left",
  },
];

const EXPORT: CalloutSpec = [
  {
    n: 1,
    label: "Export",
    target: (p) => docId(p, "export-data"),
    at: "left",
  },
  {
    n: 2,
    label: "Statistics",
    target: (p) => exportItem(p, "Statistics"),
    at: "left",
  },
  {
    n: 3,
    label: "Individual",
    target: (p) => exportItem(p, "Individual"),
    at: "left",
  },
  {
    n: 4,
    label: "Statistics & Individual",
    target: (p) => exportItem(p, "Statistics & Individual"),
    at: "left",
  },
];

// --- State helpers ---------------------------------------------------------

async function tagAreas(page: Page) {
  for (const name of ["top-bar", "action-drawer", "dashboard"]) {
    await markGridArea(page, name);
  }
}

async function pickOption(page: Page, selectId: string, option: string) {
  await page.locator(`#${selectId}`).click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await page.waitForTimeout(600);
}

// Pick the nth option of a select (for measurement selects, whose option names
// depend on which measurements were ticked).
async function pickNth(page: Page, selectId: string, index: number) {
  await page.locator(`#${selectId}`).click();
  await page.getByRole("option").nth(index).click();
  await page.waitForTimeout(600);
}

async function showView(page: Page, view: "table" | "plot") {
  const label = view === "table" ? /table view/i : /plot view/i;
  await help(page, "measurement-group-view")
    .getByRole("button", { name: label })
    .click();
  await park(page);
  await page.waitForTimeout(800);
  await tagAreas(page);
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

// Tick a group in the measurement tree (the visible checkbox; a forced click on
// the hidden input does not register) and expand it so its names show.
async function tickGroup(page: Page, helpName: string) {
  const group = help(page, helpName);
  await group.waitFor({ state: "visible", timeout: COMPUTE_TIMEOUT_MS });
  const box = group.locator(".MuiCheckbox-root").first();
  await box.click();
  await page.waitForTimeout(300);
  if (!(await group.locator("input[type=checkbox]").first().isChecked())) {
    throw new Error(`Could not tick the "${helpName}" group in the tree.`);
  }
  await group
    .locator('svg[data-testid="TreeViewExpandIconIcon"]')
    .first()
    .click()
    .catch(() => {});
}

const onMeasurements = (page: Page) => /\/measurements/.test(page.url());

// Both themes run in the same browser session, so the second theme starts
// wherever the first one stopped: in the Measurements view, with a table.
// The first two steps start from the plain project view (and no table), so
// reload the project when we are still in the Measurements view.
async function startFromProject(page: Page) {
  if (!onMeasurements(page)) return;
  await openProject(page, PROJECT);
}

// Create the table, taking the pictures on the way: open the dialog, show the
// kind list, pick the kind.
async function createTable(ctx: ShotContext): Promise<void> {
  const { page, out } = ctx;
  await park(page);
  await ctx.annotate("add table", ADD_TABLE);
  await shootFullPage(page, out("add-table"));
  await ctx.clearAnnotations();

  await help(page, "new-measurement-table").click();
  await dialog(page).waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(900);

  // Open the kind list so the picture shows what can be measured.
  await dialog(page).getByRole("combobox").click();
  const options = page.getByRole("option");
  await options.first().waitFor({ state: "visible", timeout: 5000 });
  const names = (await options.allTextContents()).map((t) => t.trim());
  const kind = names.find((n) => KIND_PATTERN.test(n));
  if (!kind) {
    throw new Error(
      `Kind ${KIND_PATTERN} not found among [${names.join(", ")}]. ` +
        "Use a project that has it, or set DOCS_MEASURE_KIND.",
    );
  }
  console.log(`  measuring kind "${kind}" (options: ${names.join(", ")})`);
  await park(page);
  await ctx.annotate("kind dialog", KIND_DIALOG);
  await shootFullPage(page, out("create-table"));
  await ctx.clearAnnotations();

  await page.getByRole("option", { name: kind, exact: true }).click();
  await dialog(page)
    .getByRole("button", { name: /confirm/i })
    .click();
  await dialog(page)
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

// Make sure the Measurements view is open with a table and ticked measurements.
// Does not take pictures.
async function ensureTable(ctx: ShotContext) {
  const { page } = ctx;
  if (!onMeasurements(page)) {
    await help(page, "navigate-to-measurements").click();
    await page.waitForURL(/\/measurements/, { timeout: 15000 });
  }
  if (await dataRows(page).count()) return;
  if (!(await help(page, "measurement-group-tabs").count())) {
    // Silent create: same clicks as `createTable` without the pictures.
    await help(page, "new-measurement-table").click();
    await dialog(page).waitFor({ state: "visible", timeout: 5000 });
    await dialog(page).getByRole("combobox").click();
    const names = (await page.getByRole("option").allTextContents()).map((t) =>
      t.trim(),
    );
    const kind = names.find((n) => KIND_PATTERN.test(n));
    if (!kind) {
      throw new Error(
        `Kind ${KIND_PATTERN} not found among [${names.join(", ")}].`,
      );
    }
    await page.getByRole("option", { name: kind, exact: true }).click();
    await dialog(page)
      .getByRole("button", { name: /confirm/i })
      .click();
    await dialog(page)
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
  }
  await tickGroups(page);
}

async function tickGroups(page: Page) {
  await tickGroup(page, "object-measurements");
  await tickGroup(page, "intensity-measurements");
  await dataRows(page)
    .first()
    .waitFor({ state: "visible", timeout: COMPUTE_TIMEOUT_MS });
  await page.waitForTimeout(1000);
}

// --- Steps -----------------------------------------------------------------

async function nav(ctx: ShotContext) {
  const { page, out } = ctx;
  await startFromProject(page);
  await park(page);
  await ctx.annotate("measure", NAV);
  await shootFullPage(page, out("nav"));
  await ctx.clearAnnotations();
}

async function create(ctx: ShotContext) {
  const { page } = ctx;
  await startFromProject(page);
  await help(page, "navigate-to-measurements").click();
  await page.waitForURL(/\/measurements/, { timeout: 15000 });
  await page.waitForTimeout(800);
  await createTable(ctx);

  // Measurements are computed in the background; wait for the tree.
  await help(page, "object-measurements").waitFor({
    state: "visible",
    timeout: COMPUTE_TIMEOUT_MS,
  });
  await page.waitForTimeout(500);
  await tagAreas(page);
  await park(page);
}

async function select(ctx: ShotContext) {
  const { page, out } = ctx;
  await ensureTable(ctx);
  await tagAreas(page);
  await park(page);
  await ctx.annotate("select measurements", SELECT);
  await shootGridArea(page, "action-drawer", out("select-measurements"));
  await ctx.clearAnnotations();
}

async function grid(ctx: ShotContext) {
  const { page, out } = ctx;
  await ensureTable(ctx);
  await showView(page, "table");

  const config = docId(page, "pivot-config");
  const available = config.getByText("Available Dimensions", { exact: true });
  const grouped = config.getByText("Category (all)", { exact: true }).first();
  // Start from a clean state: an earlier run may have left a grouping behind.
  if (await grouped.count()) await dragChip(page, grouped, available);

  const chip = config.getByText("Category", { exact: true }).first();
  const zone = config.getByText(/drag dimensions here/i).first();
  if (!(await dragChip(page, chip, zone))) {
    console.warn("  ! pivot: chip or drop zone not found - skipped");
  }
  await park(page);
  await ctx.annotate("data grid", GRID);
  await shootGridArea(page, "dashboard", out("data-grid"));
  await ctx.clearAnnotations();
}

async function plots(ctx: ShotContext) {
  const { page, out } = ctx;
  await ensureTable(ctx);
  await showView(page, "plot");

  // Scatter: two measurements, colored by category.
  await pickOption(page, "plot-select", "Scatter");
  await pickNth(page, "x-axis-select", 0);
  await pickNth(page, "y-axis-select", 1);
  await pickOption(page, "color-select", "category").catch(() => {
    console.warn("  ! scatter: could not set Color to category");
  });
  await page.waitForTimeout(1500);
  await park(page);
  await ctx.annotate("scatter", SCATTER);
  await shootGridArea(page, "dashboard", out("plot-scatter"));
  await ctx.clearAnnotations();

  // Swarm, alone and then with the summary box plot.
  await pickOption(page, "plot-select", "Swarm");
  await pickNth(page, "y-axis-select", 0);
  await pickOption(page, "swarmGroup-select", "category");
  const stats = page.getByRole("checkbox", { name: /show statistics/i });
  if (await stats.isChecked()) await stats.uncheck();
  await page.waitForTimeout(1500);
  await park(page);
  await ctx.annotate("swarm", SWARM);
  await shootGridArea(page, "dashboard", out("plot-swarm"));
  await ctx.clearAnnotations();

  await stats.check();
  await page.waitForTimeout(1500);
  await park(page);
  await ctx.annotate("swarm statistics", SWARM_STATS);
  await shootGridArea(page, "dashboard", out("plot-swarm-stats"));
  await ctx.clearAnnotations();

  // Histogram with a custom number of bins.
  await pickOption(page, "plot-select", "Histogram");
  await pickNth(page, "x-axis-select", 0);
  await page.locator("#bin-size-text-field").fill("20");
  await page.waitForTimeout(1500);
  await park(page);
  await ctx.annotate("histogram", HISTOGRAM);
  await shootGridArea(page, "dashboard", out("plot-histogram"));
  await ctx.clearAnnotations();

  await showView(page, "table"); // leave the table showing
}

async function exportMenu(ctx: ShotContext) {
  const { page, out } = ctx;
  await ensureTable(ctx);
  await showView(page, "table");
  await docId(page, "export-data").click();
  await page.getByRole("menu").waitFor({ state: "visible", timeout: 5000 });
  await exportItem(page, "Statistics").waitFor({
    state: "visible",
    timeout: 5000,
  });
  await page.waitForTimeout(500);
  await ctx.annotate("export", EXPORT);
  await shootFullPage(page, out("export"));
  await ctx.clearAnnotations();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
}

export const creatingMeasurements: DocPage = {
  name: "creating-measurements",
  project: PROJECT,
  steps: [
    { name: "nav", run: nav },
    { name: "create", run: create },
    { name: "select", run: select },
    { name: "grid", run: grid },
    { name: "plots", run: plots },
    { name: "export", run: exportMenu },
  ],
};
