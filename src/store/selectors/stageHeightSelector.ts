import { ImageViewer } from "../../types/ImageViewer";
export const stageHeightSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  return imageViewer.stageHeight;
};
