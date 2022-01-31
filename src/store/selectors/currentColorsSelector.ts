import { ImageViewer } from "../../types/ImageViewer";
import { Color } from "../../types/Color";

export const currentColorsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<Color> => {
  return imageViewer.currentColors;
};
