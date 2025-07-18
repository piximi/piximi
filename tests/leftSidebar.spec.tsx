// test('should open menu when Open button is clicked', async () => {
//     const browser = await chromium.launch();
//     const context = await browser.newContext();
//     const page = await context.newPage();

//     await page.goto('http://localhost:3000/project');
//     const openButton = page.getByRole('button', { name: /open/i });

//     await expect(openButton).toBeVisible();
//     await expect(openButton).toBeEnabled();

//     const menu = page.locator('[role="menu"]').first();
//     await expect(menu).not.toBeVisible();

//     await openButton.click();

//     await expect(menu).toBeVisible();

//     const projectMenuItem = page.getByRole('menuitem', { name: /project/i });
//     const imageMenuItem = page.getByRole('menuitem', { name: /image/i });
//     const annotationMenuItem = page.getByRole('menuitem', { name: /annotation/i });

//     await expect(projectMenuItem).toBeVisible();
//     await expect(imageMenuItem).toBeVisible();
//     await expect(annotationMenuItem).toBeVisible();

// });

import { beforeEach, expect, test } from "vitest";
import { page, userEvent } from "@vitest/browser/context";
import { render } from "vitest-browser-react";
import { productionStore } from "../src/store";
import { Application } from "../src/Application";

import { DndProvider } from "react-dnd";
import { Provider } from "react-redux";
import { HTML5Backend } from "react-dnd-html5-backend";

test("Start New Project", async () => {
  render(
    <Provider store={productionStore}>
      <DndProvider backend={HTML5Backend}>
        <Application />
      </DndProvider>
    </Provider>
  );
  const startNewProjectButton1 = page.getByTestId("start-new-project");
  await startNewProjectButton1.click();

  const newButton = page.getByRole("button", { name: "New" });
  await expect.element(newButton).toBeVisible();
  await newButton.click();

  const dialog = page.getByTestId("new-project-name-dialog");
  await expect.element(dialog).toBeVisible();

  await dialog.getByRole("textbox").fill("Test Project Piximi");
  const createButton = dialog.getByRole("button", { name: /create/i });
  await createButton.click();

  const confirmReplaceDialogBox = page.getByTestId("confirm-replace-dialog");
  const confirmDialogConfirmButton = confirmReplaceDialogBox.getByRole(
    "button",
    { name: /confirm/i }
  );
  await confirmDialogConfirmButton.click();
  await expect.element(confirmReplaceDialogBox).not.toBeInTheDocument();

  // await expect
  //   .element(page.getByText("Test Project Piximi"))
  //   .toBeInTheDocument();
});
