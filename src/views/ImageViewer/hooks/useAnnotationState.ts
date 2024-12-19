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
        }),
      );
    };
    return func;
  }, [annotationTool, dispatch]);

  const onAnnotated = useMemo(() => {
    const func = async () => {
      if (!annotationCategory) {
        setNoKindAvailable(true);
        return;
      }
      if (!activeImage) throw new Error("Active image not found");
      if (!annotationTool.decodedMask) throw new Error("No mask found");
      if (!annotationTool.boundingBox) throw new Error("No bounding box found");
      const kind = kinds[annotationCategory.kind];
      if (annotationMode === AnnotationMode.New) {
        const newAnnotation = createProtoAnnotation(
          {
            boundingBox: annotationTool.boundingBox,
            categoryId: annotationCategory.id,
            imageId: activeImage.id,
            decodedMask: annotationTool.decodedMask,
            activePlane: activeImage.activePlane,
            partition: Partition.Unassigned,
          },
          activeImage!,
          kind,
          objectNames,
        );
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
          activeImage,
        );

        dispatch(
          annotatorSlice.actions.updateWorkingAnnotation({
            changes: updatedAnnotation,
          }),
        );
      }
      dispatch(
        annotatorSlice.actions.setAnnotationState({
          annotationState: AnnotationState.Annotated,
          kind: annotationCategory.kind,
          annotationTool,
        }),
      );
    };
    return func;
  }, [
    annotationTool,
    annotationCategory,
    activeImage,
    dispatch,
    activeImageId,
    kinds,
    annotationMode,
    objectNames,
    workingAnnotation,
  ]);

  const onDeselect = useMemo(() => {
    const func = () => {
      dispatch(
        annotatorSlice.actions.setAnnotationState({
          annotationState: AnnotationState.Blank,
          kind: annotationCategory?.kind,
          annotationTool,
        }),
      );
    };
    return func;
  }, [annotationTool, annotationCategory, dispatch]);
  useEffect(() => {
    annotationTool.registerOnAnnotatedHandler(onAnnotated);
    annotationTool.registerOnAnnotatingHandler(onAnnotating);
    annotationTool.registerOnDeselectHandler(onDeselect);
  }, [annotationTool, onAnnotated, onAnnotating, onDeselect]);

  return { noKindAvailable, setNoKindAvailable };
};
