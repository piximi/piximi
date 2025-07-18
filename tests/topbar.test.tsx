import { expect, test } from "vitest";
import { page } from "@vitest/browser/context";
import { render } from "vitest-browser-react";
import { productionStore } from "../src/store";
import { Application } from "../src/Application";
import { Provider } from "react-redux";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { initStore } from "../src/store/productionStore";

// afterEach(() => {
//   cleanup();
// });

test("Kind Switching", async () => {
  const freshStore = initStore(undefined); // undefined will use the default preloadedState

  const kindSwitchPage = render(
    <Provider store={productionStore}>
      <DndProvider backend={HTML5Backend}>
        <Application />
      </DndProvider>
    </Provider>
  );

  const documentationButton = kindSwitchPage.getByTestId(
    "open-example-project"
  );
  await documentationButton.click();

  await expect
    .element(kindSwitchPage.getByText("Image and Object Sets"))
    .toBeVisible();
  await kindSwitchPage.getByText("Image and Object Sets").click();
  await kindSwitchPage.getByText("Malaria infected human blood smears").click();

  await kindSwitchPage.getByText("Infected", { exact: true }).click();
}, 10000);

test("Image Selection", async () => {
  const freshStore = initStore(undefined); // undefined will use the default preloadedState

  const imageSwitchPage = render(
    <Provider store={freshStore}>
      <DndProvider backend={HTML5Backend}>
        <Application />
      </DndProvider>
    </Provider>
  );

  const documentationButton = imageSwitchPage.getByTestId(
    "open-example-project"
  );
  await documentationButton.click();

  await expect
    .element(imageSwitchPage.getByText("Image and Object Sets"))
    .toBeVisible();
  await imageSwitchPage.getByText("Image and Object Sets").click();
  await imageSwitchPage
    .getByText("Malaria infected human blood smears")
    .click();

  await expect.element(page.getByText("Malaria infected")).toBeVisible();
  const image = page.getByTestId(
    "grid-image-102e71cd-bd52-4adf-b2f4-315506fa19e6"
  );
  await image.click();
}, 10000);
