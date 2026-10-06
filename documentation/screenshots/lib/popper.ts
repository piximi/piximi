// Open / close the MUI poppers used by the toolbar buttons (PopperToolButton).
// Only one popper is open at a time; it renders as #transition-popper.

import type { Locator, Page } from "playwright";

const popper = (page: Page) => page.locator("#transition-popper");

// Click the toolbar button and wait for the popper and its fade-in.
export async function openPopper(page: Page, button: Locator) {
  await button.click();
  await popper(page).waitFor({ state: "visible", timeout: 3000 });
  await page.waitForTimeout(500);
}

// Close the open popper. Some poppers close on click-away and some only when
// their button is toggled, so click somewhere harmless first (`awayTarget`),
// then toggle the button if it is still open.
export async function closePopper(
  page: Page,
  button: Locator,
  awayTarget: Locator,
) {
  if (!(await popper(page).count())) return;
  await awayTarget.click();
  await page.waitForTimeout(500);
  if (await popper(page).count()) {
    await button.click();
    await page.waitForTimeout(500);
  }
}
