import { ImageViewer } from "../../types/ImageViewer";

export const activeImageIdSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string | undefined => {
  return imageViewer.activeImageId;
};
