import { beforeEach, expect, test } from "vitest";
import { page } from "@vitest/browser/context";
import { render } from "vitest-browser-react";
import { productionStore } from "../src/store";
import { Application } from "../src/Application";
import { Provider } from "react-redux";

beforeEach(() => {
  render(
    <Provider store={productionStore}>
      <Application />
    </Provider>
  );
});

test("should load the homepage and have the correct title", async () => {
  const startNewProjectButton1 = page.getByTestId("start-new-project");

  await expect
    .element(startNewProjectButton1)
    .toHaveTextContent("Start New Project");

  //await startNewProjectButton1.click();
});

test("Documenation", async () => {
  const documentationButton = page.getByTestId("documentation");
  await expect
    .element(documentationButton)
    .toHaveAttribute("href", "https://documentation.piximi.app");
});

test("Upload Project", async () => {
  const documentationButton = page.getByTestId("upload-project");
  await expect.element(documentationButton).toHaveTextContent("Upload Project");
});

test("Open Example Project", async () => {
  const openExampleProjectButton = page.getByTestId("open-example-project");
  await expect
    .element(openExampleProjectButton)
    .toHaveTextContent("Open Example Project");
});
