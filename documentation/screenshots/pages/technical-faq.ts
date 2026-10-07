// Pictures for the Technical FAQ (pages/technical/technical-faq.md): saving and
// opening projects and classifier models.
//
// The old FAQ pictures showed the computer's own file-picker, which the capture
// cannot photograph. They are replaced by what Piximi itself shows around it:
//   - opening a project: the Open > Project submenu (Upload .zarr / .zip / example)
//   - opening a model:   the "Successfully uploaded" window. The capture saves a
//     model through the Save dialog (catching the download) and uploads that
//     file straight into the hidden file input, so no picker is involved.
//
// Uses the same MNIST example project as the classifier page; `prepare` (shared
// with it) selects, or quickly fits, a classifier so Save Model is enabled.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { docId, help, learningTaskHeader } from "../lib/locators.ts";
import { shootFullPage, shootPadded, shootUnion } from "../lib/output.ts";
import { prepare } from "./classifier.ts";

import type { Page } from "playwright";

import type { CalloutSpec, DocPage, ShotContext } from "../lib/types.ts";

const dialog = (p: Page) => p.locator(".MuiDialog-paper").last();
const park = (page: Page) => page.mouse.move(1150, 12);

// Where the downloaded model is kept so the load step can upload it again.
const MODEL_ZIP = path.join(os.tmpdir(), "docs-faq-model.zip");

// --- Callouts --------------------------------------------------------------

const SAVE_BUTTON: CalloutSpec = [
  {
    n: 1,
    label: "Save",
    target: (p) => help(p, "save-project"),
    at: "below",
  },
];

const SAVE_PROJECT_DIALOG: CalloutSpec = [
  {
    n: 1,
    label: "Project file name",
    target: (p) => dialog(p).getByRole("textbox"),
    at: "left",
  },
  {
    n: 2,
    label: "Save Project",
    target: (p) => dialog(p).getByRole("button", { name: "Save Project" }),
    at: "left",
  },
];

const OPEN_MENU: CalloutSpec = [
  {
    n: 1,
    label: "Open",
    target: (p) => help(p, "open-menu"),
    at: "above",
  },
  {
    n: 2,
    label: "Project",
    target: (p) => help(p, "open-project"),
    at: "right",
  },
];

const OPEN_SUBMENU: CalloutSpec = [
  {
    n: 1,
    label: "Upload .zarr",
    target: (p) => p.getByRole("menuitem", { name: "Upload .zarr" }),
    at: "right",
  },
  {
    n: 2,
    label: "Upload .zip",
    target: (p) => p.getByRole("menuitem", { name: "Upload .zip" }),
    at: "right",
  },
  {
    n: 3,
    label: "Load Example",
    target: (p) => p.getByRole("menuitem", { name: "Load Example" }),
    at: "right",
  },
];

const MODEL_IO: CalloutSpec = [
  {
    n: 1,
    label: "Load Model",
    target: (p) => help(p, "load-classification-model"),
    at: "above",
  },
  {
    n: 2,
    label: "Save Model",
    target: (p) => help(p, "save-classification-model"),
    at: "above",
  },
];

const SAVE_MODEL_DIALOG: CalloutSpec = [
  {
    n: 1,
    label: "Model Name",
    target: (p) => dialog(p).getByRole("textbox"),
    at: "left",
  },
  {
    n: 2,
    label: "Save",
    target: (p) => dialog(p).getByRole("button", { name: "Save", exact: true }),
    at: "left",
  },
];

const LOAD_MODEL_DIALOG: CalloutSpec = [
  {
    n: 1,
    label: "Upload Local",
    target: (p) => dialog(p).getByRole("tab", { name: /upload local/i }),
    at: "above",
  },
  {
    n: 2,
    label: "Upload Model",
    target: (p) => dialog(p).getByRole("button", { name: /upload model/i }),
    at: "left",
  },
];

// --- Helpers ---------------------------------------------------------------

// Escape only closes a dialog while keyboard focus is inside it, and focus is
// lost when a modal on top of it (such as the upload result) closes. Fall back
// to clicking outside the dialog, and fail loudly if it still will not close:
// an open dialog hides the Settings button and breaks the next theme switch.
async function closeDialog(page: Page) {
  await page.keyboard.press("Escape");
  const closed = await dialog(page)
    .waitFor({ state: "hidden", timeout: 2000 })
    .then(() => true)
    .catch(() => false);
  if (!closed) {
    await page.mouse.click(5, 5);
    await dialog(page).waitFor({ state: "hidden", timeout: 5000 });
  }
  await page.waitForTimeout(400);
}

async function openDialog(page: Page, trigger: string) {
  await help(page, trigger).click();
  await dialog(page).waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(900); // slide-in transition
  await park(page);
}

