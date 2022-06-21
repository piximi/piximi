import { put, select } from "redux-saga/effects";
import { imageViewerSlice } from "../../slices";
import { AnnotationTool } from "../../../annotator/image/Tool";
import { AnnotationModeType } from "../../../types/AnnotationModeType";
import { AnnotationStateType } from "../../../types/AnnotationStateType";
import { ToolType } from "../../../types/ToolType";
import { selectionModeSelector } from "../../selectors";
import { selectedCategorySelector } from "../../selectors";
import { toolTypeSelector } from "../../selectors";
import { selectedAnnotationSelector } from "../../selectors/selectedAnnotationSelector";
import { activeImagePlaneSelector } from "../../selectors/activeImagePlaneSelector";

export function* annotationStateChangeSaga({
  payload: { annotationState, annotationTool },
}: {
  type: string;
  payload: {
    annotationState: AnnotationStateType;
    annotationTool: AnnotationTool | undefined;
  };
}): any {
  if (!annotationTool) return;

  if (annotationState !== AnnotationStateType.Annotated) return;

  const selectionMode = yield select(selectionModeSelector);
  const activeImagePlane = yield select(activeImagePlaneSelector);

  if (selectionMode === AnnotationModeType.New) {
    const selectedCategory = yield select(selectedCategorySelector);

    annotationTool.annotate(selectedCategory, activeImagePlane);

    if (!annotationTool.annotation) return;

    yield put(
      imageViewerSlice.actions.setSelectedAnnotations({
        selectedAnnotations: [annotationTool.annotation],
        selectedAnnotation: annotationTool.annotation,
      })
    );
  } else {
    const toolType = yield select(toolTypeSelector);
    if (toolType === ToolType.Zoom) return;

    const selectedAnnotation = yield select(selectedAnnotationSelector);

    if (annotationTool.annotationState !== AnnotationStateType.Annotated)
      return;

    let combinedMask, combinedBoundingBox;

    if (!selectedAnnotation) return;

    if (selectionMode === AnnotationModeType.Add) {
      [combinedMask, combinedBoundingBox] = annotationTool.add(
        selectedAnnotation.mask,
        selectedAnnotation.boundingBox
      );
    } else if (selectionMode === AnnotationModeType.Subtract) {
      [combinedMask, combinedBoundingBox] = annotationTool.subtract(
        selectedAnnotation.mask,
        selectedAnnotation.boundingBox
      );
    } else if (selectionMode === AnnotationModeType.Intersect) {
      [combinedMask, combinedBoundingBox] = annotationTool.intersect(
        selectedAnnotation.mask,
        selectedAnnotation.boundingBox
      );
    } else {
      return;
    }

    annotationTool.mask = combinedMask;
    annotationTool.boundingBox = combinedBoundingBox;

    const combinedSelectedAnnotation = annotationTool.mask.length
      ? {
          ...selectedAnnotation,
          boundingBox: annotationTool.boundingBox,
          mask: annotationTool.mask,
        }
      : undefined;

    yield put(
      imageViewerSlice.actions.setSelectedAnnotations({
        selectedAnnotations: [combinedSelectedAnnotation],
        selectedAnnotation: combinedSelectedAnnotation,
      })
    );

    if (annotationTool.mask.length) {
      const selectedCategory = yield select(selectedCategorySelector);
      annotationTool.annotate(selectedCategory, activeImagePlane);
    }
  }
}
