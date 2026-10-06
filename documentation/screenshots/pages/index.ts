// Registry of every page the tool can capture. To add a view: create
// pages/<name>.ts exporting a DocPage and add it here.

import { classifier } from "./classifier.ts";
import { imageViewer } from "./image-viewer.ts";
import { measurementsViewer } from "./measurements-viewer.ts";
import { projectViewer } from "./project-viewer.ts";
import { segmenter } from "./segmenter.ts";

import type { DocPage } from "../lib/types.ts";

export const pages: DocPage[] = [
  projectViewer,
  imageViewer,
  measurementsViewer,
  classifier,
  segmenter,
];
