import { ImageViewer, ShadowImageType } from "types";

export const scaledImageHeightSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  if (!imageViewer.images.length) return;

  const image = imageViewer.images.find((image: ShadowImageType) => {
    return image.id === imageViewer.activeImageId;
  });

  if (!image) return;

  return image.shape.height * imageViewer.stageScale;
};
