import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import { Annotation } from "./Annotation";
import { AnnotationTransformer } from "./AnnotationTransformer";

import { selectImageViewerFilters } from "views/ImageViewer/state/imageViewer/selectors";
import {
  selectSelectedAnnotationIds,
  selectTimeLinkingAnnIds,
  selectTimeLinkingState,
} from "views/ImageViewer/state/annotator/selectors";
import {
  selectActiveAnnotationsViews,
  selectWorkingAnnotationView,
} from "views/ImageViewer/state/annotator/reselectors";

import { AnnotationTool } from "views/ImageViewer/utils/tools";

type AnnotationsProps = {
  annotationTool: AnnotationTool;
};
export const Annotations = React.memo(
  ({ annotationTool }: AnnotationsProps) => {
    const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);
    const tLinkedAnnIds = useSelector(selectTimeLinkingAnnIds);
    const tLinkingActive = useSelector(selectTimeLinkingState);
    const annotationObjects = useSelector(selectActiveAnnotationsViews);
    const workingAnnotationObject = useSelector(selectWorkingAnnotationView);
    const imageViewerFilters = useSelector(selectImageViewerFilters);
    const tLinkedAnnArray = useMemo(() => {
      return Object.values(tLinkedAnnIds);
    }, [tLinkedAnnIds]);

    const nonWorkingAnnotationObjects = useMemo(
      () =>
        annotationObjects.filter(
          (annObj) =>
            annObj.annotation.id !== workingAnnotationObject?.annotation.id,
        ),
      [annotationObjects, workingAnnotationObject],
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
        {nonWorkingAnnotationObjects.map((annotationObject) => (
          <Annotation
            key={annotationObject.annotation.id}
            annotation={annotationObject.annotation}
            imageShape={annotationObject.imageShape}
            fillColor={
              !tLinkingActive
                ? annotationObject.fillColor
                : tLinkedAnnArray.includes(annotationObject.annotation.id)
                  ? "#AAAAAAFF"
                  : "#77777710"
            }
            selected={true}
            isFiltered={imageViewerFilters.categoryId.includes(
              annotationObject.annotation.categoryId,
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
