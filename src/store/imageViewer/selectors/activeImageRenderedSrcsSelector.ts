import { ImageViewer } from "types";

export const activeImageRenderedSrcsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<string> => {
  return imageViewer.activeImageRenderedSrcs;
};
