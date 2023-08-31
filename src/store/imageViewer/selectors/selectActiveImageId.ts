import { ImageViewerStore } from "types";

export const selectActiveImageId = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): string | undefined => {
  return imageViewer.activeImageId;
};