// Open the Save Model dialog, optionally take its picture, then press Save and
// keep the downloaded zip for the load step.
async function saveModel(ctx: ShotContext, shoot: boolean) {
  const { page, out } = ctx;
  await prepare(page);
  await openDialog(page, "save-classification-model");
  if (shoot) {
    await ctx.annotate("save model", SAVE_MODEL_DIALOG);
    await shootPadded(page, dialog(page), {}, out("save-model-dialog"));
    await ctx.clearAnnotations();
  }
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 60000 }),
    dialog(page).getByRole("button", { name: "Save", exact: true }).click(),
  ]);
  await download.saveAs(MODEL_ZIP);
  await dialog(page)
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(400);
}

// Close the Open menu and its submenu. While a menu is open the rest of the app
// is hidden from the accessibility tree, so the next theme switch could not
// find the Settings button. Escape only works while focus is inside the menu
// (hovering moves it), so fall back to clicking the invisible backdrop.
async function closeMenus(page: Page) {
  const noMenu = () => !document.querySelector('[role="menu"]');
  await park(page);
  await page.keyboard.press("Escape");
  const closed = await page
    .waitForFunction(noMenu, null, { timeout: 2000 })
    .then(() => true)
    .catch(() => false);
  if (!closed) {
    await page.mouse.click(1150, 400);
    await page.waitForFunction(noMenu, null, { timeout: 5000 });
  }
  await page.waitForTimeout(400);
}

// --- Steps -----------------------------------------------------------------

async function saveProject(ctx: ShotContext) {
  const { page, out } = ctx;
  await park(page);
  await ctx.annotate("save button", SAVE_BUTTON);
  await shootFullPage(page, out("save-project"));
  await ctx.clearAnnotations();

  await openDialog(page, "save-project");
  await ctx.annotate("save project dialog", SAVE_PROJECT_DIALOG);
  await shootPadded(page, dialog(page), {}, out("save-project-dialog"));
  await ctx.clearAnnotations();
  await closeDialog(page); // Cancel: nothing is saved
}

async function openProject(ctx: ShotContext) {
  const { page, out } = ctx;
  await help(page, "open-menu").click();
  await help(page, "open-project").waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(500);
  await ctx.annotate("open menu", OPEN_MENU);
  await shootFullPage(page, out("open-menu"));
  await ctx.clearAnnotations();

  // The Project item's submenu is a tooltip that appears on hover. The shot
  // above switched on the style that hides every tooltip (for all other
  // captures), which would keep the submenu invisible, so switch it off again.
  await page.evaluate(() =>
    document.getElementById("__docs_hide_tooltips__")?.remove(),
  );
  await help(page, "open-project").hover();
  await page
    .getByRole("menuitem", { name: "Upload .zip" })
    .waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(500);
  await ctx.annotate("open project submenu", OPEN_SUBMENU);
  await shootFullPage(page, out("open-project-menu"), { keepTooltips: true });
  await ctx.clearAnnotations();

  await closeMenus(page);
}

async function modelIo(ctx: ShotContext) {
  const { page, out } = ctx;
  await prepare(page);
  await ctx.annotate("model i/o", MODEL_IO);
  await shootUnion(
    page,
    [learningTaskHeader(page), docId(page, "model-task-section")],
    { t: 4, b: 4, l: 4, r: 4 },
    out("model-io"),
  );
  await ctx.clearAnnotations();
}

async function saveModelStep(ctx: ShotContext) {
  await saveModel(ctx, true);
}

async function loadModel(ctx: ShotContext) {
  const { page, out } = ctx;
  await prepare(page);
  // Need a saved model to upload: save one now if the save step did not run.
  if (!fs.existsSync(MODEL_ZIP)) await saveModel(ctx, false);

  await openDialog(page, "load-classification-model");
  await ctx.annotate("load model", LOAD_MODEL_DIALOG);
  await shootPadded(page, dialog(page), {}, out("load-model-dialog"));
  await ctx.clearAnnotations();

  // Upload through the hidden input: same code path as choosing the file in
  // the picker, without the picker.
  await dialog(page).locator("#open-model-file").setInputFiles(MODEL_ZIP);
  await page
    .getByText(/successfully uploaded/i)
    .waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(600);
  await park(page);
  await shootFullPage(page, out("load-model-uploaded"));

  // The upload result is a modal on top of the dialog, so its Close is last.
  await page.getByRole("button", { name: "Close", exact: true }).last().click();
  await page.waitForTimeout(500);
  await closeDialog(page);
}

export const technicalFaq: DocPage = {
  name: "technical-faq",
  project: { kind: "example", name: "MNIST example project" },
  steps: [
    { name: "save-project", run: saveProject },
    { name: "open-project", run: openProject },
    { name: "model-io", run: modelIo },
    { name: "save-model", run: saveModelStep },
    { name: "load-model", run: loadModel },
  ],
};
