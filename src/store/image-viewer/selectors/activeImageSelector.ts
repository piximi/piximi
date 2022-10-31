import { ImageViewer, ShadowImageType } from "types";

export const activeImageSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): ShadowImageType | undefined => {
  if (!imageViewer.activeImageId) return undefined;
  return imageViewer.images.find(
    (image) => image.id === imageViewer.activeImageId
  );
};
