import { bufferedAnnotationType, ImageViewer } from "types";
import { decode } from "utils/annotator";

export const selectedAnnotationsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<bufferedAnnotationType> => {
  return imageViewer.selectedAnnotations.map((annotation) => {
    const { mask, ...buffered } = {
      maskData: Uint8Array.from(decode(annotation.mask)),
      ...annotation,
    };
    return buffered;
  });
};
