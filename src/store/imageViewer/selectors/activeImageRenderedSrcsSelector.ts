import { ImageViewerStore } from "types";

export const activeImageRenderedSrcsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): Array<string> => {
  return imageViewer.activeImageRenderedSrcs;
};
