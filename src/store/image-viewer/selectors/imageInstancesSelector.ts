import { ImageViewer, ShadowImageType } from "types";

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
