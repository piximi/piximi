import { AnnotationTool } from "utils/annotator/tools";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { annotatorSlice } from "store/annotator";
import { selectAnnotationSelectionMode } from "store/annotator/selectors";
import { imageViewerSlice } from "store/imageViewer";
import { RootState } from "store/rootReducer";
import { selectCategoryById } from "store/data/selectors";
import { selectActiveImage } from "store/imageViewer/reselectors";
import { selectFirstUnknownCategory } from "store/data/selectors";
import { AnnotationMode, AnnotationState } from "utils/annotator/enums";
import {
  selectActiveImageId,
  selectSelectedIVCategoryId,
} from "store/imageViewer/selectors";

export const useAnnotationState = (annotationTool: AnnotationTool) => {
  const dispatch = useDispatch();
  const selectionMode = useSelector(selectAnnotationSelectionMode);
  const activeImage = useSelector(selectActiveImage);
  const activeImageId = useSelector(selectActiveImageId);
  const selectedCategoryId = useSelector(selectSelectedIVCategoryId);
  const selectedCategory = useSelector((state: RootState) =>
    selectCategoryById(state, selectedCategoryId!)
  );
  const defaultSelectedCategory = useSelector(selectFirstUnknownCategory);

  const onAnnotating = useMemo(() => {
    const func = () => {
      dispatch(
        annotatorSlice.actions.setAnnotationState({
          annotationState: AnnotationState.Annotating,
          annotationTool,
        })
      );
    };
    return func;
  }, [annotationTool, dispatch]);

  const onAnnotated = useMemo(() => {
    const func = () => {
      if (selectionMode !== AnnotationMode.New) return;

      if (!selectedCategory) {
        if (!defaultSelectedCategory) return;
        dispatch(
          imageViewerSlice.actions.setSelectedCategoryId({
            selectedCategoryId: defaultSelectedCategory.id,
          })
        );
        annotationTool.annotate(
          defaultSelectedCategory,
          activeImage!.activePlane,
          activeImageId!
        );
      } else {
        annotationTool.annotate(
          selectedCategory,
          activeImage!.activePlane,
          activeImageId!
        );
      }

      dispatch(
        annotatorSlice.actions.setAnnotationState({
          annotationState: AnnotationState.Annotated,
          kind: selectedCategory?.kind ?? defaultSelectedCategory?.kind,
          annotationTool,
        })
      );
    };
    return func;
  }, [
    annotationTool,
    selectedCategory,
    activeImage,
    selectionMode,
    dispatch,
    activeImageId,
    defaultSelectedCategory,
  ]);

  const onDeselect = useMemo(() => {
    const func = () => {
      dispatch(
        annotatorSlice.actions.setAnnotationState({
          annotationState: AnnotationState.Blank,
          kind: selectedCategory?.kind,
          annotationTool,
        })
      );
    };
    return func;
  }, [annotationTool, selectedCategory, dispatch]);
  useEffect(() => {
    annotationTool.registerOnAnnotatedHandler(onAnnotated);
    annotationTool.registerOnAnnotatingHandler(onAnnotating);
    annotationTool.registerOnDeselectHandler(onDeselect);
  }, [annotationTool, onAnnotated, onAnnotating, onDeselect]);
};
