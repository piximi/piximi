import { decodedAnnotationType, ImageViewer } from "types";

export const selectedAnnotationsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<decodedAnnotationType> => {
  // Get annotations from staged using selected Ids.
  const selectedStagedAnnotations = imageViewer.stagedAnnotations.filter(
    (annotation) => imageViewer.selectedAnnotations.includes(annotation.id)
  );
  // If there are no current working Annotations, return the selected staged annotatons
  if (!imageViewer.workingAnnotation) return selectedStagedAnnotations;

  // If there is a working annotation, return the superset of working annotations and staged annotations
  return [
    ...selectedStagedAnnotations.filter(
      (annotation) => annotation.id !== imageViewer.workingAnnotation!.id
    ),
    imageViewer.workingAnnotation,
  ];
};
