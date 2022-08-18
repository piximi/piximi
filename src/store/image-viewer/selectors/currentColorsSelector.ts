import { Color, ImageViewer } from "types";

export const currentColorsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<Color> | undefined => {
  return imageViewer.currentColors;
};
