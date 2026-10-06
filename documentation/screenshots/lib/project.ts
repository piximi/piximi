import fs from "node:fs";

import { BASE_URL } from "../config.ts";

import type { Page } from "playwright";
import type { ProjectSource } from "./types.ts";

async function waitForProjectLoad(page: Page) {
  await page
    .getByText("deserializing image")
    .waitFor({ state: "visible", timeout: 3000 })
    .catch(() => {});
  await page
    .getByText("deserializing image")
    .waitFor({ state: "hidden", timeout: 30000 })
    .catch(() => {});
  await page.waitForURL(/\/project/, { timeout: 30000 });
  await page.waitForTimeout(500);
}

// Open an example project from the "Open Example Project" dialog. `tab`
// optionally switches dialog tabs first (e.g. "Image and Object Sets").
async function openExampleProject(
  page: Page,
  source: { tab?: string; name: string },
) {
  await page.goto(BASE_URL);
  await page.getByTestId("open-example-project").click();
  if (source.tab) {
    await page.getByRole("tab", { name: new RegExp(source.tab, "i") }).click();
  }
  await page.getByText(new RegExp(source.name, "i")).first().click();
  await waitForProjectLoad(page);
}

// Load a saved project (.zip) via the Welcome screen's hidden file input.
async function openProjectFile(page: Page, filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Project file not found: ${filePath}`);
  }
  await page.goto(BASE_URL);
  await page
    .getByTestId("upload-project")
    .locator('input[type="file"]')
    .setInputFiles(filePath);
  await waitForProjectLoad(page);
}

export async function openProject(page: Page, source: ProjectSource) {
  if (source.kind === "file") return openProjectFile(page, source.path);
  return openExampleProject(page, source);
}
