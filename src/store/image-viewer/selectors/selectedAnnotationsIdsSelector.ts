import { encodedAnnotationType, ImageViewer } from "types";

export const selectedAnnotationsIdsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<string> => {
  return imageViewer.selectedAnnotations.map(
    (annotation: encodedAnnotationType) => {
      return annotation.id;
    }
  );
};
