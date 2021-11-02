import { ImageViewer } from "../../types/ImageViewer";
export const stageScaleSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  return imageViewer.stageScale;
};
