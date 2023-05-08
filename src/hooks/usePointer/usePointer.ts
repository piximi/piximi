import { useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { useHotkeys } from "hooks";

import {
  imageViewerSlice,
  currentIndexSelector,
  setSelectedAnnotationIds,
  setSelectedCategoryId,
  selectSelectedAnnotationIds,
} from "store/imageViewer";

import { annotatorSlice } from "store/annotator";
import {
  selectPointerSelection,
  selectToolType,
} from "store/annotator/selectors";

import {
  selectActiveImageHeight,
  selectActiveImageWidth,
  selectSelectedAnnotations,
  selectActiveAnnotations,
} from "store/data";

import { DecodedAnnotationType, HotkeyView, ToolType } from "types";

import {
  getAnnotationsInBox,
  getOverlappingAnnotations,
} from "utils/annotator";

export const usePointer = () => {
  const dispatch = useDispatch();

  const delta = 10;

  const toolType = useSelector(selectToolType);

  const selectedAnnotations = useSelector(selectSelectedAnnotations);

  const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);

  const changes = useSelector(selectPointerSelection);

  const stagedAnnotations = useSelector(selectActiveAnnotations);

  const imageWidth = useSelector(selectActiveImageWidth);

  const imageHeight = useSelector(selectActiveImageHeight);

  let overlappingAnnotationsIds: Array<string> = [];

  const currentIndex = useSelector(currentIndexSelector);

  const [shift, setShift] = useState<boolean>(false);

  useHotkeys(
    "shift",
    (event) => {
      if (event.type === "keydown") {
        setShift(true);
      } else {
        setShift(false);
      }
    },
    HotkeyView.Annotator,
    { keyup: true, keydown: true }
  );

  const onMouseDown = (position: { x: number; y: number }) => {
    dispatch(
      annotatorSlice.actions.updatePointerSelection({
        changes: {
          dragging: false,
          minimum: position,
          selecting: true,
        },
      })
    );
  };

  const onMouseMove = (position: { x: number; y: number }) => {
    if (!position || !changes.selecting || !changes.minimum) return;

    dispatch(
      annotatorSlice.actions.updatePointerSelection({
        changes: {
          dragging: Math.abs(position.x - changes.minimum.x) >= delta,
          maximum: position,
        },
      })
    );
  };

  const onMouseUp = (position: { x: number; y: number }) => {
    if (!position || !changes.selecting || !changes.minimum) return;
    if (changes.dragging) {
      // correct minimum or maximum in the case where user may have selected rectangle from right to left
      const maximum: { x: number; y: number } = {
        x: changes.minimum.x > position.x ? changes.minimum.x : position.x,
        y: changes.minimum.y > position.y ? changes.minimum.y : position.y,
      };
      const minimum: { x: number; y: number } = {
        x: changes.minimum.x > position.x ? position.x : changes.minimum.x,
        y: changes.minimum.y > position.y ? position.y : changes.minimum.y,
      };

      if (!minimum || !stagedAnnotations.length) {
        dispatch(
          annotatorSlice.actions.updatePointerSelection({
            changes: {
              selecting: false,
            },
          })
        );
        return;
      }

      const scaledMinimum = {
        x: minimum.x,
        y: minimum.y,
      };
      const scaledMaximum = {
        x: maximum.x,
        y: maximum.y,
      };

      const annotationsInBox = getAnnotationsInBox(
        scaledMinimum,
        scaledMaximum,
        stagedAnnotations
      );

      if (annotationsInBox.length) {
        if (!shift) {
          batch(() => {
            dispatch(
              setSelectedAnnotationIds({
                annotationIds: annotationsInBox.map((an) => an.id),
                workingAnnotationId: annotationsInBox[0].id,
              })
            );
            dispatch(
              setSelectedCategoryId({
                selectedCategoryId: annotationsInBox[0].categoryId,
                execSaga: false,
              })
            );
          });
        } else {
          //only include if not already selected
          const additionalAnnotations = annotationsInBox.filter(
            (annotation: DecodedAnnotationType) => {
              return !selectedAnnotationsIds.includes(annotation.id);
            }
          );
          dispatch(
            setSelectedAnnotationIds({
              annotationIds: [
                ...selectedAnnotations.map((an) => an.id),
                ...additionalAnnotations.map((an) => an.id),
              ],
              workingAnnotationId: annotationsInBox[0].id,
            })
          );
        }
      }
    } else {
      onClick(position);
    }

    dispatch(
      annotatorSlice.actions.updatePointerSelection({
        changes: { selecting: false },
      })
    );
  };

  const onClick = (position: { x: number; y: number }) => {
    if (toolType !== ToolType.Pointer) return;

    if (!position) return;

    if (!stagedAnnotations.length || !imageWidth || !imageHeight) return;

    const scaledCurrentPosition = {
      x: position.x,
      y: position.y,
    };

    overlappingAnnotationsIds = getOverlappingAnnotations(
      scaledCurrentPosition,
      stagedAnnotations,
      imageWidth,
      imageHeight
    );

    let currentAnnotation: DecodedAnnotationType | undefined;

    if (overlappingAnnotationsIds.length > 1) {
      dispatch(
        imageViewerSlice.actions.setCurrentIndex({
          currentIndex:
            currentIndex + 1 === overlappingAnnotationsIds.length
              ? 0
              : currentIndex + 1,
        })
      );
      const nextAnnotationId = overlappingAnnotationsIds[currentIndex];

      currentAnnotation = stagedAnnotations.find(
        (annotation: DecodedAnnotationType) => {
          return annotation.id === nextAnnotationId;
        }
      );
    } else {
      currentAnnotation = stagedAnnotations.find(
        (annotation: DecodedAnnotationType) => {
          return annotation.id === overlappingAnnotationsIds[0];
        }
      );
      dispatch(
        imageViewerSlice.actions.setCurrentIndex({
          currentIndex: 0,
        })
      );
    }

    if (!currentAnnotation) return;

    if (!shift) {
      batch(() => {
        dispatch(
          setSelectedAnnotationIds({
            annotationIds: [currentAnnotation!.id],
            workingAnnotationId: currentAnnotation?.id,
          })
        );
        dispatch(
          setSelectedCategoryId({
            selectedCategoryId: currentAnnotation!.categoryId,
            execSaga: false,
          })
        );
      });
    }

    if (shift && !selectedAnnotationsIds.includes(currentAnnotation.id)) {
      //include newly selected annotation if not already selected
      dispatch(
        setSelectedAnnotationIds({
          annotationIds: [
            ...selectedAnnotations.map((an) => an.id),
            currentAnnotation.id,
          ],
          workingAnnotationId: currentAnnotation.id,
        })
      );
    }
  };

  return { onMouseDown, onMouseUp, onMouseMove, onPointerClick: onClick };
};
