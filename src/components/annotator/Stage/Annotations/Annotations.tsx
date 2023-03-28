import React from "react";
import { useSelector } from "react-redux";

import { Annotation } from "./Annotation";
import { AnnotationTransformer } from "./AnnotationTransformer";

import { selectedAnnotationsIdsSelector } from "store/imageViewer";
import { selectActiveAnnotationObjects } from "store/data";

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
  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);
  const annotationObjects = useSelector(selectActiveAnnotationObjects);
  return (
    <>
      {annotationObjects.map((annotationObject) => (
        <React.Fragment key={`group-${annotationObject.annotation.id}`}>
          <Annotation
            key={annotationObject.annotation.id}
            annotation={annotationObject.annotation}
            imageShape={annotationObject.imageShape}
            fillColor={annotationObject.fillColor}
            selected={true}
          />
          {selectedAnnotationsIds.includes(annotationObject.annotation.id) && (
            <AnnotationTransformer
              key={`tr-${annotationObject.annotation.id}`}
              transformPosition={transformPosition}
              annotationId={annotationObject.annotation.id}
              annotationTool={annotationTool}
            />
          )}
        </React.Fragment>
      ))}
    </>
  );
};
