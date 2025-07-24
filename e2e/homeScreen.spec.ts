import { chromium } from "playwright";
import { test } from "vitest";
import { expect } from "playwright/test";

test("should load the homepage and have the correct title", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000");
  const startNewProjectButton1 = page.getByTestId("start-new-project");
  await expect(startNewProjectButton1).toHaveText("Start New Project");
});

test("Documenation", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://localhost:3000/");

  const documentationButton = page.getByTestId("documentation");
  await expect(documentationButton).toHaveAttribute(
    "href",
    "https://documentation.piximi.app"
  );

  const [newTab] = await Promise.all([
    page.context().waitForEvent("page"),
    documentationButton.click(),
  ]);

  await newTab.waitForLoadState();
  await expect(newTab).toHaveURL("https://documentation.piximi.app/intro.html");
});

test("Upload Project", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://localhost:3000/");
  const documentationButton = page.getByTestId("upload-project");
  await expect(documentationButton).toHaveText("Upload Project");
});

test("Open Example Project", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://localhost:3000/");
  const documentationButton = page.getByTestId("open-example-project");
  await expect(documentationButton).toHaveText("Open Example Project");
});
