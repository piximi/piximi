import { ImageViewer } from "types";

export const selectActiveImageId = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string | undefined => {
  return imageViewer.activeImageId;
};
