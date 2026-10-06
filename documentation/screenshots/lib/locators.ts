// Small helpers for finding things in the app. Prefer, in order: data-help
// (stable, tied to the in-app help system), data-testid, then role/text.

import type { Locator, Page } from "playwright";

// Elements tagged by markGridArea/markSelector below.
export const area = (page: Page, name: string) =>
  page.locator(`[data-docs-area="${name}"]`);

// data-help attribute values come from the HelpItem enum in src/help/HelpContent.ts.
export const help = (root: Page | Locator, item: string) =>
  root.locator(`[data-help="${item}"]`);

// data-doc attribute values come from the component.
export const docId = (root: Page | Locator, item: string) =>
  root.locator(`[data-doc="${item}"]`);

export const svgIcon = (root: Page | Locator, testId: string) =>
  root.locator(`svg[data-testid="${testId}"]`);

export const iconButton = (root: Page | Locator, testId: string) =>
  root.locator(`button:has([data-testid="${testId}"])`);

// Tag the element holding a CSS grid-area with data-docs-area, so locators can
// be scoped to it. Matching on computed style survives styling refactors as
// long as the named grid areas stay the same.
export async function markGridArea(page: Page, areaName: string) {
  return page.evaluate((name) => {
    for (const el of document.querySelectorAll("body *")) {
      if (getComputedStyle(el).gridArea.replace(/\s/g, "") === name) {
        el.setAttribute("data-docs-area", name);
        return true;
      }
    }
    return false;
  }, areaName);
}

// Tag any element (by CSS selector) as data-docs-area="<name>".
export async function markSelector(page: Page, selector: string, name: string) {
  return page.evaluate(
    ({ selector, name }) => {
      const el = document.querySelector(selector);
      if (!el) return false;
      el.setAttribute("data-docs-area", name);
      return true;
    },
    { selector, name },
  );
}
