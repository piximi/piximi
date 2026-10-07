import type { Page } from "playwright";
import type { Mode } from "./types.ts";

export const THEMES: Mode[] = ["Dark", "Light"];

// Switch the app theme via the Settings dialog. The app also starts in whatever
// colour scheme the browser prefers, so emulate that too: pages that reload
// mid-capture (or show the start screen, which has no Settings button) then
// come back in the right theme instead of the default light one.
export async function setTheme(page: Page, mode: Mode) {
  await page.emulateMedia({ colorScheme: mode === "Dark" ? "dark" : "light" });
  await page.getByRole("button", { name: "Settings" }).click();
  const themeButton = page.getByTestId(`${mode}ModeIcon`);
  await themeButton.waitFor({ state: "visible", timeout: 5000 });
  await themeButton.click();
  await page.keyboard.press("Escape");
  // MUI tooltips open on focus too, and MUI returns focus to the Settings
  // button when the dialog closes - blur it so no tooltip lingers.
  await page.evaluate(() =>
    (document.activeElement as HTMLElement | null)?.blur(),
  );
  await page.mouse.move(600, 350);
  await page.waitForTimeout(300); // let the theme transition settle
}
