import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { annotatorSlice } from "views/ImageViewer/state/annotator";

import { selectFullWorkingAnnotation } from "views/ImageViewer/state/annotator/reselectors";
import { selectAnnotationMode } from "../state/annotator/selectors";

import { AnnotationTool } from "views/ImageViewer/utils/tools";

import { AnnotationMode, AnnotationState } from "views/ImageViewer/utils/enums";
import {
  createProtoAnnotation,
  editProtoAnnotation,
} from "../utils/annotationUtils";
import { Partition } from "utils/models/enums";
import {
  selectCategoryEntities,
  selectKindEntities,
} from "store/data/selectors";
import {
  selectActiveAnnotations,
  selectActiveImage,
} from "../state/image-viewer-data/reselectors";
import {
  selectActiveMetadata,
  selectActiveMetadataId,
  selectSelectedIVCategoryId,
} from "../state/image-viewer-data/selectors";

export const useAnnotationState = (annotationTool: AnnotationTool) => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);
  const activeImageId = useSelector(selectActiveMetadataId);
  const selectedCategoryId = useSelector(selectSelectedIVCategoryId);
  const categories = useSelector(selectCategoryEntities);

  const kinds = useSelector(selectKindEntities);
  const annotationMode = useSelector(selectAnnotationMode);
  const objects = useSelector(selectActiveAnnotations);
  const workingAnnotation = useSelector(selectFullWorkingAnnotation);
  const activeImageSeries = useSelector(selectActiveMetadata);

  const objectNames = useMemo(() => {
    return objects.map((obj) => obj.name);
  }, [objects]);

  const annotationCategory = useMemo(() => {
    if (categories[selectedCategoryId]) return categories[selectedCategoryId];
    const defaultKindCategories = Object.values(kinds).map(
      (kind) => kind.unknownCategoryId,
    );
    if (!defaultKindCategories) return undefined;
    const defaultCategory = categories[defaultKindCategories[0]];

    return defaultCategory;
  }, [categories, selectedCategoryId]);

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
            plane: activeImageSeries?.activePlane ?? 0,
            activePlane: activeImageSeries?.activePlane ?? 0,
            timepoint: activeImage.timepoint ?? 0,
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
