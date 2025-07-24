import { chromium } from "playwright";
import { test } from "vitest";
import { expect } from "@playwright/test";

test("Image Selection", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/");
  const documentationButton = page.getByTestId("open-example-project");
  await documentationButton.click();

  await expect(page.getByText("Image and Object Sets")).toBeVisible({
    timeout: 10000,
  });
  await page.getByText("Image and Object Sets").click();
  await page.getByText("Malaria infected human blood smears").click();

  await expect(page).toHaveURL(/\/project/);
  await page.getByText("deserializing image").waitFor({ state: "visible" });
  await page.getByText("deserializing image").waitFor({ state: "hidden" });

  const image = page.getByTestId(
    "grid-image-102e71cd-bd52-4adf-b2f4-315506fa19e6"
  );
  await expect(image).toBeVisible();

  await image.click();
});

test("Kind Switching", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/");
  const documentationButton = page.getByTestId("open-example-project");
  await documentationButton.click();

  await expect(page.getByText("Image and Object Sets")).toBeVisible({
    timeout: 10000,
  });
  await page.getByText("Image and Object Sets").click();
  await page.getByText("Malaria infected human blood smears").click();

  await expect(page).toHaveURL(/\/project/);
  await page.getByText("deserializing image").waitFor({ state: "visible" });
  await page.getByText("deserializing image").waitFor({ state: "hidden" });

  await page.getByText("Infected", { exact: true }).click();
  const image = page.getByTestId(
    "grid-image-17fc300b-ae23-4782-a592-efc4dd1a61da"
  );
  await expect(image).toBeVisible();
  await image.click();
});

test("Adding New Kind", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/");
  const documentationButton = page.getByTestId("open-example-project");
  await documentationButton.click();

  await expect(page.getByText("Image and Object Sets")).toBeVisible({
    timeout: 10000,
  });
  await page.getByText("Image and Object Sets").click();
  await page.getByText("Malaria infected human blood smears").click();

  await expect(page).toHaveURL(/\/project/);
  await page.getByText("deserializing image").waitFor({ state: "hidden" });

  await page.getByTestId("AddIcon").last().click();
  await page.getByText("New Kind").click();

  await page
    .getByTestId("create-kind-name-input")
    .locator("input")
    .fill("test kind");

  await page.getByText("Confirm").click();
  await expect(page.getByText("test kind")).toBeVisible();
});

test("Edit New Kind", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/");
  const documentationButton = page.getByTestId("open-example-project");
  await documentationButton.click();

  await expect(page.getByText("Image and Object Sets")).toBeVisible({
    timeout: 10000,
  });
  await page.getByText("Image and Object Sets").click();
  await page.getByText("Malaria infected human blood smears").click();

  await expect(page).toHaveURL(/\/project/);
  await page.getByText("deserializing image").waitFor({ state: "visible" });
  await page.getByText("deserializing image").waitFor({ state: "hidden" });

  const tab = page.getByRole("tab", { name: "Image" });
  await tab.hover();

  const editIcon = tab.locator('[data-testid="EditIcon"]');
  await expect(editIcon).toBeVisible();

  await editIcon.click();

  const input = tab.locator("input");
  await input.fill("test kind edited");
  await page.click("body");

  await expect(
    page.getByRole("tab", { name: "test kind edited" })
  ).toBeVisible();
});

test("Delete Kind", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/");
  const documentationButton = page.getByTestId("open-example-project");
  await documentationButton.click();

  await expect(page.getByText("Image and Object Sets")).toBeVisible({
    timeout: 10000,
  });
  await page.getByText("Image and Object Sets").click();
  await page.getByText("Malaria infected human blood smears").click();

  await expect(page).toHaveURL(/\/project/);
  await page.getByText("deserializing image").waitFor({ state: "visible" });
  await page.getByText("deserializing image").waitFor({ state: "hidden" });

  const tab = page.getByRole("tab", { name: "Uninfected" });
  await tab.hover();

  const deleteIcon = tab.locator('[data-testid="DeleteIcon"]').last();
  await expect(deleteIcon).toBeVisible();

  await deleteIcon.click();

  await expect(page.getByRole("tab", { name: "Uninfected" })).toHaveCount(0);
});
test("Select All", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/");
  const documentationButton = page.getByTestId("open-example-project");
  await documentationButton.click();

  await expect(page.getByText("Image and Object Sets")).toBeVisible({
    timeout: 10000,
  });
  await page.getByText("Image and Object Sets").click();
  await page.getByText("Malaria infected human blood smears").click();

  await expect(page).toHaveURL(/\/project/);
  await page.getByText("deserializing image").waitFor({ state: "hidden" });

  await page.getByTestId("select-all-button").hover();
  await expect(page.getByRole("tooltip")).toContainText(
    "Select all(control+a)"
  );

  await page.mouse.move(0, 0);

  await page.getByTestId("select-all-button").click();

  await expect(page.getByTestId("select-all-badge")).toContainText("1");
});

test("switch between count", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/");
  const documentationButton = page.getByTestId("open-example-project");
  await documentationButton.click();

  await page.getByText("Image and Object Sets").click();
  await page.getByText("Malaria infected human blood smears").click();

  await expect(page).toHaveURL(/\/project/);
  await page.getByText("deserializing image").waitFor({ state: "hidden" });

  await page.getByTestId("select-all-button").hover();
  await expect(page.getByRole("tooltip")).toContainText(
    "Select all(control+a)"
  );

  await page.mouse.move(0, 0);

  await page.getByTestId("select-all-button").click();

  await expect(page.getByTestId("select-all-badge")).toContainText("1");

  await page.getByText("Infected", { exact: true }).click();

  await expect(page.getByTestId("select-all-badge")).toContainText("1");
});

test("Opening Image Viewer", async (pagea) => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/");
  const documentationButton = page.getByTestId("open-example-project");
  await documentationButton.click();

  await expect(page.getByText("Image and Object Sets")).toBeVisible({
    timeout: 10000,
  });
  await page.getByText("Image and Object Sets").click();
  await page.getByText("Malaria infected human blood smears").click();

  await expect(page).toHaveURL(/\/project/);
  await page.getByText("deserializing image").waitFor({ state: "visible" });
  await page.getByText("deserializing image").waitFor({ state: "hidden" });

  await page.getByText("Infected", { exact: true }).click();
  const image = page.getByTestId(
    "grid-image-17fc300b-ae23-4782-a592-efc4dd1a61da"
  );
  await expect(image).toBeVisible();
  await image.click();

  const annotateButton = page.getByTestId("annotate-button");
  await expect(annotateButton).toBeVisible();

  await annotateButton.click();

  await expect(page).toHaveURL(/\/imageviewer/);
});
