import { useCallback, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { selectActiveAnnotations } from "store/data";
import { useHotkeys } from "hooks/useHotkeys";
import {
  activeImageIdSelector,
  imageViewerSlice,
  setSelectedAnnotationIds,
  setSelectedCategoryId,
} from "store/imageViewer";
import { setWorkingAnnotation } from "store/imageViewer/imageViewerSlice";
import { DecodedAnnotationType, HotkeyView, Point, ToolType } from "types";
import {
  getAnnotationsInBox,
  getOverlappingAnnotations,
} from "utils/annotator";

const delta = 10;

export const usePointerTool = (
  absolutePosition: any,
  deselectAllAnnotations: any,
  selectedAnnotationsIds: any,
  toolType: any
) => {
  const dispatch = useDispatch();
  const activeImageId = useSelector(activeImageIdSelector);
  const activeAnnotations = useSelector(selectActiveAnnotations);
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
    HotkeyView.Annotator,
    { keyup: true, keydown: true }
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
    []
  );

  const handlePointerMouseMove = useCallback(
    (position: { x: number; y: number }) => {
      if (!position || !selecting || !minimum) return;

      setDragging(Math.abs(position.x - minimum.x) >= delta);
      setMaximum(position);
    },
    [minimum, selecting]
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
        activeAnnotations
      );

      if (annotationsInBox.length) {
        let newSelectedAnnotations: string[] = annotationsInBox.map(
          (an) => an.id
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
            }
          );
          newSelectedAnnotations = [
            ...selectedAnnotationsIds,
            ...additionalAnnotations,
          ];
        }
        batch(() => {
          dispatch(
            setSelectedAnnotationIds({
              annotationIds: newSelectedAnnotations,
              workingAnnotationId: newSelectedAnnotations[0],
            })
          );
          dispatch(
            setWorkingAnnotation({
              annotation: activeAnnotations.filter(
                (annotation) => annotation.id === newSelectedAnnotations[0]
              )[0],
            })
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
    ]
  );

  const handleClick = useCallback(() => {
    if (
      toolType !== ToolType.Pointer ||
      !absolutePosition ||
      !activeAnnotations.length ||
      !activeImageId
    )
      return;

    let currentAnnotation: DecodedAnnotationType | undefined;

    const overlappingAnnotationIds = getOverlappingAnnotations(
      absolutePosition,
      activeAnnotations as DecodedAnnotationType[]
    );

    if (overlappingAnnotationIds.length === 0) {
      deselectAllAnnotations();
      dispatch(
        imageViewerSlice.actions.setWorkingAnnotation({
          annotation: undefined,
        })
      );
    } else if (overlappingAnnotationIds.length > 1) {
      setCurrentIndex((currentIndex) => {
        return currentIndex + 1 === overlappingAnnotationIds.length
          ? 0
          : currentIndex + 1;
      });

      const nextAnnotationId = overlappingAnnotationIds[currentIndex];

      currentAnnotation = activeAnnotations.find(
        (annotation: DecodedAnnotationType) => {
          return annotation.id === nextAnnotationId;
        }
      );
    } else {
      currentAnnotation = activeAnnotations.find(
        (annotation: DecodedAnnotationType) => {
          return annotation.id === overlappingAnnotationIds[0];
        }
      );
      setCurrentIndex(0);
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
          imageViewerSlice.actions.setWorkingAnnotation({
            annotation: currentAnnotation!,
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
          annotationIds: [...selectedAnnotationsIds, currentAnnotation.id],
          workingAnnotationId: currentAnnotation.id,
        })
      );
      dispatch(
        setWorkingAnnotation({
          annotation: currentAnnotation,
        })
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
    [dragging, minimum, selecting, selectEnclosedAnnotations, handleClick]
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
