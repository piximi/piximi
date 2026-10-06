// Project Viewer (docs page: pages/detail/projectviewer.md).
// Needs a project with annotations so the "Annotations" grid view and the
// Kind tabs exist.

import { DEFAULT_PROJECT_FILE } from "../config.ts";
import {
  setTransparentBackgrounds,
  shootFullPage,
  shootGridArea,
  shootIcon,
  shootPopover,
  shootRegion,
} from "../lib/output.ts";
import { closePopper, openPopper } from "../lib/popper.ts";
import {
  area,
  docId,
  help,
  iconButton,
  markGridArea,
  svgIcon,
} from "../lib/locators.ts";

import type { Page } from "playwright";

import type { CalloutSpec, DocPage, ShotContext } from "../lib/types.ts";

// --- Callout specs ---------------------------------------------------------
// One list per annotated image. The numbers must match the numbered lists in
// the markdown; the legend is printed on every run to check this.

const OVERVIEW: CalloutSpec = [
  {
    n: 1,
    label: "Project Name",
    target: (p) => area(p, "top-tools").getByRole("textbox"),
    at: "left",
    cover: true,
  },
  {
    n: 2,
    label: "Navigation",
    target: (p) => docId(p, "view-nav"),
    at: "left",
    cover: true,
  },
  {
    n: 3,
    label: "Action Drawer",
    target: (p) => area(p, "action-drawer"),
    at: "center",
    cover: true,
  },
  {
    n: 4,
    label: "Image/Object Grid",
    target: (p) => area(p, "image-grid"),
    at: "center",
    cover: true,
  },
];

const DRAWER: CalloutSpec = [
  {
    n: 1,
    label: "File I/O",
    target: (p) =>
      area(p, "action-drawer").getByText("File I/O", { exact: true }),
    at: "right",
  },
  {
    n: 2,
    label: "Learning Task",
    target: (p) =>
      area(p, "action-drawer").getByText("Learning Task", { exact: true }),
    at: "right",
  },
  {
    n: 3,
    label: "Categories",
    target: (p) =>
      area(p, "action-drawer").getByText("Categories", { exact: true }),
    at: "right",
  },
  {
    n: 4,
    label: "App Controls",
    target: (p) =>
      area(p, "action-drawer").getByRole("button", { name: "Send Feedback" }),
    at: "above",
  },
];

const IMAGE_GRID: CalloutSpec = [
  {
    n: 1,
    label: "View Switcher",
    target: (p) => help(p, "grid-view"),
    at: "left",
  },
  {
    n: 2,
    label: "Grid Actions",
    target: (p) => docId(p, "grid-actions"),
    at: "left",
  },
];

// The edit / minimize / delete icons on a kind tab only appear while the tab
// is hovered. We use the first tab that has an edit icon (the "Unknown"/image
// kind has no edit or delete).
const kindTabs = (p: Page) => help(p, "kind-tabs");
const hoverableKindTab = (p: Page) =>
  svgIcon(kindTabs(p), "EditIcon").first().locator("xpath=../..");

const KIND_TABS: CalloutSpec = [
  {
    n: 3,
    label: "Kind Tab",
    target: (p) => help(p, "kind-tabs"),
    at: "below",
  },
  {
    n: 4,
    label: "Kind Action",
    target: (p) => svgIcon(hoverableKindTab(p), "EditIcon"),
    at: "left",
  },
  {
    n: 5,
    label: "Create / show kinds",
    target: (p) => help(p, "add-kind-tab"),
    at: "below",
  },
];

// --- Shared state helpers --------------------------------------------------

// Toggle the project grid between the "Images" and "Annotations" views.
async function switchGridView(page: Page, view: "Images" | "Annotations") {
  await page.getByRole("button", { name: view, exact: true }).click();
  await page.mouse.move(600, 350);
  await page.waitForTimeout(500);
}

// The Grid Actions toolbar is the absolutely positioned box holding the
// select-all button; it has no grid-area of its own, so find it from there.
async function markGridActions(page: Page) {
  await page.evaluate(() => {
    const start = document.querySelector('[data-testid="select-all-button"]');
    let el = start && start.parentElement;
    while (el && el !== document.body) {
      const s = getComputedStyle(el);
      if (s.position === "absolute" && s.right === "0px") {
        el.setAttribute("data-docs-area", "gridactions");
        return;
      }
      el = el.parentElement;
    }
  });
}

// Annotations view, with the regions we shoot tagged for locators/clipping.
async function prepareAnnotationsView(page: Page) {
  await switchGridView(page, "Annotations");
  await markGridArea(page, "top-tools");
  await markGridArea(page, "action-drawer");
  await markGridArea(page, "image-grid");
  await markGridActions(page);
}
// Images view, with the regions we shoot tagged for locators/clipping.
async function prepareImagesView(page: Page) {
  await switchGridView(page, "Images");
  await markGridArea(page, "top-tools");
  await markGridArea(page, "action-drawer");
  await markGridArea(page, "image-grid");
  await markGridActions(page);
}

async function hoverKindTab(page: Page) {
  const box = await svgIcon(kindTabs(page), "EditIcon").first().boundingBox();
  if (!box) {
    console.warn("  ! no editable kind tab found to hover");
    return;
  }
  // The icons are visibility:hidden until hover, so the pointer lands on the
  // tab itself, which triggers the :hover styles that reveal them.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(250);
}

