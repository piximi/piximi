import { ColorAdjustmentOptionsType, ImageViewer } from "types";

export const selectColorAdjustments = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): ColorAdjustmentOptionsType => {
  return imageViewer.colorAdjustment;
};
