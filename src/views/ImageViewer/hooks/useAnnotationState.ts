import { useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectFullWorkingAnnotation } from "views/ImageViewer/state/annotator/reselectors";
import { AnnotationMode, AnnotationState } from "views/ImageViewer/utils/enums";
import { selectActiveViewerImage } from "@ImageViewer/state/image-viewer-data/reselectors";

import { editProtoAnnotation } from "../utils/annotationUtils";
import { selectAnnotationMode } from "../state/annotator/selectors";

import type { WorkingAnnotation } from "@ImageViewer/utils/types";
import type { AnnotationTool } from "views/ImageViewer/utils/tools";

export const useAnnotationState = (annotationTool: AnnotationTool) => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveViewerImage);
  const annotationMode = useSelector(selectAnnotationMode);
  const workingAnnotation = useSelector(selectFullWorkingAnnotation);

  const [noKindAvailable, setNoKindAvailable] = useState<boolean>(false);

  const onAnnotating = useMemo(() => {
    const func = () => {
      dispatch(
        annotatorSlice.actions.setAnnotationState(AnnotationState.Annotating),
      );
    };
    return func;
  }, [annotationTool, dispatch]);

  const onAnnotated = useMemo(() => {
    const func = async () => {
      if (!activeImage) throw new Error("Active image not found");
      if (!annotationTool.decodedMask) throw new Error("No mask found");
      if (!annotationTool.boundingBox) throw new Error("No bounding box found");

      if (annotationMode === AnnotationMode.New) {
        const newAnnotation: WorkingAnnotation = {
          boundingBox: annotationTool.boundingBox,
          decodedMask: annotationTool.decodedMask,
          imageId: activeImage.id,
          planeId: activeImage.activePlaneId,
        };

        dispatch(
          annotatorSlice.actions.setWorkingAnnotation({
            annotation: newAnnotation,
          }),
        );
      } else {
        if (!workingAnnotation) return;
        const updatedAnnotation = await editProtoAnnotation(
          workingAnnotation,
          annotationMode,
          annotationTool,
        );

        dispatch(
          annotatorSlice.actions.updateWorkingAnnotation({
            changes: updatedAnnotation,
          }),
        );
      }
      dispatch(
        annotatorSlice.actions.setAnnotationState(AnnotationState.Annotated),
      );
    };
    return func;
  }, [
    annotationTool,
    activeImage,
    dispatch,
    annotationMode,
    workingAnnotation,
  ]);

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
