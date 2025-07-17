import { useCallback, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { useHotkeys } from "hooks/useHotkeys";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { selectActiveImageId } from "views/ImageViewer/state/imageViewer/selectors";
import { selectUpdatedActiveAnnotations } from "views/ImageViewer/state/annotator/reselectors";

import { getOverlappingAnnotations } from "views/ImageViewer/utils";
import { getAnnotationsInBox } from "views/ImageViewer/utils/imageHelper";

import { ToolType } from "views/ImageViewer/utils/enums";
import { HotkeyContext } from "utils/enums";

import { ProtoAnnotationObject } from "views/ImageViewer/utils/types";
import { Point } from "utils/types";

const delta = 10;

export const usePointerTool = (
  absolutePosition: any,
  deselectAllAnnotations: any,
  selectedAnnotationsIds: any,
  toolType: any,
) => {
  const dispatch = useDispatch();
  const activeImageId = useSelector(selectActiveImageId);
  const activeAnnotations = useSelector(selectUpdatedActiveAnnotations);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shift, setShift] = useState<boolean>(false);
  const [dragging, setDragging] = useState<boolean>(false);
  const [minimum, setMinimum] = useState<Point | undefined>();
  const [maximum, setMaximum] = useState<Point | undefined>();
  const [selecting, setSelecting] = useState<boolean>(false);

  useHotkeys(
    "shift",
    (event) => {
      if (event.type === "keydown") {
        setShift(true);
      } else {
        setShift(false);
      }
    },
    HotkeyContext.AnnotatorView,
    { keyup: true, keydown: true },
    [],
  );

  /*
   * * HANDLE POINTER FUNCTIONS * *
   */

  const onPointerMouseDown = useCallback(
    (position: { x: number; y: number }) => {
      setDragging(false);
      setMinimum(position);
      setSelecting(true);
    },
    [],
  );

  const handlePointerMouseMove = useCallback(
    (position: { x: number; y: number }) => {
      if (!position || !selecting || !minimum) return;

      setDragging(Math.abs(position.x - minimum.x) >= delta);
      setMaximum(position);
    },
    [minimum, selecting],
  );

  const selectEnclosedAnnotations = useCallback(
    (position: { x: number; y: number }) => {
      if (!position || !selecting || !minimum) return;
      // correct minimum or maximum in the case where user may have selected rectangle from right to left

      const minimumNew: { x: number; y: number } = {
        x: minimum.x > position.x ? position.x : minimum.x,
        y: minimum.y > position.y ? position.y : minimum.y,
      };
      const maximumNew: { x: number; y: number } = {
        x: minimum.x > position.x ? minimum.x : position.x,
        y: minimum.y > position.y ? minimum.y : position.y,
      };

      if (!minimumNew || !activeAnnotations.length) {
        setSelecting(false);
        return;
      }

      const annotationsInBox = getAnnotationsInBox(
        minimumNew,
        maximumNew,
        activeAnnotations,
      );

      if (annotationsInBox.length) {
        let newSelectedAnnotations: string[] = annotationsInBox.map(
          (an) => an.id,
        );
        if (shift) {
          newSelectedAnnotations = [
            ...selectedAnnotationsIds,
            ...newSelectedAnnotations,
          ];
        } else {
          //only include if not already selected
          const additionalAnnotations = newSelectedAnnotations.filter(
            (id: string) => {
              return !selectedAnnotationsIds.includes(id);
            },
          );
          newSelectedAnnotations = [
            ...selectedAnnotationsIds,
            ...additionalAnnotations,
          ];
        }
        batch(() => {
          dispatch(
            annotatorSlice.actions.setSelectedAnnotationIds({
              annotationIds: newSelectedAnnotations,
              workingAnnotationId: newSelectedAnnotations[0],
            }),
          );
          dispatch(
            annotatorSlice.actions.setWorkingAnnotation({
              annotation: activeAnnotations.filter(
                (annotation) => annotation.id === newSelectedAnnotations[0],
              )[0],
            }),
          );
        });
      }

      setSelecting(false);
    },
    [
      activeAnnotations,
      dispatch,
      minimum,
      selectedAnnotationsIds,
      selecting,
      shift,
    ],
  );

  const handleClick = useCallback(() => {
    if (
      toolType !== ToolType.Pointer ||
      !absolutePosition ||
      !activeAnnotations.length ||
      !activeImageId
    )
      return;
    let currentAnnotation: ProtoAnnotationObject | undefined;

    const overlappingAnnotationIds = getOverlappingAnnotations(
      absolutePosition,
      activeAnnotations,
    );

    if (overlappingAnnotationIds.length === 0) {
      deselectAllAnnotations();
      dispatch(
        annotatorSlice.actions.setWorkingAnnotation({
          annotation: undefined,
        }),
      );
    } else if (overlappingAnnotationIds.length > 1) {
      setCurrentIndex((currentIndex) => {
        return currentIndex + 1 === overlappingAnnotationIds.length
          ? 0
          : currentIndex + 1;
      });

      const nextAnnotationId = overlappingAnnotationIds[currentIndex];

      currentAnnotation = activeAnnotations.find(
        (annotation: ProtoAnnotationObject) => {
          return annotation.id === nextAnnotationId;
        },
      );
    } else {
      currentAnnotation = activeAnnotations.find(
        (annotation: ProtoAnnotationObject) => {
          return annotation.id === overlappingAnnotationIds[0];
        },
      );
      setCurrentIndex(0);
    }

    if (!currentAnnotation) return;

    if (!shift) {
      batch(() => {
        dispatch(
          annotatorSlice.actions.setSelectedAnnotationIds({
            annotationIds: [currentAnnotation!.id],
            workingAnnotationId: currentAnnotation?.id,
          }),
        );
        dispatch(
          annotatorSlice.actions.setWorkingAnnotation({
            annotation: currentAnnotation!,
          }),
        );
        dispatch(
          imageViewerSlice.actions.setSelectedCategoryId({
            selectedCategoryId: currentAnnotation!.categoryId,
          }),
        );
      });
    }

    if (shift && !selectedAnnotationsIds.includes(currentAnnotation.id)) {
      //include newly selected annotation if not already selected
      dispatch(
        annotatorSlice.actions.setSelectedAnnotationIds({
          annotationIds: [...selectedAnnotationsIds, currentAnnotation.id],
          workingAnnotationId: currentAnnotation.id,
        }),
      );
      dispatch(
        annotatorSlice.actions.setWorkingAnnotation({
          annotation: currentAnnotation,
        }),
      );
    }
  }, [
    activeAnnotations,
    currentIndex,
    dispatch,
    activeImageId,
    selectedAnnotationsIds,
    shift,
    toolType,
    deselectAllAnnotations,
    absolutePosition,
  ]);

  const handlePointerMouseUp = useCallback(
    (position: { x: number; y: number }) => {
      if (!position || !selecting || !minimum) return;
      if (dragging) {
        // correct minimum or maximum in the case where user may have selected rectangle from right to left
        selectEnclosedAnnotations(position);
      } else {
        handleClick();
      }
      setDragging(false);
      setSelecting(false);
    },
    [dragging, minimum, selecting, selectEnclosedAnnotations, handleClick],
  );

  return {
    onPointerMouseDown,
    handlePointerMouseMove,
    handlePointerMouseUp,
    dragging,
    minimum,
    maximum,
    selecting,
  };
};
