import { decodedAnnotationType, Annotator } from "types";

export const selectedAnnotationsSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): Array<decodedAnnotationType> => {
  // Get annotations from staged using selected Ids.
  const selectedStagedAnnotations = annotator.stagedAnnotations.filter(
    (annotation) => annotator.selectedAnnotations.includes(annotation.id)
  );
  // If there are no current working Annotations, return the selected staged annotatons
  if (!annotator.workingAnnotation) return selectedStagedAnnotations;

  // If there is a working annotation, return the superset of working annotations and staged annotations
  return [
    ...selectedStagedAnnotations.filter(
      (annotation) => annotation.id !== annotator.workingAnnotation!.id
    ),
    annotator.workingAnnotation,
  ];
};
