import { decode } from "utils/annotator";
import { bufferedAnnotationType, ImageViewer } from "types";

export const selectedAnnotationSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): bufferedAnnotationType | undefined => {
  if (imageViewer.selectedAnnotation) {
    const { mask, ...buffered } = {
      maskData: Uint8Array.from(decode(imageViewer.selectedAnnotation!.mask)),
      ...imageViewer.selectedAnnotation,
    };
    return buffered as bufferedAnnotationType;
  }
  return undefined;
};
