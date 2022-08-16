import { ImageViewer } from "types";
export const stageHeightSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  return imageViewer.stageHeight;
};
