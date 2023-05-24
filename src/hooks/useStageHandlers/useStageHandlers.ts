import { useCallback, useMemo, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import { throttle } from "lodash";

import { useHotkeys, useZoom, useAnnotatorKeyboardShortcuts } from "hooks";

import {
  imageViewerSlice,
  currentIndexSelector,
  setSelectedAnnotationIds,
  setSelectedCategoryId,
  selectSelectedAnnotationIds,
  activeImageIdSelector,
} from "store/imageViewer";

import {
  selectAnnotationSelectionMode,
  selectToolType,
} from "store/annotator/selectors";

import { selectActiveAnnotations, selectWorkingAnnotation } from "store/data";
import { annotatorSlice } from "store/annotator";

import {
  DecodedAnnotationType,
  HotkeyView,
  Point,
  ToolType,
  AnnotationStateType,
  AnnotationModeType,
} from "types";

import {
  getAnnotationsInBox,
  getOverlappingAnnotations,
} from "utils/annotator";
import { AnnotationTool, ObjectAnnotationTool } from "annotator-tools";

const delta = 10;
const transformerClassName = "Transformer";
const transformerButtonAttrNAme = "transformer-button";

export const useStageHandlers = (
  stageRef: React.RefObject<Konva.Stage> | null,
  annotationTool: AnnotationTool,
  positionByStage: Point | undefined,
  absolutePosition: Point | undefined,
  draggable: boolean,
  annotationState: AnnotationStateType,
  outOfBounds: boolean,
  setCurrentMousePosition: () => void
) => {
  const [firstMouseDown, setFirstMouseDown] = useState(false);
  const [dragging, setDragging] = useState<boolean>(false);
  const [minimum, setMinimum] = useState<Point | undefined>();
  const [maximum, setMaximum] = useState<Point | undefined>();
  const [selecting, setSelecting] = useState<boolean>(false);
  const [shift, setShift] = useState<boolean>(false);
  const selectionMode = useSelector(selectAnnotationSelectionMode);
  const workingAnnotation = useSelector(selectWorkingAnnotation);
  const dispatch = useDispatch();
  const toolType = useSelector(selectToolType);
  const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);
  const activeAnnotations = useSelector(selectActiveAnnotations);
  const activeImageId = useSelector(activeImageIdSelector);
  const currentIndex = useSelector(currentIndexSelector);

  const {
    handleZoomDblClick,
    handleZoomMouseDown,
    handleZoomMouseMove,
    handleZoomMouseUp,
    handleZoomScroll,
    resetZoomSelection,
  } = useZoom(stageRef?.current);

  const deselectAnnotation = useCallback(() => {
    if (!annotationTool) {
      console.log("deselect me");
      dispatch(
        annotatorSlice.actions.setAnnotationState({
          annotationState: AnnotationStateType.Blank,
          annotationTool,
        })
      );
      return;
    }
    annotationTool.deselect();
  }, [annotationTool, dispatch]);

  const deleteAnnotations = (
    annotationIds: Array<string>,
    stagedAnnotations: Array<DecodedAnnotationType>
  ) => {};

  const deselectAllAnnotations = useCallback(() => {
    dispatch(
      setSelectedAnnotationIds({
        annotationIds: [],
        workingAnnotationId: undefined,
      })
    );
  }, [dispatch]);

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
  const handlePointerMouseUp = useCallback(
    (position: { x: number; y: number }) => {
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
                return !selectedAnnotationsIds.includes(annotation.id);
              }
            );
            dispatch(
              setSelectedAnnotationIds({
                annotationIds: [
                  ...selectedAnnotationsIds,
                  ...additionalAnnotations.map((an) => an.id),
                ],
                workingAnnotationId: annotationsInBox[0].id,
              })
            );
          }
        }
      }

      setSelecting(false);
    },
    [
      activeAnnotations,
      dispatch,
      dragging,
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
    const overlappingAnnotationIds = getOverlappingAnnotations(
      absolutePosition,
      activeAnnotations
    );
    if (overlappingAnnotationIds.length === 0) {
      deselectAllAnnotations();
      return;
    }

    let currentAnnotation: DecodedAnnotationType | undefined;

    if (overlappingAnnotationIds.length > 1) {
      dispatch(
        imageViewerSlice.actions.setCurrentIndex({
          currentIndex:
            currentIndex + 1 === overlappingAnnotationIds.length
              ? 0
              : currentIndex + 1,
        })
      );
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
          annotationIds: [...selectedAnnotationsIds, currentAnnotation.id],
          workingAnnotationId: currentAnnotation.id,
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
  const handleMouseDown = (
    event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
  ) => {
    process.env.NODE_ENV !== "production" &&
      process.env.REACT_APP_LOG_LEVEL === "2" &&
      console.log(event);
    if (
      !event.target.getParent() ||
      event.target.getParent().className === transformerClassName ||
      event.target.attrs.name === transformerButtonAttrNAme
    )
      return;
    memoizedOnMouseDown(event as KonvaEventObject<MouseEvent>);
  };
  const memoizedOnMouseDown = useMemo(() => {
    const func = (event: KonvaEventObject<MouseEvent>) => {
      if (!firstMouseDown) {
        setFirstMouseDown(true);
      }
      if (
        !stageRef ||
        !stageRef.current ||
        !positionByStage ||
        !absolutePosition ||
        draggable ||
        toolType === ToolType.ColorAdjustment
      )
        return;

      if (toolType === ToolType.Pointer) {
        onPointerMouseDown(absolutePosition!);
        return;
      } else if (toolType === ToolType.Zoom) {
        handleZoomMouseDown(positionByStage!, event);
        return;
      }
      if (annotationState === AnnotationStateType.Annotated) {
        deselectAnnotation();
        if (selectionMode === AnnotationModeType.New) {
          deselectAllAnnotations();
          return;
        }
      }
      if (!annotationTool || outOfBounds) return;
      annotationTool.onMouseDown(absolutePosition);
    };
    const throttled = throttle(func, 5);
    return (event: KonvaEventObject<MouseEvent>) => throttled(event);
  }, [
    onPointerMouseDown,
    handleZoomMouseDown,
    absolutePosition,
    positionByStage,
    draggable,
    annotationState,
    annotationTool,
    deselectAllAnnotations,
    deselectAnnotation,
    firstMouseDown,
    selectionMode,
    toolType,
    outOfBounds,
    stageRef,
  ]);
  const handleMouseMove = useMemo(() => {
    const func = (event: KonvaEventObject<MouseEvent>) => {
      if (!stageRef || !stageRef.current || draggable) return;
      setCurrentMousePosition();
      if (!positionByStage) return;
      if (toolType === ToolType.ColorAdjustment) return;
      if (toolType === ToolType.Zoom) {
        handleZoomMouseMove(positionByStage, event);
      } else if (toolType === ToolType.Pointer) {
        handlePointerMouseMove(absolutePosition!);
      } else {
        if (!annotationTool) return;
        annotationTool.onMouseMove(absolutePosition!);
      }
    };
    const throttled = throttle(func, 5);
    return (event: KonvaEventObject<MouseEvent>) => throttled(event);
  }, [
    stageRef,
    handlePointerMouseMove,
    handleZoomMouseMove,
    setCurrentMousePosition,
    positionByStage,
    draggable,
    annotationTool,
    toolType,
    absolutePosition,
  ]);

  const handleTouchMove = useMemo(() => {
    const func = (event: KonvaEventObject<TouchEvent>) => {
      if (!stageRef || !stageRef.current || draggable) return;
      setCurrentMousePosition();
      if (!absolutePosition) return;
      handlePointerMouseMove(absolutePosition);
    };
    const throttled = throttle(func, 5);
    return (event: KonvaEventObject<TouchEvent>) => throttled(event);
  }, [
    stageRef,
    handlePointerMouseMove,
    setCurrentMousePosition,
    absolutePosition,
    draggable,
  ]);

  const handleMouseUp = useMemo(() => {
    const func = async (
      event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
    ) => {
      if (!positionByStage || !absolutePosition || draggable) return;
      if (toolType === ToolType.Zoom) {
        handleZoomMouseUp(
          positionByStage,
          event as KonvaEventObject<MouseEvent>
        );
        setCurrentMousePosition();
      } else if (toolType === ToolType.Pointer) {
        handlePointerMouseUp(absolutePosition);
      } else {
        if (!annotationTool) return;
        if (toolType === ToolType.ObjectAnnotation) {
          await (annotationTool as ObjectAnnotationTool).onMouseUp(
            absolutePosition
          );
        }
        annotationTool.onMouseUp(absolutePosition);
      }
    };
    const throttled = throttle(func, 10);
    return (
      event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
    ) => throttled(event);
  }, [
    handlePointerMouseUp,
    handleZoomMouseUp,
    absolutePosition,
    positionByStage,
    setCurrentMousePosition,
    draggable,
    annotationTool,
    toolType,
  ]);

  const handleZoomWheel = (event: KonvaEventObject<WheelEvent>) => {
    handleZoomScroll(event);
    setCurrentMousePosition();
  };
  const handleDblClickToZoom = (event: KonvaEventObject<MouseEvent>) => {
    handleZoomDblClick(event);
    setCurrentMousePosition();
  };
  useAnnotatorKeyboardShortcuts({
    annotationTool,
    deleteAnnotations,
    deselectAllAnnotations,
    deselectAnnotation,
    resetZoomSelection,
    workingAnnotation,
    selectedAnnotationsIds,
    selectionMode,
    toolType,
  });

  return {
    onPointerMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchMove,
    handleClick,
    handleZoomWheel,
    handleDblClickToZoom,
    dragging,
    selecting,
    minimum,
    maximum,
    handleMouseDown,
  };
};
