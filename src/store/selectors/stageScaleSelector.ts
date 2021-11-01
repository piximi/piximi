import { ImageViewer } from "../../types/ImageViewer";
export const stageScaleSelector = (imageViewer: ImageViewer): number => {
  return imageViewer.stageScale;
};
