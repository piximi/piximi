import { ImageViewerState } from "store/types";
import { ColorAdjustmentOptionsType } from "utils/annotator/types";

export const selectColorAdjustments = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): ColorAdjustmentOptionsType => {
  return imageViewer.colorAdjustment;
};
