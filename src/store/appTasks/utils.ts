import type { AppTaskType } from "./types";

export const taskTypeDisplayLookup: Record<AppTaskType, string> = {
  "file-upload": "Uploading File",
  "project-load": "Uploading Project",
  "project-download": "Downloading Project",
  "image-classification": "Image Classification",
  "image-segmentation": "Image Segmentation",
  "model-load": "Loading Model",
  measurement: "Computing Measurements",
};
