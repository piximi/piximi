import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { annotatorSlice } from "views/ImageViewer/state/annotator";

import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import {
  selectActiveImage,
  selectCategories,
  selectCategoriesByKindArray,
} from "views/ImageViewer/state/annotator/reselectors";
import {
  selectActiveImageId,
  selectSelectedIVCategoryId,
} from "views/ImageViewer/state/imageViewer/selectors";

import { AnnotationTool } from "views/ImageViewer/utils/tools";

import { AnnotationState } from "views/ImageViewer/utils/enums";
import { isUnknownCategory } from "utils/common/helpers";

export const useAnnotationState = (annotationTool: AnnotationTool) => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);
  const activeImageId = useSelector(selectActiveImageId);
  const selectedCategoryId = useSelector(selectSelectedIVCategoryId);
  const categories = useSelector(selectCategories);
  const categoriesByKindArray = useSelector(selectCategoriesByKindArray);

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return undefined;
    return categories[selectedCategoryId];
  }, [categories, selectedCategoryId]);

  const defaultSelectedCategory = useMemo(() => {
    return categoriesByKindArray[0]?.categories.find((c) =>
      isUnknownCategory(c.id)
    );
  }, [categoriesByKindArray]);

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
