import { AnnotationType, ImageViewer } from "types";

export const selectedAnnotationsIdsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<string> => {
  return imageViewer.selectedAnnotations.map((annotation: AnnotationType) => {
    return annotation.id;
  });
};
