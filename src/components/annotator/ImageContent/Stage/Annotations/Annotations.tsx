import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import {
  selectedAnnotationObjectsSelector,
  stagedAnnotationObjectsSelector,
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
  const stagedAnnotationObjects = useSelector(stagedAnnotationObjectsSelector);

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
        stagedAnnotationObjects.map((annotationObject) => (
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
