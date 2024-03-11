import React from "react";
import { useSelector } from "react-redux";

import { AnnotationNew } from "./Annotation";
import { AnnotationTransformer } from "./AnnotationTransformer";

import { selectSelectedAnnotationIds } from "store/slices/imageViewer";

import { AnnotationTool } from "annotator-tools";
import {
  selectActiveAnnotationObjectsNew,
  selectWorkingAnnotationObjectNew,
} from "store/slices/newData/selectors/reselectors";

type AnnotationsProps = {
  annotationTool: AnnotationTool;
};
export const AnnotationsNew = ({ annotationTool }: AnnotationsProps) => {
  const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);
  const annotationObjects = useSelector(selectActiveAnnotationObjectsNew);
  const workingAnnotationObject = useSelector(selectWorkingAnnotationObjectNew);

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
          <AnnotationNew
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
          <AnnotationNew
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
