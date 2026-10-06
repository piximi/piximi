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

| Flag | Meaning |
| --- | --- |
| `--page <name>` | capture only this page (repeatable) |
| `--only <step>` | run only this step (repeatable) |
| `--theme dark\|light` | one theme instead of both |
| `--project <zip>` | load this saved project instead of the page default |
| `--list` | list pages and steps |

Env: `PIXIMI_URL`, `DOCS_IMG_DIR`, `DOCS_IMG_SCALE` (default 2),
`DOCS_WEBP_QUALITY` (default 92), `NO_ANNOTATE=1` (no badges), .

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
```

## Adding a page

1. Create `pages/<name>.ts` exporting a `DocPage`: `name` (also the `img/`
   subfolder), the `project` to load, and a list of `steps`.
2. Put the page's numbered-callout lists (`CalloutSpec`) in the same file.
3. Register it in `pages/index.ts`.

Each step must set up the state it needs (switch views, hover, select) and
leave the app usable, so any step can run alone with `--only`.

## Conventions

- Find elements by `data-help` first (`help(root, "kind-tabs")`), then
  `data-testid`, then role/text. Values for `data-help` come from the
  `HelpItem` enum in `src/help/HelpContent.ts`.
- Callout numbers must match the numbered lists in the markdown. The legend is
  printed on the first theme of every run so you can check.
- Output names: `img/<page>/<page>-<dark|light>-<shot>.webp`, and inline icons
  as `img/icons/icon-<dark|light>-<name>.webp`.
- Type-check with `pnpm tsc -p documentation/screenshots`.
