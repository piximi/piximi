// Numbered callout badges. `annotate` draws them over the live page just before
// a screenshot; positions come from the targets' bounding boxes. The number <->
// control mapping lives in each page's CalloutSpec, and `printLegend` echoes it
// so the markdown list can be checked against the badges.

import { ANNOTATE, BADGE, COLORS } from "../config.ts";

import type { Page } from "playwright";

import type { CalloutSpec, Mode, Placement } from "./types.ts";

interface Placed {
  n: number;
  box: { x: number; y: number; width: number; height: number };
  at: Placement;
  dx: number;
  dy: number;
  cover: boolean;
}

export async function annotate(page: Page, mode: Mode, spec: CalloutSpec) {
  if (!ANNOTATE) return;
  const placed: Placed[] = [];
  for (const { n, label, target, at, dx = 0, dy = 0, cover = false } of spec) {
    const loc = target(page).first();
    let box = null;
    try {
      await loc.waitFor({ state: "visible", timeout: 2000 });
      box = await loc.boundingBox();
    } catch {
      // handled below
    }
    if (!box) {
      console.warn(`  ! callout ${n} (${label}): target not found - skipped`);
      continue;
    }
    placed.push({ n, box, at, dx, dy, cover });
  }
  await page.evaluate(
    ({ placed, size, margin, mode, colors }) => {
      document.getElementById("__docs_annotations__")?.remove();
      const root = document.createElement("div");
      root.id = "__docs_annotations__";
      root.style.cssText =
        "position:fixed;inset:0;pointer-events:none;z-index:2147483647;";

      for (const { n, box, at, dx, dy, cover } of placed) {
        let x: number, y: number;
        switch (at) {
          case "right":
            x = box.x + box.width + margin;
            y = box.y + box.height / 2 - size / 2;
            break;
          case "below":
            x = box.x + box.width / 2 - size / 2;
            y = box.y + box.height + margin;
            break;
          case "above":
            x = box.x + box.width / 2 - size / 2;
            y = box.y - size - margin;
            break;
          case "left":
            x = box.x - size - margin;
            y = box.y + box.height / 2 - size / 2;
            break;
          case "center":
            x = box.x + box.width / 2 - size / 2;
            y = box.y + box.height / 2 - size / 2;
            break;
          default:
            x = box.x - margin;
            y = box.y - margin;
        }
        x = Math.max(margin, x + dx);
        y = Math.max(margin, y + dy);
        const colorIdx = (n - 1) % colors.length;
        const b = document.createElement("div");
        b.textContent = String(n);
        b.style.cssText = [
          "position:absolute",
          `left:${x}px`,
          `top:${y}px`,
          `width:${size}px`,
          `height:${size}px`,
          "border-radius:50%",
          `background:${colors[colorIdx]}`,
          "color:#fff",
          `border:2px solid ${mode === "Dark" ? "#fff" : "#000"}`,
          `box-shadow:0px 2px 4px ${mode === "Dark" ? "rgba(255,255,255,.45)" : "rgba(0,0,0,.45)"}`,
          "box-sizing:border-box",
          "display:flex",
          "align-items:center",
          "justify-content:center",
          "font:700 12px/1 system-ui,sans-serif",
          "z-index:1000",
        ].join(";");
        root.appendChild(b);
        if (cover) {
          // Translucent rect over the section, clamped to the viewport.
          const left = Math.max(0, box.x - margin);
          const top = Math.max(0, box.y - margin);
          const right = box.x + box.width + margin;
          const bottom = box.y + box.height + margin;
          const c = document.createElement("div");
          c.style.cssText = [
            "position:absolute",
            `left:${left}px`,
            `top:${top}px`,
            `width:${right - left}px`,
            `height:${bottom - top}px`,
            "border-radius:4px",
            `background:${colors[colorIdx]}`,
            "opacity:30%",
            "box-sizing:border-box",
            "z-index:999",
          ].join(";");
          root.appendChild(c);
        }
      }
      document.body.appendChild(root);
    },
    {
      placed,
      size: BADGE.size,
      colors: COLORS,
      margin: BADGE.margin,
      mode,
    },
  );
}

export async function clearAnnotations(page: Page) {
  await page.evaluate(() =>
    document.getElementById("__docs_annotations__")?.remove(),
  );
}

export function printLegend(title: string, spec: CalloutSpec) {
  console.log(`  legend - ${title}:`);
  for (const { n, label } of spec) console.log(`    ${n}. ${label}`);
}
