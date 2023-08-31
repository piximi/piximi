import { ImageViewerStore } from "types";

export const selectActiveImageRenderedSrcs = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): Array<string> => {
  return imageViewer.activeImageRenderedSrcs;
};
