import { ImageViewer } from "../../types/ImageViewer";
import { ShadowImageType } from "../../types/ImageType";

export const imageInstancesSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  if (!imageViewer.images.length) return [];

  const activeImage = imageViewer.images.find((image: ShadowImageType) => {
    return image.id === imageViewer.activeImageId;
  });

  return activeImage ? activeImage?.annotations : [];
};
