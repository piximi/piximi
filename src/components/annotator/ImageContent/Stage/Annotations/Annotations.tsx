import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectedAnnotationObjectsSelector } from "store/common";
import { stagedAnnotationObjectsSelector } from "store/image-viewer";
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

  useEffect(() => {
    console.log(
      `selected: ${
        selectedAnnotationObjects.length > 0
          ? selectedAnnotationObjects[0].annotation.boundingBox
          : ""
      }`
    );
    console.log(
      `staged: ${
        stagedAnnotationObjects.length > 0
          ? stagedAnnotationObjects[0].annotation.boundingBox
          : ""
      }`
    );
  });

  return (
    <>
      {(selected || !unselected) &&
        selectedAnnotationObjects.map((annotationObject) => (
          <Annotation
            key={annotationObject.annotation.id}
            annotation={annotationObject.annotation}
            imageShape={annotationObject.imageShape}
            fillColor={annotationObject.fillColor}
            selected={true}
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
