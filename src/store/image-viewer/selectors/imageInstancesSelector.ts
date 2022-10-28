import { ImageViewer, ShadowImageType } from "types";
import { decode } from "utils/annotator";

export const imageInstancesSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  if (!imageViewer.images.length) return [];

  const activeImage = imageViewer.images.find((image: ShadowImageType) => {
    return image.id === imageViewer.activeImageId;
  });
  if (activeImage) {
    return activeImage.annotations;
  } else {
    return [];
  }
};
