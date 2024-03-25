import React from "react";
import { useSelector } from "react-redux";

import { AnnotationNew } from "./Annotation";

import { selectSelectedAnnotationIds } from "store/slices/imageViewer";

import { AnnotationTool } from "annotator-tools-new";
import {
  selectActiveAnnotationObjectsNew,
  selectWorkingAnnotationObjectNew,
} from "store/slices/newData/selectors/reselectors";
import { AnnotationTransformerNew } from "./AnnotationTransformer/AnnotationTransformerNew";
import { selectImageViewerFilters } from "store/slices/imageViewer/selectors/selectImageViewerFilters";

type AnnotationsProps = {
  annotationTool: AnnotationTool;
};
export const AnnotationsNew = ({ annotationTool }: AnnotationsProps) => {
  const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);
  const annotationObjects = useSelector(selectActiveAnnotationObjectsNew);
  const workingAnnotationObject = useSelector(selectWorkingAnnotationObjectNew);
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
