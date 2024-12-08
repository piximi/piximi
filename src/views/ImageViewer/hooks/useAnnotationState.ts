import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "store/rootReducer";

import { annotatorSlice } from "store/annotator";

import { imageViewerSlice } from "store/imageViewer";
import { selectActiveImage } from "store/imageViewer/reselectors";
import {
  selectActiveImageId,
  selectSelectedIVCategoryId,
} from "store/imageViewer/selectors";
import {
  selectCategoryById,
  selectFirstUnknownCategory,
} from "store/data/selectors";

import { AnnotationTool } from "utils/annotator/tools";

import { AnnotationState } from "utils/annotator/enums";

export const useAnnotationState = (annotationTool: AnnotationTool) => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);
  const activeImageId = useSelector(selectActiveImageId);
  const selectedCategoryId = useSelector(selectSelectedIVCategoryId);
  const selectedCategory = useSelector((state: RootState) =>
    selectCategoryById(state, selectedCategoryId!)
  );
  const defaultSelectedCategory = useSelector(selectFirstUnknownCategory);
  const [noKindAvailable, setNoKindAvailable] = useState<boolean>(false);

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
      if (!selectedCategory) {
        if (!defaultSelectedCategory) {
          setNoKindAvailable(true);
          return;
        }
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

  return { noKindAvailable, setNoKindAvailable };
};
