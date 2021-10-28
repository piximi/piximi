import React from "react";
import { useSelector } from "react-redux";
import { selectedAnnotationSelector } from "../../../../../../annotator/store/selectors/selectedAnnotationSelector";
import { AnnotationType } from "../../../../../../annotator/types/AnnotationType";
import { selectedAnnotationsSelector } from "../../../../../../annotator/store/selectors/selectedAnnotationsSelector";
import { SelectedAnnotation } from "../SelectedAnnotation/SelectedAnnotation";

export const SelectedAnnotations = () => {
  const selectedAnnotation = useSelector(selectedAnnotationSelector);

  const selectedAnnotations = useSelector(selectedAnnotationsSelector);

  if (!selectedAnnotations || !selectedAnnotation) return <React.Fragment />;

  return (
    <React.Fragment>
      {selectedAnnotations.map((annotation: AnnotationType) => {
        return (
          <SelectedAnnotation key={annotation.id} annotation={annotation} />
        );
      })}
    </React.Fragment>
  );
};
