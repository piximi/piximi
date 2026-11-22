import type { AppTaskType } from "./types";

export const taskTypeDisplayLookup: Record<AppTaskType, string> = {
  "file-upload": "Image Upload",
  "project-load": "Uploading Project",
  "project-download": "Downloading Project",
  "classifier-download": "Downloading Classifiers",
  "classifier-clone": "Cloning Classifier",
  "image-classification": "Image Classification",
  "image-segmentation": "Image Segmentation",
  measurement: "Computing Measurements",
};
