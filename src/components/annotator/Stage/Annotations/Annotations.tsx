import React from "react";
import { useSelector } from "react-redux";

import { Annotation } from "./Annotation";
import { AnnotationTransformer } from "./AnnotationTransformer";

import { selectSelectedAnnotationIds } from "store/imageViewer";
import {
  selectActiveAnnotationObjects,
  selectWorkingAnnotationObject,
} from "store/data";

import { AnnotationTool } from "annotator-tools";

type AnnotationsProps = {
  transformPosition: ({
    x,
    y,
  }: {
    x: number;
    y: number;
  }) => { x: number; y: number } | undefined;
  annotationTool: AnnotationTool;
};
export const Annotations = ({
  transformPosition,
  annotationTool,
}: AnnotationsProps) => {
  const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);
  const annotationObjects = useSelector(selectActiveAnnotationObjects);
  const workingAnnotationObject = useSelector(selectWorkingAnnotationObject);

  return (
    <>
      {[...annotationObjects, ...workingAnnotationObject].map(
        (annotationObject) => (
          <Annotation
            key={annotationObject.annotation.id}
            annotation={annotationObject.annotation}
            imageShape={annotationObject.imageShape}
            fillColor={annotationObject.fillColor}
            selected={true}
          />
        )
      )}
      {selectedAnnotationsIds.map((selectedAnnotationId) => (
        <AnnotationTransformer
          key={`tr-${selectedAnnotationId}`}
          transformPosition={transformPosition}
          annotationId={selectedAnnotationId}
          annotationTool={annotationTool}
        />
      ))}
      {workingAnnotationObject.map((workingAnnotationId) => (
        <AnnotationTransformer
          key={`tr-${workingAnnotationId.annotation.id}`}
          transformPosition={transformPosition}
          annotationId={workingAnnotationId.annotation.id}
          annotationTool={annotationTool}
        />
      ))}
    </>
  );
};
