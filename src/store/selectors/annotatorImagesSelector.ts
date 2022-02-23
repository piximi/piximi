import { ImageType } from "../../types/ImageType";
import { ImageViewer } from "../../types/ImageViewer";

export const annotatorImagesSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<ImageType> => {
  return imageViewer.images;
};
