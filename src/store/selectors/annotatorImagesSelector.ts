import { ShadowImageType } from "types/ImageType";
import { ImageViewer } from "../../types/ImageViewer";

export const annotatorImagesSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<ShadowImageType> => {
  return imageViewer.images;
};
