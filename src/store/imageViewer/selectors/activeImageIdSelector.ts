import { ImageViewerStore } from "types";

export const activeImageIdSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): string | undefined => {
  return imageViewer.activeImageId;
};
