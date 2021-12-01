import { Image } from "../../types/Image";
import { ImageViewer } from "../../types/ImageViewer";

export const annotatorImagesSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<Image> => {
  return imageViewer.images;
};
