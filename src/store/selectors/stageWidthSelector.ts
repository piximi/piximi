import { ImageViewer } from "../../types/ImageViewer";
export const stageWidthSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  return imageViewer.stageWidth;
};
