import type { Locator, Page } from "playwright";

export type Mode = "Dark" | "Light";

// Where a numbered badge sits relative to its target element.
export type Placement = "tl" | "left" | "right" | "above" | "below" | "center";

// One numbered callout. `target` is resolved fresh on every run, so a moved or
// restyled control is re-badged automatically.
export type CalloutSpec = Array<{
  n: number;
  label: string;
  target: (page: Page) => Locator;
  at: Placement;
  // Optional nudge (px) applied after placement, e.g. to stagger neighbours.
  dx?: number;
  dy?: number;
  cover?: boolean;
  color?: string;
}>;

// How a page gets its project loaded before capturing.
export type ProjectSource =
  | { kind: "example"; tab?: string; name: string }
  | { kind: "file"; path: string };

// Handed to every step. `out`/`icon` resolve output paths; `annotate` draws the
// callouts for a spec (a no-op under NO_ANNOTATE) and prints its legend once.
export interface ShotContext {
  page: Page;
  mode: Mode;
  firstTheme: boolean;
  out: (name: string) => string;
  icon: (name: string) => string;
  annotate: (title: string, spec: CalloutSpec) => Promise<void>;
  clearAnnotations: () => Promise<void>;
}

// A named group of shots. Steps are independent (each sets up the state it
// needs), so any one can be run alone with `--only <step>`.
export interface Step {
  name: string;
  run: (ctx: ShotContext) => Promise<void>;
}

// One docs page / app view. `name` is the CLI id and the img/ subfolder.
export interface DocPage {
  name: string;
  project: ProjectSource;
  // Optional: navigate from the project view into this page's view (runs once,
  // after the project loads and before any step).
  setup?: (page: Page) => Promise<void>;
  steps: Step[];
}
