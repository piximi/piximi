import { ImageViewer } from "../../types/ImageViewer";
import { ShadowImageType } from "../../types/ImageType";

export const imageInstancesSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  if (!imageViewer.images.length) return;

  const image = imageViewer.images.find((image: ShadowImageType) => {
    return image.id === imageViewer.activeImageId;
  });

  if (!image) return;

  return image.annotations;
};
