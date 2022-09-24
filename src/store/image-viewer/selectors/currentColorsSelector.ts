import { Color, ImageViewer } from "types";

export const currentColorsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<Color> | undefined => {
  // TODO: image_data
  return imageViewer.currentColors;
};