// --- Steps -----------------------------------------------------------------

async function gridImages(ctx: ShotContext) {
  const { page, out } = ctx;
  await switchGridView(page, "Images");
  await markGridArea(page, "image-grid");
  await ctx.annotate("image-grid", IMAGE_GRID);
  await shootGridArea(page, "image-grid", out("maingrid-images"));
  await ctx.clearAnnotations();
}

async function overview(ctx: ShotContext) {
  const { page, out } = ctx;
  await prepareImagesView(page);
  await ctx.annotate("overview", OVERVIEW);
  await shootFullPage(page, out("annotated"));
  await ctx.clearAnnotations();
}

// Annotations-view grid with the Kind tabs called out. One tab is hovered so
// its hover-only actions (edit / minimize / delete) are visible.
async function gridAnnotations(ctx: ShotContext) {
  const { page, out } = ctx;
  await prepareAnnotationsView(page);
  await hoverKindTab(page);
  await ctx.annotate("kind tabs", KIND_TABS);
  await shootGridArea(page, "image-grid", out("maingrid-annotations"));
  await ctx.clearAnnotations();
}

async function drawer(ctx: ShotContext) {
  const { page, out } = ctx;
  await prepareAnnotationsView(page);
  await ctx.annotate("projectdrawer", DRAWER);
  await shootGridArea(page, "action-drawer", out("projectdrawer"));
  await ctx.clearAnnotations();
}

async function gridActions({ page, out }: ShotContext) {
  await prepareAnnotationsView(page);
  await shootRegion(page, "gridactions", 0, out("gridactions"));
}

// Individual icons for inline use in the docs text.
async function icons({ page, icon }: ShotContext) {
  await prepareAnnotationsView(page);
  const actions = area(page, "gridactions");
  const drawerArea = area(page, "action-drawer");
  // Park the pointer on empty space so nothing is hovered or has a tooltip.
  const park = () => page.mouse.move(600, 350);

  // Nothing selected: these buttons are all enabled in this state.
  await park();
  await setTransparentBackgrounds(page, true);
  await shootIcon(
    page,
    svgIcon(actions, "FilterAltOutlinedIcon"),
    icon("sort-filter"),
  );
  await shootIcon(
    page,
    svgIcon(actions, "HighlightAltOutlinedIcon"),
    icon("select-all"),
  );
  await shootIcon(page, svgIcon(actions, "DeselectIcon"), icon("deselect-all"));
  await shootIcon(page, svgIcon(actions, "ZoomInIcon"), icon("grid-zoom"));
  await shootIcon(
    page,
    drawerArea
      .getByTestId("new-category-create-button")
      .locator("xpath=descendant-or-self::svg"),
    icon("add-category"),
  );
  await shootIcon(
    page,
    help(page, "add-kind-tab").locator("svg"),
    icon("add-kind"),
  );
  await setTransparentBackgrounds(page, false);

  // Categorize and Delete are greyed out until something is selected, so
  // select everything to capture them in their normal enabled look.
  await page.getByTestId("select-all-button").click();
  await park();
  await page.waitForTimeout(300);
  await setTransparentBackgrounds(page, true);
  await shootIcon(
    page,
    svgIcon(actions, "LabelOutlinedIcon"),
    icon("categorize"),
  );
  await shootIcon(
    page,
    svgIcon(actions, "DeleteIcon"),
    icon("delete-selected"),
  );
  await setTransparentBackgrounds(page, false);

  // Leave the app as we found it.
  await iconButton(actions, "DeselectIcon").click();
  await park();
  await page.waitForTimeout(300);
}

// The Sort | Filter and Categorize popovers, in both grid views (their content
// differs between Images and Annotations). Only the popover is captured.
async function popovers({ page, out }: ShotContext) {
  for (const view of ["Images", "Annotations"] as const) {
    await switchGridView(page, view);
    await markGridActions(page);
    const slug = view.toLowerCase();
    const actions = area(page, "gridactions");
    // Harmless click target for closing click-away poppers.
    const awayTarget = page
      .locator("[data-docs-area='action-drawer']")
      .getByText("Learning Task", { exact: true });
    await markGridArea(page, "action-drawer");

    const sortFilter = iconButton(actions, "FilterAltOutlinedIcon");
    await openPopper(page, sortFilter);
    await shootPopover(page, out(`sortfilter-${slug}`));
    await closePopper(page, sortFilter, awayTarget);

    // Categorize is disabled until something is selected.
    await page.getByTestId("select-all-button").click();
    const categorize = iconButton(actions, "LabelOutlinedIcon");
    await openPopper(page, categorize);
    await shootPopover(page, out(`categorize-${slug}`));
    await closePopper(page, categorize, awayTarget);

    await iconButton(actions, "DeselectIcon").click();
    await page.mouse.move(600, 350);
  }
}

export const projectViewer: DocPage = {
  name: "project-viewer",
  project: { kind: "file", path: DEFAULT_PROJECT_FILE },
  steps: [
    { name: "overview", run: overview },
    { name: "grid-images", run: gridImages },
    { name: "grid-annotations", run: gridAnnotations },
    { name: "drawer", run: drawer },
    { name: "gridactions", run: gridActions },
    { name: "popovers", run: popovers },
    { name: "icons", run: icons },
  ],
};
