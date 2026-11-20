import type { ModelDescriptor, SegmentationModelDescriptor } from "./types";

/* A listed model that segments, with the policy that says how. */
export const isSegmentationModel = (
  model: ModelDescriptor,
): model is SegmentationModelDescriptor =>
  model.outputPolicy !== undefined && model.tasks.includes("segmentation");
