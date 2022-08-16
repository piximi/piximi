import { ImageViewer } from "types";
export const stageWidthSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  return imageViewer.stageWidth;
};
