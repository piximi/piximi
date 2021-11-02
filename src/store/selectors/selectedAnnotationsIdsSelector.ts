import { ImageViewer } from "../../types/ImageViewer";
import { AnnotationType } from "../../types/AnnotationType";

export const selectedAnnotationsIdsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<string> => {
  return imageViewer.selectedAnnotations.map((annotation: AnnotationType) => {
    return annotation.id;
  });
};
