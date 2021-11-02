import { ImageViewer } from "../../types/ImageViewer";
export const invertModeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): boolean => {
  return imageViewer.invertMode;
};
