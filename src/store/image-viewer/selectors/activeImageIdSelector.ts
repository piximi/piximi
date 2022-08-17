import { ImageViewer } from "types";

export const activeImageIdSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string | undefined => {
  return imageViewer.activeImageId;
};
