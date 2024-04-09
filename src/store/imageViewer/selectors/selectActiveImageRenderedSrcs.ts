import { ImageViewerState } from "store/types";

export const selectActiveImageRenderedSrcs = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): Array<string> => {
  return imageViewer.activeImageRenderedSrcs;
};
