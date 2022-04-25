import { ImageViewer } from "../../types/ImageViewer";

export const activeImageRenderedSrcsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<string> => {
  return imageViewer.activeImageRenderedSrcs;
};
