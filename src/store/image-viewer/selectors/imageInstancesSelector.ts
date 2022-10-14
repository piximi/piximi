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
    const activeImageBufferedAnnotations = activeImage.annotations.map(
      (annotation) => {
        const { mask, ...buffered } = {
          maskData: Uint8Array.from(decode(annotation.mask)),
          ...annotation,
        };
        return buffered;
      }
    );
    return activeImageBufferedAnnotations;
  } else {
    return [];
  }
};
