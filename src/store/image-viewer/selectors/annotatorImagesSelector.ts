import { ImageViewer, ShadowImageType } from "types";

export const annotatorImagesSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<ShadowImageType> => {
  return imageViewer.images;
};
