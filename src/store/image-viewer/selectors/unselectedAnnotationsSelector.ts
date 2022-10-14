import {
  bufferedAnnotationType,
  encodedAnnotationType,
  ImageViewer,
  ShadowImageType,
} from "types";
import { decode } from "utils/annotator";

export const unselectedAnnotationsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<bufferedAnnotationType> => {
  if (!imageViewer.images.length) return [];

  const image = imageViewer.images.find((image: ShadowImageType) => {
    return image.id === imageViewer.activeImageId;
  });

  if (!image) return [];

  const ids = imageViewer.selectedAnnotations.map(
    (annotation: encodedAnnotationType) => {
      return annotation.id;
    }
  );

  const filteredBufferedAnnotations = image.annotations.reduce(
    (
      bufferedAnnotations: Array<bufferedAnnotationType>,
      annotation: encodedAnnotationType
    ) => {
      if (!ids.includes(annotation.id)) {
        const { mask, ...bufferedAnnotation } = {
          maskData: Uint8Array.from(decode(annotation.mask)),
          ...annotation,
        };
        bufferedAnnotations.push(bufferedAnnotation);
      }
      return bufferedAnnotations;
    },
    []
  );

  return filteredBufferedAnnotations;
};
