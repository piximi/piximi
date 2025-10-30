import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import { Annotation } from "./Annotation";
import { AnnotationTransformer } from "./AnnotationTransformer";

import { selectImageViewerFilters } from "views/ImageViewer/state/imageViewer/selectors";
import { selectWorkingAnnotationView } from "views/ImageViewer/state/annotator/reselectors";

import { AnnotationTool } from "views/ImageViewer/utils/tools";
import { selectSelectedAnnotationIds } from "views/ImageViewer/state/image-viewer-data/selectors";
import { selectViewableActiveAnnotations } from "views/ImageViewer/state/image-viewer-data/reselectors";

type AnnotationsProps = {
  annotationTool: AnnotationTool;
};
export const Annotations = React.memo(
  ({ annotationTool }: AnnotationsProps) => {
    const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);
    const annotations = useSelector(selectViewableActiveAnnotations);
    const workingAnnotationObject = useSelector(selectWorkingAnnotationView);
    const imageViewerFilters = useSelector(selectImageViewerFilters);

    const nonWorkingAnnotationObjects = useMemo(
      () =>
        annotations.filter(
          (annObj) =>
            annObj.annotation.id !== workingAnnotationObject?.annotation.id,
        ),
      [annotations, workingAnnotationObject],
    );

    const nonWorkingSelectedAnnotationsIds = useMemo(
      () =>
        selectedAnnotationsIds.filter(
          (selectedAnnotationId) =>
            selectedAnnotationId !== workingAnnotationObject?.annotation.id,
        ),
      [selectedAnnotationsIds, workingAnnotationObject],
    );

    return (
      <>
        {nonWorkingAnnotationObjects.map((annotation) => (
          <Annotation
            key={annotation.annotation.id}
            annotation={annotation.annotation}
            imageShape={annotation.imageShape}
            fillColor={annotation.fillColor}
            selected={true}
            isFiltered={imageViewerFilters.categoryId.includes(
              annotation.annotation.categoryId,
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
  },
);
