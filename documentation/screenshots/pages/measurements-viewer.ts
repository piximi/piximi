// Measurements viewer. Reached from the project view; `setup` creates a
// measurement table for the first object kind in the project and ticks every
// available measurement so the table and plots have data.

import { DEFAULT_PROJECT_FILE } from "../config.ts";
import { docId, help, markGridArea } from "../lib/locators.ts";
import { shootGridArea } from "../lib/output.ts";

import type { Locator, Page } from "playwright";

import type { CalloutSpec, DocPage, ShotContext } from "../lib/types.ts";

// Kind to measure. Must exist in the project (the tutorial project has it).
const KIND = "cellpose_cells";

// Badges sit just inside the top-left corner of each section so they stay
// within the clipped screenshot.
const IN = { at: "tl", dx: 12, dy: 4 } as const;

const DRAWER: CalloutSpec = [
  {
    n: 1,
    label: "Create table",
    target: (p) => help(p, "new-measurement-table"),
    at: "right",
  },
  {
    n: 2,
    label: "Object measurements",
    target: (p) => help(p, "object-measurements"),
    cover: true,
    ...IN,
  },
  {
    n: 3,
    label: "Intensity measurements",
    target: (p) => help(p, "intensity-measurements"),
    cover: true,
    ...IN,
  },
];

const TABLE_TAB: CalloutSpec = [
  {
    n: 1,
    label: "Table tabs",
    target: (p) => help(p, "measurement-group-tabs"),
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Table | Plot view",
    target: (p) => help(p, "measurement-group-view"),
    at: "left",
  },
  {
    n: 3,
    label: "Export",
    target: (p) => docId(p, "export-data"),
    at: "left",
  },
  {
    n: 4,
    label: "Split options (pivot)",
    target: (p) => docId(p, "pivot-config"),
    cover: true,
    ...IN,
  },
  {
    n: 5,
    label: "Data grid",
    target: (p) => docId(p, "data-grid"),
    cover: true,
    ...IN,
  },
];

const PLOT_TAB: CalloutSpec = [
  {
    n: 1,
    label: "Plot controls",
    target: (p) => docId(p, "plot-config"),
    cover: true,
    ...IN,
  },
  {
    n: 2,
    label: "Plot",
    target: (p) => docId(p, "plot-canvas"),
    cover: true,
    ...IN,
  },
  {
    n: 3,
    label: "Plot tabs",
    target: (p) => p.getByRole("tab", { name: /^plot 1$/i }),
    at: "below",
  },
  {
    n: 4,
    label: "Save plot",
    target: (p) => docId(p, "save-plot"),
    at: "left",
  },
];

// --- State helpers ---------------------------------------------------------

const park = (page: Page) => page.mouse.move(700, 12);

async function tagAreas(page: Page) {
  for (const name of ["top-bar", "action-drawer", "dashboard"]) {
    await markGridArea(page, name);
  }
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

async function enterMeasurements(page: Page) {
  await help(page, "navigate-to-measurements").click();
  await page.waitForURL(/\/measurements/, { timeout: 15000 });

  await help(page, "new-measurement-table").click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: KIND, exact: true }).click();
  await dialog.getByRole("button", { name: /confirm/i }).click();
  await dialog.waitFor({ state: "hidden", timeout: 5000 });
  await page.waitForTimeout(1000);

  // Tick every measurement group, then expand them so the names show.
  for (const item of ["object-measurements", "intensity-measurements"]) {
    const group = help(page, item);
    await group.locator("input[type=checkbox]").first().click({ force: true });
    await group
      .locator('svg[data-testid="TreeViewExpandIconIcon"]')
      .first()
      .click()
      .catch(() => {});
  }
  await page.waitForTimeout(3000); // measurements compute
}

// --- Steps -----------------------------------------------------------------

async function drawer(ctx: ShotContext) {
  const { page, out } = ctx;
  await tagAreas(page);
  await park(page);
  await ctx.annotate("measurement drawer", DRAWER);
  await shootGridArea(page, "action-drawer", out("drawer"));
  await ctx.clearAnnotations();
}

async function tableTab(ctx: ShotContext) {
  const { page, out } = ctx;
  await showView(page, "table");
  await ctx.annotate("table tab", TABLE_TAB);
  await shootGridArea(page, "dashboard", out("table-tab"));
  await ctx.clearAnnotations();
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

// Drag a dimension into "Column Grouping" to show a pivoted table, then put it
// back. The pivot config is kept in the store, so a previous run (or theme)
// can leave "Category (all)" grouped; start from a clean state either way.
async function pivot(ctx: ShotContext) {
  const { page, out } = ctx;
  await showView(page, "table");
  const config = docId(page, "pivot-config");
  const available = config.getByText("Available Dimensions", { exact: true });
  const grouped = config.getByText("Category (all)", { exact: true }).first();

  if (await grouped.count()) await dragChip(page, grouped, available);

  const chip = config.getByText("Category", { exact: true }).first();
  const zone = config.getByText(/drag dimensions here/i).first();
  if (!(await dragChip(page, chip, zone))) {
    console.warn("  ! pivot: chip or drop zone not found - skipped");
    return;
  }
  await park(page);
  await shootGridArea(page, "dashboard", out("table-pivot"));

  await dragChip(page, grouped, available); // restore
  await park(page);
}

async function plotTab(ctx: ShotContext) {
  const { page, out } = ctx;
  await showView(page, "plot");
  // Histogram is the default plot; give it an x-axis so there is something to see.
  // The select's accessible name is its current value (e.g. "Area" once one is
  // chosen), so find it through its label's form control instead.
  await help(page, "measurement-plot-x-axis")
    .locator("xpath=..")
    .getByRole("combobox")
    .click();
  await page.getByRole("option").first().click();
  await page.waitForTimeout(1500);
  await park(page);
  await ctx.annotate("plot tab", PLOT_TAB);
  await shootGridArea(page, "dashboard", out("plot-tab"));
  await ctx.clearAnnotations();
  await showView(page, "table"); // leave the table showing
}

export const measurementsViewer: DocPage = {
  name: "measurements-viewer",
  project: { kind: "file", path: DEFAULT_PROJECT_FILE },
  setup: enterMeasurements,
  steps: [
    { name: "drawer", run: drawer },
    { name: "table-tab", run: tableTab },
    { name: "pivot", run: pivot },
    { name: "plot-tab", run: plotTab },
  ],
};
