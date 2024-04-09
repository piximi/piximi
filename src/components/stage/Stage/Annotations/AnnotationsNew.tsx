import React from "react";
import { useSelector } from "react-redux";

import { AnnotationNew } from "./Annotation";

import { AnnotationTool } from "utils/annotator/tools";
import { AnnotationTransformerNew } from "./AnnotationTransformer";
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
export const AnnotationsNew = ({ annotationTool }: AnnotationsProps) => {
  const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);
  const annotationObjects = useSelector(selectActiveAnnotationsViews);
  const workingAnnotationObject = useSelector(selectWorkingAnnotationView);
  const imageViewerFilters = useSelector(selectImageViewerFilters);

  return (
    <>
      {annotationObjects.map((annotationObject) => (
        <AnnotationNew
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
        <AnnotationTransformerNew
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
            <AnnotationNew
              key={workingAnnotationObject.annotation.id}
              annotation={workingAnnotationObject.annotation}
              imageShape={workingAnnotationObject.imageShape}
              fillColor={workingAnnotationObject.fillColor}
              selected={true}
            />
            <AnnotationTransformerNew
              key={`tr-${workingAnnotationObject.annotation.id}`}
              annotationId={workingAnnotationObject.annotation.id}
              annotationTool={annotationTool}
            />
          </>
        )}
    </>
  );
};
