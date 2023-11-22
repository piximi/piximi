import { ImageViewer } from "types";

export const selectActiveImageRenderedSrcs = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<string> => {
  return imageViewer.activeImageRenderedSrcs;
};
