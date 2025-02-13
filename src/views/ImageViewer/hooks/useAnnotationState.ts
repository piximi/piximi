import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { annotatorSlice } from "views/ImageViewer/state/annotator";

import {
  selectActiveImage,
  selectCategories,
  selectCategoriesByKindArray,
  selectFullWorkingAnnotation,
  selectImageViewerObjects,
  selectImageViewerKinds,
} from "views/ImageViewer/state/annotator/reselectors";
import {
  selectActiveImageId,
  selectSelectedIVCategoryId,
} from "views/ImageViewer/state/imageViewer/selectors";

import { AnnotationTool } from "views/ImageViewer/utils/tools";

import { AnnotationMode, AnnotationState } from "views/ImageViewer/utils/enums";
import { getPropertiesFromImage } from "utils/common/helpers";
import { isUnknownCategory } from "store/data/helpers";
import { selectAnnotationMode } from "../state/annotator/selectors";
import {
  AnnotationObject,
  DecodedAnnotationObject,
  ImageObject,
  Kind,
  PartialDecodedAnnotationObject,
} from "store/data/types";
import { encodeAnnotation } from "../utils/rle";

export const useAnnotationState = (annotationTool: AnnotationTool) => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);
  const activeImageId = useSelector(selectActiveImageId);
  const selectedCategoryId = useSelector(selectSelectedIVCategoryId);
  const categories = useSelector(selectCategories);
  const categoriesByKindArray = useSelector(selectCategoriesByKindArray);
  const kinds = useSelector(selectImageViewerKinds);
  const annotationMode = useSelector(selectAnnotationMode);
  const objects = useSelector(selectImageViewerObjects);
  const workingAnnotation = useSelector(selectFullWorkingAnnotation);

  const objectNames = useMemo(() => {
    return objects.map((obj) => obj.name);
  }, [objects]);

  const annotationCategory = useMemo(() => {
    if (categories[selectedCategoryId]) return categories[selectedCategoryId];
    const defaultKindCategories = Object.entries(categoriesByKindArray).find(
      (k) => k[0] !== selectedCategoryId,
    );
    if (!defaultKindCategories) return undefined;
    const defaultCategory = defaultKindCategories[1].categories.find((c) =>
      isUnknownCategory(c.id),
    );

    return defaultCategory;
  }, [categories, selectedCategoryId, categoriesByKindArray]);

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
      if (!activeImage) return;
      annotationTool.annotate(
        annotationCategory,
        activeImage!.activePlane,
        activeImageId!,
      );
      const kind = kinds[annotationCategory.kind];
      if (annotationMode === AnnotationMode.New) {
        const newAnnotation = await createAnnotation(
          annotationTool.annotation!,

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
        const updatedAnnotation = await editAnnotation(
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

const createAnnotation = async (
  toolAnnotation: PartialDecodedAnnotationObject,

  activeImage: ImageObject,

  kindObject: Kind,
  existingNames: string[],
) => {
  const bbox = toolAnnotation.boundingBox;

  const bitDepth = activeImage.bitDepth;
  const imageProperties = await getPropertiesFromImage(
    activeImage,
    toolAnnotation,
  );
  //TODO: add suppoert for multiple planes
  const shape = {
    planes: 1,
    height: bbox[3] - bbox[1],
    width: bbox[2] - bbox[0],
    channels: activeImage.shape.channels,
  };

  let annotationName: string = `${activeImage.name}-${kindObject.id}_0`;
  let i = 1;
  while (existingNames.includes(annotationName)) {
    annotationName = annotationName.replace(/_(\d+)$/, `_${i}`);
    i++;
  }

  return {
    ...toolAnnotation,
    ...imageProperties,
    bitDepth,
    shape,
    name: annotationName,
    kind: kindObject.id,
  } as DecodedAnnotationObject;
};

const editAnnotation = async (
  workingAnnotation: DecodedAnnotationObject,
  annotationMode: AnnotationMode,
  annotationTool: AnnotationTool,
  activeImage: ImageObject,
): Promise<AnnotationObject | DecodedAnnotationObject> => {
  let combinedMask, combinedBoundingBox;

  if (annotationMode === AnnotationMode.Add) {
    [combinedMask, combinedBoundingBox] = annotationTool.add(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else if (annotationMode === AnnotationMode.Subtract) {
    [combinedMask, combinedBoundingBox] = annotationTool.subtract(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else if (annotationMode === AnnotationMode.Intersect) {
    [combinedMask, combinedBoundingBox] = annotationTool.intersect(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else {
    return workingAnnotation;
  }

  annotationTool.decodedMask = combinedMask;
  annotationTool.boundingBox = combinedBoundingBox;

  const combinedSelectedAnnotation = {
    ...workingAnnotation,
    boundingBox: combinedBoundingBox,
    decodedMask: annotationTool.decodedMask,
  } as DecodedAnnotationObject;

  const annotation = encodeAnnotation(combinedSelectedAnnotation);
  const { data, src } = await getPropertiesFromImage(activeImage, annotation);

  //TODO: add suppoert for multiple planes
  const shape = {
    planes: 1,
    height: combinedBoundingBox[3] - combinedBoundingBox[1],
    width: combinedBoundingBox[2] - combinedBoundingBox[0],
    channels: activeImage.shape.channels,
  };

  return { ...annotation, data, src, shape } as AnnotationObject;
};
