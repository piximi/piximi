import React from "react";
import { useSelector } from "react-redux";
import {
  selectedAnnotationObjectsSelector,
  unselectedAnnotationObjectsSelector,
} from "store/common";
import { Annotation } from "./Annotation";

export const Annotations = ({
  selected,
  unselected,
}: {
  selected?: boolean;
  unselected?: boolean;
}) => {
  const selectedAnnotationObjects = useSelector(
    selectedAnnotationObjectsSelector
  );
  const unselectedAnnotationObjects = useSelector(
    unselectedAnnotationObjectsSelector
  );

  return (
    <>
      {(selected || !unselected) &&
        selectedAnnotationObjects.map((annotationObject) => (
          <Annotation
            key={annotationObject.annotation.id}
            annotation={annotationObject.annotation}
            imageShape={annotationObject.imageShape}
            fillColor={annotationObject.fillColor}
          />
        ))}
      {(unselected || !selected) &&
        unselectedAnnotationObjects.map((annotationObject) => (
          <Annotation
            annotation={annotationObject.annotation}
            imageShape={annotationObject.imageShape}
            fillColor={annotationObject.fillColor}
            key={annotationObject.annotation.id}
          />
        ))}
    </>
  );
};
