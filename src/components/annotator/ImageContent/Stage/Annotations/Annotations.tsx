import { AnnotationTool } from "annotator/AnnotationTools";
import Konva from "konva";
import React, { useRef } from "react";
import { useSelector } from "react-redux";
import { selectedAnnotationObjectsSelector } from "store/common";
import { stagedAnnotationObjectsSelector } from "store/image-viewer";
import { Annotation } from "./Annotation";
import { AnnotationTransformer } from "./AnnotationTransformer/AnnotationTransformer";

type AnnotationsProps = {
  transformPosition: ({
    x,
    y,
  }: {
    x: number;
    y: number;
  }) => { x: number; y: number } | undefined;
  selected?: boolean;
  unselected?: boolean;
  annotationTool: AnnotationTool;
};
export const Annotations = ({
  transformPosition,
  selected,
  unselected,
  annotationTool,
}: AnnotationsProps) => {
  const selectedAnnotationObjects = useSelector(
    selectedAnnotationObjectsSelector
  );
  const stagedAnnotationObjects = useSelector(stagedAnnotationObjectsSelector);

  return (
    <>
      {(unselected || !selected) &&
        stagedAnnotationObjects.map((annotationObject) => (
          <Annotation
            annotation={annotationObject.annotation}
            imageShape={annotationObject.imageShape}
            fillColor={annotationObject.fillColor}
            key={annotationObject.annotation.id}
          />
        ))}
      {(selected || !unselected) &&
        selectedAnnotationObjects.map((annotationObject) => (
          <React.Fragment key={`group-${annotationObject.annotation.id}`}>
            <Annotation
              key={annotationObject.annotation.id}
              annotation={annotationObject.annotation}
              imageShape={annotationObject.imageShape}
              fillColor={annotationObject.fillColor}
              selected={true}
            />
            <AnnotationTransformer
              key={`tr-${annotationObject.annotation.id}`}
              transformPosition={transformPosition}
              annotationId={annotationObject.annotation.id}
              annotationTool={annotationTool}
            />
          </React.Fragment>
        ))}
    </>
  );
};
