import { ImageViewer } from "../../types/ImageViewer";

export const dimensionOrderSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string => {
  return imageViewer.dimensionOrder;
};
