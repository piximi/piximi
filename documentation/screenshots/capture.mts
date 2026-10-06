// Docs screenshot tool for Piximi. See README.md.
//
//   node --experimental-strip-types documentation/screenshots/capture.mts [flags]
//   pnpm docs:screenshots [flags]

import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";

import { chromium } from "playwright";

import { ANNOTATE, BASE_URL, OUT_DIR, SCALE, VIEWPORT } from "./config.ts";
import { annotate, clearAnnotations, printLegend } from "./lib/annotate.ts";
import { openProject } from "./lib/project.ts";
import { THEMES, setTheme } from "./lib/theme.ts";
import { pages } from "./pages/index.ts";

import type { DocPage, Mode, ShotContext } from "./lib/types.ts";

const { values: flags } = parseArgs({
  options: {
    page: { type: "string", multiple: true },
    only: { type: "string", multiple: true },
    theme: { type: "string" },
    project: { type: "string" },
    list: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

function usage() {
  console.log(`Usage: capture.mts [flags]

  --page <name>     capture only this page (repeatable). Default: all
  --only <step>     run only this step within the page(s) (repeatable)
  --theme <t>       dark | light. Default: both
  --project <zip>   load this saved project instead of each page's default
  --list            list pages and steps
  -h, --help        show this help

Env: PIXIMI_URL, DOCS_IMG_DIR, DOCS_IMG_SCALE, DOCS_WEBP_QUALITY,
     NO_ANNOTATE=1`);
}

function listPages() {
  for (const p of pages) {
    console.log(`${p.name}: ${p.steps.map((s) => s.name).join(", ")}`);
  }
}

function selectPages(): DocPage[] {
  const wanted = flags.page;
  if (!wanted?.length) return pages;
  const unknown = wanted.filter((w) => !pages.some((p) => p.name === w));
  if (unknown.length) {
    throw new Error(
      `Unknown page(s): ${unknown.join(", ")}. Known: ${pages.map((p) => p.name).join(", ")}`,
    );
  }
  return pages.filter((p) => wanted.includes(p.name));
}

function selectThemes(): Mode[] {
  if (!flags.theme) return THEMES;
  const mode = THEMES.find(
    (t) => t.toLowerCase() === flags.theme!.toLowerCase(),
  );
  if (!mode)
    throw new Error(`--theme must be dark or light, got "${flags.theme}"`);
  return [mode];
}

async function main() {
  if (flags.help) return usage();
  if (flags.list) return listPages();

  const selected = selectPages();
  const themes = selectThemes();
  const only = flags.only;
  if (only?.length) {
    const known = new Set(selected.flatMap((p) => p.steps.map((s) => s.name)));
    const unknown = only.filter((o) => !known.has(o));
    if (unknown.length) {
      throw new Error(`Unknown step(s): ${unknown.join(", ")} (see --list)`);
    }
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
  });
  const page = await context.newPage();

  console.log(`Docs output dir: ${OUT_DIR}`);
  console.log(`App URL: ${BASE_URL}`);

  try {
    for (const docPage of selected) {
      const steps = docPage.steps.filter(
        (s) => !only?.length || only.includes(s.name),
      );
      if (!steps.length) continue;

      console.log(`== ${docPage.name} ==`);
      await openProject(
        page,
        flags.project
          ? { kind: "file", path: path.resolve(flags.project) }
          : docPage.project,
      );
      await docPage.setup?.(page);

      for (const [i, mode] of themes.entries()) {
        console.log(`-- ${mode} theme --`);
        await setTheme(page, mode);
        const suffix = mode.toLowerCase();
        const ctx: ShotContext = {
          page,
          mode,
          firstTheme: i === 0,
          out: (name) =>
            path.join(
              OUT_DIR,
              docPage.name,
              `${docPage.name}-${suffix}-${name}.png`,
            ),
          icon: (name) =>
            path.join(OUT_DIR, "icons", `icon-${suffix}-${name}.png`),
          annotate: async (title, spec) => {
            await annotate(page, mode, spec);
            if (i === 0 && ANNOTATE) printLegend(title, spec);
          },
          clearAnnotations: () => clearAnnotations(page),
        };
        for (const step of steps) {
          console.log(` [${step.name}]`);
          await step.run(ctx);
        }
      }
    }
  } finally {
    await browser.close();
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
