import { ImageViewer } from "types";
export const stageScaleSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  return imageViewer.stageScale;
};
