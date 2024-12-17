import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import { Annotation } from "./Annotation";
import { AnnotationTransformer } from "./AnnotationTransformer";

import { selectImageViewerFilters } from "store/imageViewer/selectors";
import { selectSelectedAnnotationIds } from "store/annotator/selectors";
import {
  selectActiveAnnotationsViews,
  selectWorkingAnnotationView,
} from "store/imageViewer/reselectors";

import { AnnotationTool } from "utils/annotator/tools";

type AnnotationsProps = {
  annotationTool: AnnotationTool;
};
export const Annotations = ({ annotationTool }: AnnotationsProps) => {
  const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);
  const annotationObjects = useSelector(selectActiveAnnotationsViews);
  const workingAnnotationObject = useSelector(selectWorkingAnnotationView);
  const imageViewerFilters = useSelector(selectImageViewerFilters);

  const nonWorkingAnnotationObjects = useMemo(
    () =>
      annotationObjects.filter(
        (annObj) =>
          annObj.annotation.id !== workingAnnotationObject?.annotation.id
      ),
    [annotationObjects, workingAnnotationObject]
  );

  const nonWorkingSelectedAnnotationsIds = useMemo(
    () =>
      selectedAnnotationsIds.filter(
        (selectedAnnotationId) =>
          selectedAnnotationId !== workingAnnotationObject?.annotation.id
      ),
    [selectedAnnotationsIds, workingAnnotationObject]
  );

  return (
    <>
      {nonWorkingAnnotationObjects.map((annotationObject) => (
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
      {nonWorkingSelectedAnnotationsIds.map((selectedAnnotationId) => (
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
            hasControl={true}
          />
        </>
      )}
    </>
  );
};
