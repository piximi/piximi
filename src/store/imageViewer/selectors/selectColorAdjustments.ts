import { ColorAdjustmentOptionsType, ImageViewerStore } from "types";

export const selectColorAdjustments = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): ColorAdjustmentOptionsType => {
  return imageViewer.colorAdjustment;
};
