import { Image } from "../../types/Image";
import { ImageViewer } from "../../types/ImageViewer";

export const imageViewerImagesSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<Image> => {
  return imageViewer.images;
};
