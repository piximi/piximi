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

import { selectToolType } from "store/annotator/selectors";

import {
  selectActiveImageHeight,
  selectActiveImageWidth,
  selectActiveAnnotations,
} from "store/data";

import { DecodedAnnotationType, HotkeyView, Point, ToolType } from "types";

import {
  getAnnotationsInBox,
  getOverlappingAnnotations,
} from "utils/annotator";

const delta = 10;
export const usePointer = () => {
  let overlappingAnnotationsIds: Array<string> = [];

  const [dragging, setDragging] = useState<boolean>(false);
  const [minimum, setMinimum] = useState<Point | undefined>();
  const [maximum, setMaximum] = useState<Point | undefined>();
  const [selecting, setSelecting] = useState<boolean>(false);
  const [shift, setShift] = useState<boolean>(false);

  const dispatch = useDispatch();
  const toolType = useSelector(selectToolType);
  const selectedAnnotationIds = useSelector(selectSelectedAnnotationIds);
  const activeAnnotations = useSelector(selectActiveAnnotations);
  const imageWidth = useSelector(selectActiveImageWidth);
  const imageHeight = useSelector(selectActiveImageHeight);
  const currentIndex = useSelector(currentIndexSelector);

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
    setDragging(false);
    setMinimum(position);
    setSelecting(true);
  };

  const onMouseMove = (position: { x: number; y: number }) => {
    if (!position || !selecting || !minimum) return;

    setDragging(Math.abs(position.x - minimum.x) >= delta);
    setMaximum(position);
  };

  const onMouseUp = (position: { x: number; y: number }) => {
    if (!position || !selecting || !minimum) return;
    if (dragging) {
      // correct minimum or maximum in the case where user may have selected rectangle from right to left
      const maximumNew: { x: number; y: number } = {
        x: minimum.x > position.x ? minimum.x : position.x,
        y: minimum.y > position.y ? minimum.y : position.y,
      };
      const minimumNew: { x: number; y: number } = {
        x: minimum.x > position.x ? position.x : minimum.x,
        y: minimum.y > position.y ? position.y : minimum.y,
      };

      if (!minimumNew || !activeAnnotations.length) {
        setSelecting(false);
        return;
      }

      const scaledMinimum = {
        x: minimumNew.x,
        y: minimumNew.y,
      };
      const scaledMaximum = {
        x: maximumNew.x,
        y: maximumNew.y,
      };

      const annotationsInBox = getAnnotationsInBox(
        scaledMinimum,
        scaledMaximum,
        activeAnnotations
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
              return !selectedAnnotationIds.includes(annotation.id);
            }
          );
          dispatch(
            setSelectedAnnotationIds({
              annotationIds: [
                ...selectedAnnotationIds,
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

    setSelecting(false);
  };

  const onClick = (position: { x: number; y: number }) => {
    if (toolType !== ToolType.Pointer) return;

    if (!position) return;

    if (!activeAnnotations.length || !imageWidth || !imageHeight) return;

    const scaledCurrentPosition = {
      x: position.x,
      y: position.y,
    };

    overlappingAnnotationsIds = getOverlappingAnnotations(
      scaledCurrentPosition,
      activeAnnotations,
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

      currentAnnotation = activeAnnotations.find(
        (annotation: DecodedAnnotationType) => {
          return annotation.id === nextAnnotationId;
        }
      );
    } else {
      currentAnnotation = activeAnnotations.find(
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

    if (shift && !selectedAnnotationIds.includes(currentAnnotation.id)) {
      //include newly selected annotation if not already selected
      dispatch(
        setSelectedAnnotationIds({
          annotationIds: [...selectedAnnotationIds, currentAnnotation.id],
          workingAnnotationId: currentAnnotation.id,
        })
      );
    }
  };

  return {
    onMouseDown,
    onMouseUp,
    onMouseMove,
    onPointerClick: onClick,
    dragging,
    selecting,
    minimum,
    maximum,
  };
};
