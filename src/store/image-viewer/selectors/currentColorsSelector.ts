import { ImageViewer } from "types";
import { Colors } from "types/tensorflow";

export const currentColorsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Colors | undefined => {
  return imageViewer.currentColors;
};
