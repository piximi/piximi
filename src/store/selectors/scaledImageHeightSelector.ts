import { ImageViewer } from "../../types/ImageViewer";
import { ImageType } from "../../types/ImageType";

export const scaledImageHeightSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  if (!imageViewer.images.length) return;

  const image = imageViewer.images.filter((image: ImageType) => {
    return image.id === imageViewer.activeImageId;
  })[0];

  if (!image) return;

  return image.shape.height * imageViewer.stageScale;
};
