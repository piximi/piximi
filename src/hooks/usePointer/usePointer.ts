import { useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { useHotkeys } from "hooks";

import {
  imageViewerSlice,
  currentIndexSelector,
  imageHeightSelector,
  imageInstancesSelector,
  imageWidthSelector,
  pointerSelectionSelector,
  selectedAnnotationsIdsSelector,
  selectedAnnotationsSelector,
  stageScaleSelector,
  toolTypeSelector,
  setSelectedAnnotations,
  setSelectedCategoryId,
  setPointerSelection,
} from "store/image-viewer";

import { bufferedAnnotationType, HotkeyView, ToolType } from "types";

import {
  getAnnotationsInBox,
  getOverlappingAnnotations,
} from "utils/common/imageHelper";

export const usePointer = () => {
  const dispatch = useDispatch();

  const delta = 10;

  const toolType = useSelector(toolTypeSelector);

  const selectedAnnotations = useSelector(selectedAnnotationsSelector);

  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);

  const pointerSelection = useSelector(pointerSelectionSelector);

  const annotations = useSelector(imageInstancesSelector);

  const stageScale = useSelector(stageScaleSelector);

  const imageWidth = useSelector(imageWidthSelector);

  const imageHeight = useSelector(imageHeightSelector);

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
      setPointerSelection({
        pointerSelection: {
          ...pointerSelection,
          dragging: false,
          minimum: position,
          selecting: true,
        },
      })
    );
  };

  const onMouseMove = (position: { x: number; y: number }) => {
    if (!pointerSelection.selecting) return;

    if (!position || !pointerSelection.minimum) return;

    dispatch(
      setPointerSelection({
        pointerSelection: {
          ...pointerSelection,
          dragging: Math.abs(position.x - pointerSelection.minimum.x) >= delta,
          maximum: position,
        },
      })
    );
  };

  const onMouseUp = (position: { x: number; y: number }) => {
    if (!pointerSelection.selecting || !pointerSelection.minimum) return;

    if (pointerSelection.dragging) {
      if (!position) return;

      // correct minimum or maximum in the case where user may have selected rectangle from right to left
      const maximum: { x: number; y: number } = {
        x:
          pointerSelection.minimum.x > position.x
            ? pointerSelection.minimum.x
            : position.x,
        y:
          pointerSelection.minimum.y > position.y
            ? pointerSelection.minimum.y
            : position.y,
      };
      const minimum: { x: number; y: number } = {
        x:
          pointerSelection.minimum.x > position.x
            ? position.x
            : pointerSelection.minimum.x,
        y:
          pointerSelection.minimum.y > position.y
            ? position.y
            : pointerSelection.minimum.y,
      };

      dispatch(
        setPointerSelection({
          pointerSelection: {
            ...pointerSelection,
            minimum: minimum,
            maximum: maximum,
          },
        })
      );

      if (!minimum || !annotations.length) {
        dispatch(
          setPointerSelection({
            pointerSelection: {
              ...pointerSelection,
              selecting: false,
            },
          })
        );
        return;
      }

      const scaledMinimum = {
        x: minimum.x / stageScale,
        y: minimum.y / stageScale,
      };
      const scaledMaximum = {
        x: maximum.x / stageScale,
        y: maximum.y / stageScale,
      };

      const annotationsInBox = getAnnotationsInBox(
        scaledMinimum,
        scaledMaximum,
        annotations
      );

      if (annotationsInBox.length) {
        if (shift) {
          batch(() => {
            dispatch(
              setSelectedAnnotations({
                selectedAnnotations: annotationsInBox,
                selectedAnnotation: annotationsInBox[0],
              })
            );
            dispatch(
              setSelectedCategoryId({
                selectedCategoryId: annotationsInBox[0].categoryId,
                execSaga: true,
              })
            );
          });
        } else {
          //only include if not already selected
          const additionalAnnotations = annotationsInBox.filter(
            (annotation: bufferedAnnotationType) => {
              return !selectedAnnotationsIds.includes(annotation.id);
            }
          );
          dispatch(
            setSelectedAnnotations({
              selectedAnnotations: [
                ...selectedAnnotations,
                ...additionalAnnotations,
              ],
              selectedAnnotation: annotationsInBox[0],
            })
          );
        }
      }
    } else {
      onClick(position);
    }

    dispatch(
      setPointerSelection({
        pointerSelection: { ...pointerSelection, selecting: false },
      })
    );
  };

  const onClick = (position: { x: number; y: number }) => {
    if (toolType !== ToolType.Pointer) return;

    if (!position) return;

    if (!annotations.length || !imageWidth || !imageHeight) return;

    const scaledCurrentPosition = {
      x: position.x / stageScale,
      y: position.y / stageScale,
    };

    overlappingAnnotationsIds = getOverlappingAnnotations(
      scaledCurrentPosition,
      annotations,
      imageWidth,
      imageHeight
    );

    let currentAnnotation: bufferedAnnotationType | undefined;

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

      currentAnnotation = annotations.find(
        (annotation: bufferedAnnotationType) => {
          return annotation.id === nextAnnotationId;
        }
      );
    } else {
      currentAnnotation = annotations.find(
        (annotation: bufferedAnnotationType) => {
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
        if (!currentAnnotation) return;
        dispatch(
          setSelectedAnnotations({
            selectedAnnotations: [currentAnnotation],
            selectedAnnotation: currentAnnotation,
          })
        );
        dispatch(
          setSelectedCategoryId({
            selectedCategoryId: currentAnnotation.categoryId,
            execSaga: true,
          })
        );
      });
    }

    if (shift && !selectedAnnotationsIds.includes(currentAnnotation.id)) {
      //include newly selected annotation if not already selected
      dispatch(
        setSelectedAnnotations({
          selectedAnnotations: [...selectedAnnotations, currentAnnotation],
          selectedAnnotation: currentAnnotation,
        })
      );
    }
  };

  return { onMouseDown, onMouseUp, onMouseMove, onPointerClick: onClick };
};
