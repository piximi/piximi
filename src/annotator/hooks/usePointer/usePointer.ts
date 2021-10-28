import { ToolType } from "../../types/ToolType";
import {
  getAnnotationsInBox,
  getOverlappingAnnotations,
} from "../../image/imageHelper";
import { AnnotationType } from "../../types/AnnotationType";
import {
  applicationSlice,
  setPointerSelection,
  setSelectedAnnotations,
  setSelectedCategory,
} from "../../store/slices";
import { batch, useDispatch, useSelector } from "react-redux";
import {
  imageInstancesSelector,
  stageScaleSelector,
  toolTypeSelector,
} from "../../store/selectors";
import { selectedAnnotationsSelector } from "../../store/selectors/selectedAnnotationsSelector";
import { currentIndexSelector } from "../../store/selectors/currentIndexSelector";
import { useHotkeys } from "react-hotkeys-hook";
import hotkeys from "hotkeys-js";
import { useState } from "react";
import { pointerSelectionSelector } from "../../store/selectors/pointerSelectionSelector";
import { selectedAnnotationsIdsSelector } from "../../store/selectors/selectedAnnotationsIdsSelector";
import { imageWidthSelector } from "../../store/selectors/imageWidthSelector";
import { imageHeightSelector } from "../../store/selectors/imageHeightSelector";

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
    "*",
    (event) => {
      if (hotkeys.shift) {
        if (event.type === "keyup") {
          setShift(false);
        }
      }
    },
    { keyup: true }
  );

  useHotkeys(
    "*",
    (event) => {
      if (hotkeys.shift) {
        if (event.type === "keydown") {
          setShift(true);
        }
      }
    },
    { keydown: true }
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

      if (!minimum || !annotations) return;

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
        if (!shift) {
          batch(() => {
            dispatch(
              setSelectedAnnotations({
                selectedAnnotations: annotationsInBox,
                selectedAnnotation: annotationsInBox[0],
              })
            );
            dispatch(
              setSelectedCategory({
                selectedCategory: annotationsInBox[0].categoryId,
              })
            );
          });
        } else {
          //only include if not already selected
          const additionalAnnotations = annotationsInBox.filter(
            (annotation: AnnotationType) => {
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

    if (!annotations || !annotations.length || !imageWidth || !imageHeight)
      return;

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

    let currentAnnotation: AnnotationType | undefined;

    if (overlappingAnnotationsIds.length > 1) {
      dispatch(
        applicationSlice.actions.setCurrentIndex({
          currentIndex:
            currentIndex + 1 === overlappingAnnotationsIds.length
              ? 0
              : currentIndex + 1,
        })
      );
      const nextAnnotationId = overlappingAnnotationsIds[currentIndex];

      currentAnnotation = annotations.find((annotation: AnnotationType) => {
        return annotation.id === nextAnnotationId;
      });
    } else {
      currentAnnotation = annotations.find((annotation: AnnotationType) => {
        return annotation.id === overlappingAnnotationsIds[0];
      });
      dispatch(
        applicationSlice.actions.setCurrentIndex({
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
          setSelectedCategory({
            selectedCategory: currentAnnotation.categoryId,
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
