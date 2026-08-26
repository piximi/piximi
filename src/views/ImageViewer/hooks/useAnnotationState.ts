import { useEffect, useMemo, useState } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { AnnotationState } from "views/ImageViewer/utils/enums";
import { selectActiveViewerImage } from "@ImageViewer/state/image-viewer-data/reselectors";

import type { WorkingAnnotation } from "@ImageViewer/utils/types";
import type { AnnotationTool } from "views/ImageViewer/utils/tools";

export const useAnnotationState = (annotationTool: AnnotationTool) => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveViewerImage);

  const [noKindAvailable, setNoKindAvailable] = useState<boolean>(false);

  const onAnnotating = useMemo(() => {
    const func = () => {
      dispatch(
        annotatorSlice.actions.setAnnotationState(AnnotationState.Annotating),
      );
    };
    return func;
  }, [annotationTool, dispatch]);

  /**
   * A finished stroke always becomes the working annotation, whatever operation
   * is pending. The operation is applied at confirm time instead, which is the
   * first point both operands exist — so this no longer reads annotationMode and
   * no longer combines anything through the tool.
   */
  const onAnnotated = useMemo(() => {
    const func = async () => {
      if (!activeImage) throw new Error("Active image not found");
      if (!annotationTool.decodedMask) throw new Error("No mask found");
      if (!annotationTool.boundingBox) throw new Error("No bounding box found");

      const newAnnotation: WorkingAnnotation = {
        boundingBox: annotationTool.boundingBox,
        decodedMask: annotationTool.decodedMask,
        imageId: activeImage.id,
        planeId: activeImage.activePlaneId,
      };

      batch(() => {
        dispatch(annotatorSlice.actions.setWorkingAnnotation(newAnnotation));
        // A fresh stroke invalidates any operation staged against the last one.
        dispatch(annotatorSlice.actions.clearPendingOperation());
        dispatch(
          annotatorSlice.actions.setAnnotationState(AnnotationState.Annotated),
        );
      });
    };
    return func;
  }, [annotationTool, activeImage, dispatch]);

  const onDeselect = useMemo(() => {
    const func = () => {
      dispatch(
        annotatorSlice.actions.setAnnotationState(AnnotationState.Blank),
      );
    };
    return func;
  }, [annotationTool, dispatch]);
  useEffect(() => {
    annotationTool.registerOnAnnotatedHandler(onAnnotated);
    annotationTool.registerOnAnnotatingHandler(onAnnotating);
    annotationTool.registerOnDeselectHandler(onDeselect);
  }, [annotationTool, onAnnotated, onAnnotating, onDeselect]);

  return { noKindAvailable, setNoKindAvailable };
};
