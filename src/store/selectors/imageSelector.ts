import { ImageViewer } from "../../types/ImageViewer";
import { Image } from "../../types/Image";
import { Project } from "../../types/Project";

export const imageSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  if (!imageViewer.images.length) return;

  const image = imageViewer.images.find((image: Image) => {
    return image.id === imageViewer.activeImageId;
  });

  if (!image) return;

  return image;
};
