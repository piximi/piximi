import { ImageViewer } from "types";
export const selectStageScale = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  return imageViewer.zoomOptions.scale;
};
