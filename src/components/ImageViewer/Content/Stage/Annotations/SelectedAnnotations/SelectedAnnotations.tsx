import React from "react";
import { useSelector } from "react-redux";
import { selectedAnnotationSelector } from "../../../../../../store/selectors/selectedAnnotationSelector";
import { AnnotationType } from "../../../../../../types/AnnotationType";
import { selectedAnnotationsSelector } from "../../../../../../store/selectors/selectedAnnotationsSelector";
import { SelectedAnnotation } from "../SelectedAnnotation/SelectedAnnotation";

export const SelectedAnnotations = () => {
  const selectedAnnotation = useSelector(selectedAnnotationSelector);

  const selectedAnnotations = useSelector(selectedAnnotationsSelector);

  if (!selectedAnnotations || !selectedAnnotation) return <></>;

  return (
    <>
      {selectedAnnotations.map((annotation: AnnotationType) => {
        return (
          <SelectedAnnotation key={annotation.id} annotation={annotation} />
        );
      })}
    </>
  );
};
