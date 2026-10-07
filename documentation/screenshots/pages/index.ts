// Registry of every page the tool can capture. To add a view: create
// pages/<name>.ts exporting a DocPage and add it here.

import { annotationTools } from "./annotation-tools.ts";
import { classifier } from "./classifier.ts";
import { creatingMeasurements } from "./creating-measurements.ts";
import { eukaryoticClassification } from "./eukaryotic-classification.ts";
import { imageViewer } from "./image-viewer.ts";
import { measurementsViewer } from "./measurements-viewer.ts";
import { projectViewer } from "./project-viewer.ts";
import { segmentationTutorial } from "./segmentation-tutorial.ts";
import { segmenter } from "./segmenter.ts";
import { technicalFaq } from "./technical-faq.ts";
import { translocationTutorial } from "./translocation-tutorial.ts";

import type { DocPage } from "../lib/types.ts";

export const pages: DocPage[] = [
  projectViewer,
  imageViewer,
  measurementsViewer,
  classifier,
  segmenter,
  eukaryoticClassification,
  segmentationTutorial,
  translocationTutorial,
  creatingMeasurements,
  technicalFaq,
  annotationTools,
];
