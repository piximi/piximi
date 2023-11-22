import { AnnotationTool } from "annotator-tools";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { annotatorSlice } from "store/slices/annotator";
import { selectAnnotationSelectionMode } from "store/slices/annotator/selectors";
import {
  selectActiveImageActivePlane,
  selectAnnotationCategoryById,
} from "store/slices/data";
import {
  selectActiveImageId,
  selectSelectedAnnotationCategoryId,
} from "store/slices/imageViewer";
import { RootState } from "store/rootReducer";
import { AnnotationModeType, AnnotationStateType } from "types";

export const useAnnotationState = (annotationTool: AnnotationTool) => {
  const dispatch = useDispatch();
  const selectionMode = useSelector(selectAnnotationSelectionMode);
  const activeImagePlane = useSelector(selectActiveImageActivePlane);
  const activeImageId = useSelector(selectActiveImageId);
  const selectedAnnotationCategoryId = useSelector(
    selectSelectedAnnotationCategoryId
  );
  const selectedCategory = useSelector((state: RootState) =>
    selectAnnotationCategoryById(state, selectedAnnotationCategoryId!)
  );

  const onAnnotating = useMemo(() => {
    const func = () => {
      dispatch(
        annotatorSlice.actions.setAnnotationState({
          annotationState: AnnotationStateType.Annotating,
          annotationTool,
        })
      );
    };
    return func;
  }, [annotationTool, dispatch]);

  const onAnnotated = useMemo(() => {
    const func = () => {
      dispatch(
        annotatorSlice.actions.setAnnotationState({
          annotationState: AnnotationStateType.Annotated,
          annotationTool,
        })
      );
      if (selectionMode !== AnnotationModeType.New) return;
      annotationTool.annotate(
        selectedCategory!,
        activeImagePlane!,
        activeImageId!
      );
    };
    return func;
  }, [
    annotationTool,
    selectedCategory,
    activeImagePlane,
    selectionMode,
    dispatch,
    activeImageId,
  ]);

  const onDeselect = useMemo(() => {
    const func = () => {
      dispatch(
        annotatorSlice.actions.setAnnotationState({
          annotationState: AnnotationStateType.Blank,
          annotationTool,
        })
      );
    };
    return func;
  }, [annotationTool, dispatch]);
  useEffect(() => {
    annotationTool.registerOnAnnotatedHandler(onAnnotated);
    annotationTool.registerOnAnnotatingHandler(onAnnotating);
    annotationTool.registerOnDeselectHandler(onDeselect);
  }, [annotationTool, onAnnotated, onAnnotating, onDeselect]);
};
