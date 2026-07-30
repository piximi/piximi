import { useCallback, useState } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import { useHotkeys } from "hooks/useHotkeys";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { getOverlappingAnnotations } from "views/ImageViewer/utils";
import { getAnnotationsInBox } from "views/ImageViewer/utils/imageHelper";
import { ToolType } from "views/ImageViewer/utils/enums";
import { selectAllActiveAnnotations } from "@ImageViewer/state/image-viewer-data/reselectors";
import type { ExtendedAnnotationObject } from "store/dataV2/types";
import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/imageViewerDataSlice";
import { selectActiveImageId } from "@ImageViewer/state/image-viewer-data/selectors";

import { HotkeyContext } from "utils/enums";
import type { Point } from "utils/types";

const delta = 10;

const selectAnnotations = ({
  position,
  activeAnnotations,
  selectedAnnotationsIds,
  minimum,
  addToExisting,
}: {
  position: Point;
  activeAnnotations: ExtendedAnnotationObject[];
  selectedAnnotationsIds: string[];
  addToExisting: boolean;
  minimum: Point;
}) => {
  // correct minimum or maximum in the case where user may have selected rectangle from right to left

  const minimumNew: { x: number; y: number } = {
    x: minimum.x > position.x ? position.x : minimum.x,
    y: minimum.y > position.y ? position.y : minimum.y,
  };
  if (!minimumNew) return [];
  const maximumNew: { x: number; y: number } = {
    x: minimum.x > position.x ? minimum.x : position.x,
    y: minimum.y > position.y ? minimum.y : position.y,
  };

  const annotationsInBox = getAnnotationsInBox(
    minimumNew,
    maximumNew,
    activeAnnotations,
  );
  if (!annotationsInBox) return [];

  const newSelectedAnnotations: string[] = annotationsInBox.map((an) => an.id);
  if (addToExisting) {
    return [...new Set([...selectedAnnotationsIds, ...newSelectedAnnotations])];
  } else {
    return newSelectedAnnotations;
  }
};

export const usePointerTool = (
  absolutePosition: any,
  deselectAllAnnotations: any,
  selectedAnnotationsIds: any,
  toolType: any,
) => {
  const dispatch = useDispatch();
  const activeImageId = useSelector(selectActiveImageId);
  const activeAnnotations = useSelector(selectAllActiveAnnotations);
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

  const selectEnclosedAnnotations = useCallback(
    (position: { x: number; y: number }) => {
      if (!position || !selecting || !minimum || activeAnnotations.length === 0)
        return;
      // correct minimum or maximum in the case where user may have selected rectangle from right to left
      const selectedAnnotations = selectAnnotations({
        position,
        activeAnnotations,
        minimum,
        selectedAnnotationsIds,
        addToExisting: shift,
      });
      if (selectedAnnotations.length > 0)
        batch(() => {
          dispatch(
            imageViewerDataSlice.actions.setSelectedAnnotationIds(
              selectedAnnotations,
            ),
          );
        });

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
    let currentAnnotation: ExtendedAnnotationObject | undefined;

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

      currentAnnotation = activeAnnotations.find((annotation) => {
        return annotation.id === nextAnnotationId;
      });
    } else {
      currentAnnotation = activeAnnotations.find((annotation) => {
        return annotation.id === overlappingAnnotationIds[0];
      });
      setCurrentIndex(0);
    }

    if (!currentAnnotation) return;

    if (!shift) {
      batch(() => {
        dispatch(
          imageViewerDataSlice.actions.setSelectedAnnotationIds([
            currentAnnotation!.id,
          ]),
        );
      });
    }

    if (shift && !selectedAnnotationsIds.includes(currentAnnotation.id)) {
      //include newly selected annotation if not already selected
      dispatch(
        imageViewerDataSlice.actions.setSelectedAnnotationIds([
          ...selectedAnnotationsIds,
          currentAnnotation.id,
        ]),
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
