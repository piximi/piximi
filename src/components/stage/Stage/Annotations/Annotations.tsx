import React from "react";
import { useSelector } from "react-redux";

import { Annotation } from "./Annotation";
import { AnnotationTransformer } from "./AnnotationTransformer";

import { selectSelectedAnnotationIds } from "store/slices/imageViewer";
import {
  selectActiveAnnotationObjects,
  selectWorkingAnnotationObject,
} from "store/slices/data";

import { AnnotationTool } from "annotator-tools";

type AnnotationsProps = {
  annotationTool: AnnotationTool;
};
export const Annotations = ({ annotationTool }: AnnotationsProps) => {
  const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);
  const annotationObjects = useSelector(selectActiveAnnotationObjects);
  const workingAnnotationObject = useSelector(selectWorkingAnnotationObject);

  return (
    <>
      {annotationObjects
        .filter((annotationObject) => {
          if (workingAnnotationObject) {
            return (
              workingAnnotationObject.annotation.id !==
              annotationObject.annotation.id
            );
          } else {
            return true;
          }
        })
        .map((annotationObject) => (
          <Annotation
            key={annotationObject.annotation.id}
            annotation={annotationObject.annotation}
            imageShape={annotationObject.imageShape}
            fillColor={annotationObject.fillColor}
            selected={true}
          />
        ))}
      {selectedAnnotationsIds
        .filter((annotationId) => {
          if (workingAnnotationObject) {
            return workingAnnotationObject.annotation.id !== annotationId;
          } else {
            return true;
          }
        })
        .map((selectedAnnotationId) => (
          <AnnotationTransformer
            key={`tr-${selectedAnnotationId}`}
            annotationId={selectedAnnotationId}
            annotationTool={annotationTool}
          />
        ))}
      {workingAnnotationObject && (
        <>
          <Annotation
            key={workingAnnotationObject.annotation.id}
            annotation={workingAnnotationObject.annotation}
            imageShape={workingAnnotationObject.imageShape}
            fillColor={workingAnnotationObject.fillColor}
            selected={true}
          />
          <AnnotationTransformer
            key={`tr-${workingAnnotationObject.annotation.id}`}
            annotationId={workingAnnotationObject.annotation.id}
            annotationTool={annotationTool}
          />
        </>
      )}
    </>
  );
};
