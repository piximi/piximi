// ignore-no-logs
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import { throttle } from "lodash";

import {
  useZoom,
  //useAnnotatorKeyboardShortcuts
} from "hooks";

import {
  setSelectedAnnotationIds,
  selectSelectedAnnotationIds,
  //selectWorkingAnnotation,
} from "store/slices/imageViewer";

import {
  selectAnnotationSelectionMode,
  selectToolType,
} from "store/slices/annotator/selectors";

import { annotatorSlice } from "store/slices/annotator";

import {
  Point,
  ToolType,
  AnnotationStateType,
  AnnotationModeType,
} from "types";

import { AnnotationTool, ObjectAnnotationTool } from "annotator-tools";
import { usePointerToolNew } from "hooks/usePointerTool";
import { logger } from "utils/common/logger";

const transformerClassName = "Transformer";
const transformerButtonAttrNAme = "transformer-button";

export const useStageHandlersNew = (
  stageRef: React.RefObject<Konva.Stage> | null,
  annotationTool: AnnotationTool,
  positionByStage: Point | undefined,
  absolutePosition: Point | undefined,
  draggable: boolean,
  annotationState: AnnotationStateType,
  outOfBounds: boolean,
  setCurrentMousePosition: () => void
) => {
  const selectionMode = useSelector(selectAnnotationSelectionMode);
  //const workingAnnotationEntity = useSelector(selectWorkingAnnotation);
  const dispatch = useDispatch();
  const toolType = useSelector(selectToolType);
  const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);

  const {
    handleZoomDblClick,
    handleZoomMouseDown,
    handleZoomMouseMove,
    handleZoomMouseUp,
    handleZoomScroll,
    //resetZoomSelection,
  } = useZoom(stageRef?.current);

  const deselectAnnotation = useCallback(() => {
    annotationTool.deselect();
  }, [annotationTool]);

  //   const deleteAnnotations = (
  //     annotationIds: Array<string>,
  //     stagedAnnotations: Array<DecodedAnnotationType>
  //   ) => {};

  const deselectAllAnnotations = useCallback(() => {
    dispatch(
      setSelectedAnnotationIds({
        annotationIds: [],
        workingAnnotationId: undefined,
      })
    );
    dispatch(
      annotatorSlice.actions.setAnnotationState({
        annotationState: AnnotationStateType.Blank,
        annotationTool,
      })
    );
  }, [dispatch, annotationTool]);
  const {
    onPointerMouseDown,
    handlePointerMouseMove,
    handlePointerMouseUp,
    dragging,
    minimum,
    maximum,
    selecting,
  } = usePointerToolNew(
    absolutePosition,
    deselectAllAnnotations,
    selectedAnnotationsIds,
    toolType
  );

  const handleMouseDown = (
    event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
  ) => {
    process.env.NODE_ENV !== "production" &&
      process.env.REACT_APP_LOG_LEVEL === "2" &&
      logger(event);
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
      if (
        !stageRef ||
        !stageRef.current ||
        !positionByStage ||
        !absolutePosition ||
        draggable ||
        toolType === ToolType.ColorAdjustment
      )
        return;

      if (toolType === ToolType.Zoom) {
        handleZoomMouseDown(positionByStage, event);
        return;
      } else {
        if (toolType === ToolType.Pointer) {
          onPointerMouseDown(absolutePosition!);
        }
        if (annotationState === AnnotationStateType.Annotated) {
          deselectAnnotation();
          if (selectionMode === AnnotationModeType.New) {
            deselectAllAnnotations();
            return;
          }
        }
        if (outOfBounds) return;
        annotationTool.onMouseDown(absolutePosition);
      }
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
    selectionMode,
    toolType,
    outOfBounds,
    stageRef,
  ]);

  /*
   * * HANDLE MOUSE MOVE * *
   */

  const handleMouseMove = useMemo(() => {
    const func = (event: KonvaEventObject<MouseEvent>) => {
      if (!stageRef || !stageRef.current || draggable) return;
      setCurrentMousePosition();
      if (!positionByStage) return;
      if (toolType === ToolType.ColorAdjustment) return;
      if (toolType === ToolType.Zoom) {
        handleZoomMouseMove(positionByStage, event);
      } else {
        if (toolType === ToolType.Pointer) {
          handlePointerMouseMove(absolutePosition!);
        }
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

  /*
   * * HANDLE MOUSE UP * *
   */

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
      } else {
        if (toolType === ToolType.Pointer) {
          handlePointerMouseUp(absolutePosition);
        } else if (toolType === ToolType.ObjectAnnotation) {
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

  /*
   * * HANDLE ZOOM * *
   */

  const handleZoomWheel = (event: KonvaEventObject<WheelEvent>) => {
    handleZoomScroll(event);
    setCurrentMousePosition();
  };
  const handleDblClickToZoom = (event: KonvaEventObject<MouseEvent>) => {
    handleZoomDblClick(event);
    setCurrentMousePosition();
  };

  //   useAnnotatorKeyboardShortcuts({
  //     annotationTool,
  //     deleteAnnotations,
  //     deselectAllAnnotations,
  //     deselectAnnotation,
  //     resetZoomSelection,
  //     workingAnnotationEntity,
  //     selectedAnnotationsIds,
  //     selectionMode,
  //     toolType,
  //   });

  return {
    onPointerMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchMove,
    handleZoomWheel,
    handleDblClickToZoom,
    dragging,
    selecting,
    minimum,
    maximum,
    handleMouseDown,
  };
};
