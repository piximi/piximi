import { useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { useHotkeys } from "hooks";

import {
  AnnotatorSlice,
  currentIndexSelector,
  imageHeightSelector,
  imageWidthSelector,
  pointerSelectionSelector,
  selectedAnnotationsIdsSelector,
  selectedAnnotationsSelector,
  toolTypeSelector,
  setSelectedAnnotations,
  setSelectedCategoryId,
  setPointerSelection,
  stagedAnnotationsSelector,
} from "store/annotator";

import { DecodedAnnotationType, HotkeyView, ToolType } from "types";

import {
  getAnnotationsInBox,
  getOverlappingAnnotations,
} from "utils/annotator";

export const usePointer = () => {
  const dispatch = useDispatch();

  const delta = 10;

  const toolType = useSelector(toolTypeSelector);

  const selectedAnnotations = useSelector(selectedAnnotationsSelector);

  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);

  const pointerSelection = useSelector(pointerSelectionSelector);

  const stagedAnnotations = useSelector(stagedAnnotationsSelector);

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
    if (!position || !pointerSelection.selecting || !pointerSelection.minimum)
      return;

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
    if (!position || !pointerSelection.selecting || !pointerSelection.minimum)
      return;
    if (pointerSelection.dragging) {
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

      if (!minimum || !stagedAnnotations.length) {
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
              setSelectedAnnotations({
                selectedAnnotations: annotationsInBox,
                workingAnnotation: annotationsInBox[0],
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
            setSelectedAnnotations({
              selectedAnnotations: [
                ...selectedAnnotations,
                ...additionalAnnotations,
              ],
              workingAnnotation: annotationsInBox[0],
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
        AnnotatorSlice.actions.setCurrentIndex({
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
        AnnotatorSlice.actions.setCurrentIndex({
          currentIndex: 0,
        })
      );
    }

    if (!currentAnnotation) return;

    if (!shift) {
      batch(() => {
        dispatch(
          setSelectedAnnotations({
            selectedAnnotations: [currentAnnotation!],
            workingAnnotation: currentAnnotation,
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
        setSelectedAnnotations({
          selectedAnnotations: [...selectedAnnotations, currentAnnotation],
          workingAnnotation: currentAnnotation,
        })
      );
    }
  };

  return { onMouseDown, onMouseUp, onMouseMove, onPointerClick: onClick };
};
