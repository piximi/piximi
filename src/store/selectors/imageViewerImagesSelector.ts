import { ImageType } from "../../types/ImageType";
import { ImageViewer } from "../../types/ImageViewer";

export const imageViewerImagesSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<ImageType> => {
  return imageViewer.images;
};
