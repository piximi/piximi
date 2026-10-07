# Docs screenshot tool

Regenerates the light/dark screenshots (and inline icons) used by the Piximi
documentation site by driving the running app with Playwright. Lives outside
`src/`, so it is never bundled or shipped.

## Run

```sh
pnpm start                      # terminal 1: dev server on :3000
pnpm docs:screenshots           # terminal 2: capture everything
```

Without the package script:
`node --experimental-strip-types documentation/screenshots/capture.mts`
(Node 22.18+ / 23.6+ can drop the flag.)

Images are written straight into the docs repo, which is expected to be a
sibling checkout named `piximi-documentation` (override with `DOCS_IMG_DIR`).

| Flag                  | Meaning                                             |
| --------------------- | --------------------------------------------------- |
| `--page <name>`       | capture only this page (repeatable)                 |
| `--only <step>`       | run only this step (repeatable)                     |
| `--theme dark\|light` | one theme instead of both                           |
| `--project <zip>`     | load this saved project instead of the page default |
| `--list`              | list pages and steps                                |

Env: `PIXIMI_URL`, `DOCS_IMG_DIR`, `DOCS_IMG_SCALE` (default 2),
`DOCS_WEBP_QUALITY` (default 92), `NO_ANNOTATE=1` (no badges),
`DOCS_SEGMENTER_MODEL` (regex choosing the segmenter page's model, e.g. `cellpose`; Cellpose-SAM needs WebGPU).
`DOCS_BROWSER_CHANNEL` (e.g. `chromium` for full Chromium in new headless mode, or `chrome` for your installed Chrome; needed for WebGPU) and `DOCS_HEADED=1` (show the browser window).
`DOCS_CLASSIFIER_EPOCHS` (epochs for the quick model the classifier page fits, default 3; the tutorial project has no trained classifier, so the page trains one on the labelled images first, which takes a few minutes).

Examples:

```sh
pnpm docs:screenshots --list
pnpm docs:screenshots --page project-viewer --only grid-annotations --theme dark
```

## Layout

```
capture.mts      entry point: flags, browser, loops pages x themes x steps
config.ts        URLs, paths, scale/quality, badge style
lib/             generic helpers (no knowledge of any one page)
  annotate.ts      numbered callout badges + legend
  locators.ts      area / help / svgIcon helpers, grid-area tagging
  output.ts        screenshot helpers (page, region, icon, popover), PNG -> WEBP
  popper.ts        open/close the toolbar poppers
  project.ts       open an example project or a saved .zip
  theme.ts         dark / light switching
  types.ts         shared types
pages/           one file per docs page / view
  index.ts         registry
  project-viewer.ts
  image-viewer.ts
  measurements-viewer.ts
  classifier.ts
  segmenter.ts
  eukaryotic-classification.ts   tutorial pages (see below)
  segmentation-tutorial.ts
  translocation-tutorial.ts
  creating-measurements.ts       how-to page, default project file (see below)
  technical-faq.ts               save/open pictures for the Technical FAQ
```

The three tutorial pages (`eukaryotic-classification`, `segmentation-tutorial`,
`translocation-tutorial`) start from an example project instead, because the
tutorial itself does, and their steps follow the tutorial text. The
translocation tutorial's steps build on each other (segment, then classify, then
fit), so run that page whole rather than with `--only`. The segmenting pages need
WebGPU: `DOCS_BROWSER_CHANNEL=chromium pnpm docs:screenshots --page translocation-tutorial`.

`creating-measurements` uses the default project file and measures its
`cellpose_cells` kind (set `DOCS_MEASURE_KIND` to a regex to pick another).
Its steps open the Measurements view and create the table on demand, so they
can also be run alone.

`technical-faq` uses the MNIST example project (like `classifier`) and never
photographs the computer's own file picker: it shows the Open > Project submenu,
and saves a model through the Save dialog and uploads it again to show the
"Successfully uploaded" window.

The other pages also load the saved tutorial project (`Piximi_Translocation_Tutorial-Docs.zip`),
which has annotated objects (a `cellpose_cells` kind) and trained classifiers.
A page can set `setup` to navigate into its view once before its steps run.

## Adding a page

1. Create `pages/<name>.ts` exporting a `DocPage`: `name` (also the `img/`
   subfolder), the `project` to load, and a list of `steps`.
2. Put the page's numbered-callout lists (`CalloutSpec`) in the same file.
3. Register it in `pages/index.ts`.

Each step must set up the state it needs (switch views, hover, select) and
leave the app usable, so any step can run alone with `--only`.

## Conventions

- Find elements by `data-help` first (`help(root, "kind-tabs")`), then a
  `data-doc` attribute (`docId(root, "image-list")`) added to the app for
  sections with no help item, then
  `data-testid`, then role/text. Values for `data-help` come from the
  `HelpItem` enum in `src/help/HelpContent.ts`.
- Callout numbers must match the numbered lists in the markdown. The legend is
  printed on the first theme of every run so you can check.
- Output names: `img/<page>/<page>-<dark|light>-<shot>.webp`, and inline icons
  as `img/icons/icon-<dark|light>-<name>.webp`.
- Type-check with `pnpm tsc -p documentation/screenshots`.
