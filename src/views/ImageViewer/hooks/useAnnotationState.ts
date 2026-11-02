import { useCallback, useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { selectActiveViewerImage } from "@ImageViewer/state/imageViewerData/reselectors";
import { annotatorSlice } from "@ImageViewer/state/annotator";
import { AnnotationState } from "@ImageViewer/utils/enums";

import type { AnnotationTool } from "@ImageViewer/core/annotation-tools";
import type { WorkingAnnotation } from "@ImageViewer/utils/types";

export const useAnnotationState = (annotationTool: AnnotationTool) => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveViewerImage);

  const [noKindAvailable, setNoKindAvailable] = useState<boolean>(false);

  const onAnnotating = useCallback(() => {
    dispatch(
      annotatorSlice.actions.setAnnotationState(AnnotationState.Annotating),
    );
  }, [dispatch]);

  /**
   * A finished stroke always becomes the working annotation, whatever operation
   * is pending. The operation is applied at confirm time instead, which is the
   * first point both operands exist — so this no longer reads annotationMode and
   * no longer combines anything through the tool.
   */
  const onAnnotated = useCallback(async () => {
    if (!activeImage) throw new Error("Active image not found");
    if (!annotationTool.decodedMask) throw new Error("No mask found");
    if (!annotationTool.boundingBox) throw new Error("No bounding box found");

    const newAnnotation: WorkingAnnotation = {
      boundingBox: annotationTool.boundingBox,
      decodedMask: annotationTool.decodedMask,
      imageId: activeImage.id,
      planeId: activeImage.activePlaneId,
    };

    dispatch(annotatorSlice.actions.setWorkingAnnotation(newAnnotation));
    // A fresh stroke invalidates any operation staged against the last one.
    dispatch(annotatorSlice.actions.clearPendingOperation());
    dispatch(
      annotatorSlice.actions.setAnnotationState(AnnotationState.Annotated),
    );
  }, [annotationTool, activeImage, dispatch]);

  const onDeselect = useCallback(() => {
    dispatch(annotatorSlice.actions.setAnnotationState(AnnotationState.Blank));
  }, [dispatch]);
  useEffect(() => {
    annotationTool.registerOnAnnotatedHandler(onAnnotated);
    annotationTool.registerOnAnnotatingHandler(onAnnotating);
    annotationTool.registerOnDeselectHandler(onDeselect);
  }, [annotationTool, onAnnotated, onAnnotating, onDeselect]);

  return { noKindAvailable, setNoKindAvailable };
};
