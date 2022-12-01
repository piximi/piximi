import React from "react";
import { useSelector } from "react-redux";

import { Annotation } from "./Annotation";
import { AnnotationTransformer } from "./AnnotationTransformer";

import {
  annotationObjectsSelector,
  selectedAnnotationsIdsSelector,
} from "store/annotator";

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
  stageScale: number;
};
export const Annotations = ({
  transformPosition,
  annotationTool,
  stageScale,
}: AnnotationsProps) => {
  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);
  const annotationObjects = useSelector(annotationObjectsSelector);

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
              stageScale={stageScale}
            />
          )}
        </React.Fragment>
      ))}
    </>
  );
};
