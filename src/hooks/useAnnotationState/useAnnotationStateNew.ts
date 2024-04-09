import { AnnotationTool } from "utils/annotator/tools";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { annotatorSlice } from "store/annotator";
import { selectAnnotationSelectionMode } from "store/annotator/selectors";
import { imageViewerSlice, selectActiveImageId } from "store/imageViewer";
import { RootState } from "store/rootReducer";
import { selectCategoryById } from "store/data/selectors/selectors";
import { selectActiveImage } from "store/imageViewer/reselectors";
import { selectSelectedIVCategoryId } from "store/imageViewer/selectors/selectSelectedAnnotationCategoryId";
import { selectFirstUnknownCategory } from "store/data/selectors/reselectors";
import { AnnotationModeType, AnnotationStateType } from "utils/annotator/enums";

export const useAnnotationStateNew = (annotationTool: AnnotationTool) => {
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
        annotatorSlice.actions.setAnnotationStateNew({
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
        annotatorSlice.actions.setAnnotationStateNew({
          annotationState: AnnotationStateType.Annotated,
          kind: selectedCategory?.kind,
          annotationTool,
        })
      );
      if (selectionMode !== AnnotationModeType.New) return;
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
        annotatorSlice.actions.setAnnotationStateNew({
          annotationState: AnnotationStateType.Blank,
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
