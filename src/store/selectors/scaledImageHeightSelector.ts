import { ImageViewer } from "../../types/ImageViewer";
import { Image } from "../../types/Image";
import { Project } from "../../types/Project";

export const scaledImageHeightSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  if (!imageViewer.images.length) return;

  const image = imageViewer.images.filter((image: Image) => {
    return image.id === imageViewer.activeImageId;
  })[0];

  if (!image) return;

  return image.shape.height * imageViewer.stageScale;
};
