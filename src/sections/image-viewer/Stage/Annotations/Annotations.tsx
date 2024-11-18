import React from "react";
import { useSelector } from "react-redux";

import { Annotation } from "./Annotation";

import { AnnotationTool } from "utils/annotator/tools";
import { AnnotationTransformer } from "./AnnotationTransformer";
import {
  selectImageViewerFilters,
  selectSelectedAnnotationIds,
} from "store/imageViewer/selectors";
import {
  selectActiveAnnotationsViews,
  selectWorkingAnnotationView,
} from "store/imageViewer/reselectors";

type AnnotationsProps = {
  annotationTool: AnnotationTool;
};
export const Annotations = ({ annotationTool }: AnnotationsProps) => {
  const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);
  const annotationObjects = useSelector(selectActiveAnnotationsViews);
  const workingAnnotationObject = useSelector(selectWorkingAnnotationView);
  const imageViewerFilters = useSelector(selectImageViewerFilters);

  return (
    <>
      {annotationObjects.map((annotationObject) => (
        <Annotation
          key={annotationObject.annotation.id}
          annotation={annotationObject.annotation}
          imageShape={annotationObject.imageShape}
          fillColor={annotationObject.fillColor}
          selected={true}
          isFiltered={imageViewerFilters.categoryId.includes(
            annotationObject.annotation.categoryId
          )}
        />
      ))}
      {selectedAnnotationsIds.map((selectedAnnotationId) => (
        <AnnotationTransformer
          key={`tr-${selectedAnnotationId}`}
          annotationId={selectedAnnotationId}
          annotationTool={annotationTool}
        />
      ))}
      {workingAnnotationObject &&
        !annotationObjects
          .map((annotation) => annotation.annotation.id)
          .includes(workingAnnotationObject.annotation.id) && (
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
