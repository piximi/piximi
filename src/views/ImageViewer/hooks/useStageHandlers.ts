// ignore-no-logs
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import { throttle } from "lodash";

import { useZoom } from "./useZoom";
import { usePointerTool } from "./usePointerTool";

import { imageViewerSlice } from "store/imageViewer";
import { selectSelectedAnnotationIds } from "store/imageViewer/selectors";
import {
  selectAnnotationSelectionMode,
  selectToolType,
} from "store/annotator/selectors";
import { annotatorSlice } from "store/annotator";

import { AnnotationTool, ObjectAnnotationTool } from "utils/annotator/tools";

import { logger } from "utils/common/helpers";

import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "utils/annotator/enums";

import { Point } from "utils/annotator/types";

const transformerClassName = "Transformer";
const transformerButtonAttrNAme = "transformer-button";

export const useStageHandlers = (
  stageRef: React.RefObject<Konva.Stage> | null,
  annotationTool: AnnotationTool,
  positionByStage: Point | undefined,
  absolutePosition: Point | undefined,
  draggable: boolean,
  setDraggable: React.Dispatch<React.SetStateAction<boolean>>,
  annotationState: AnnotationState,
  outOfBounds: boolean,
  setCurrentMousePosition: () => void,
  getAbsolutePosition: () =>
    | {
        point: Point;
        oob: boolean;
      }
    | undefined,
  getPositionRelativeToStage: () => Point | undefined
) => {
  const selectionMode = useSelector(selectAnnotationSelectionMode);
  //const workingAnnotationEntity = useSelector(selectWorkingAnnotationNew);
  const dispatch = useDispatch();
  const toolType = useSelector(selectToolType);
  const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);

  const {
    handleZoomDblClick,
    handleZoomMouseDown,
    handleZoomMouseMove,
    handleZoomMouseUp,
    handleZoomScroll,
    handlePinchZoom,
    setOldDist,
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
      imageViewerSlice.actions.setSelectedAnnotationIds({
        annotationIds: [],
        workingAnnotationId: undefined,
      })
    );
    dispatch(
      annotatorSlice.actions.setAnnotationState({
        annotationState: AnnotationState.Blank,
        annotationTool,
      })
    );
  }, [dispatch, annotationTool]);
  const { onPointerMouseDown, handlePointerMouseMove, handlePointerMouseUp } =
    usePointerTool(
      absolutePosition,
      deselectAllAnnotations,
      selectedAnnotationsIds,
      toolType
    );

  /*
   * * MOUSE EVENTS * *
   */

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
        if (annotationState === AnnotationState.Annotated) {
          deselectAnnotation();
          if (selectionMode === AnnotationMode.New) {
            deselectAllAnnotations();
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

  /*
   * * HANDLE MOUSE UP * *
   */

  const handleMouseUp = useMemo(() => {
    const func = async (event: KonvaEventObject<MouseEvent>) => {
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
    return (event: KonvaEventObject<MouseEvent>) => throttled(event);
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
   * * TOUCH EVENTS * *
   */

  const handleTouchStart = (event: KonvaEventObject<TouchEvent>) => {
    process.env.NODE_ENV !== "production" &&
      process.env.REACT_APP_LOG_LEVEL === "2" &&
      logger(event);

    if (
      !event.target.getParent() ||
      event.target.getParent().className === transformerClassName ||
      event.target.attrs.name === transformerButtonAttrNAme
    )
      return;
    memoizedOnTouchStart(event as KonvaEventObject<TouchEvent>);
  };
  const memoizedOnTouchStart = useMemo(() => {
    const func = (event: KonvaEventObject<TouchEvent>) => {
      if (
        !stageRef ||
        !stageRef.current ||
        draggable ||
        toolType === ToolType.ColorAdjustment
      )
        return;
      if (event.evt.touches.length > 1) {
        annotationTool.deselect();
        if (event.evt.touches.length === 3) {
          if (!draggable) {
            setDraggable(true);
          }
        }

        return;
      }
      const absolutePosition = getAbsolutePosition();
      if (!absolutePosition) return;
      const positionByStage = getPositionRelativeToStage();
      if (!positionByStage) return;
      setCurrentMousePosition();

      if (toolType === ToolType.Zoom) {
        handleZoomMouseDown(positionByStage, event);
        return;
      } else {
        if (toolType === ToolType.Pointer) {
          onPointerMouseDown(absolutePosition.point);
        }
        if (annotationState === AnnotationState.Annotated) {
          deselectAnnotation();
          if (selectionMode === AnnotationMode.New) {
            deselectAllAnnotations();
            return;
          }
        }
        if (absolutePosition.oob) return;

        annotationTool.onMouseDown(absolutePosition.point);
      }
    };
    const throttled = throttle(func, 5);
    return (event: KonvaEventObject<TouchEvent>) => throttled(event);
  }, [
    onPointerMouseDown,
    handleZoomMouseDown,
    draggable,
    annotationState,
    annotationTool,
    deselectAllAnnotations,
    deselectAnnotation,
    selectionMode,
    toolType,
    stageRef,
    getAbsolutePosition,
    getPositionRelativeToStage,
    setCurrentMousePosition,
    setDraggable,
  ]);

  const handleTouchMove = useMemo(() => {
    const func = (event: KonvaEventObject<TouchEvent>) => {
      if (!stageRef || !stageRef.current) return;
      if (event.evt.touches.length === 2) {
        handlePinchZoom(event);
        return;
      } else if (draggable) {
        return;
      }
      setCurrentMousePosition();
      if (!absolutePosition) return;

      if (toolType === ToolType.Pointer) {
        handlePointerMouseMove(absolutePosition);
      }
      annotationTool.onMouseMove(absolutePosition);
    };
    const throttled = throttle(func, 5);
    return (event: KonvaEventObject<TouchEvent>) => throttled(event);
  }, [
    stageRef,
    handlePointerMouseMove,
    setCurrentMousePosition,
    absolutePosition,
    annotationTool,
    toolType,
    draggable,
    handlePinchZoom,
  ]);

  const handleTouchEnd = useMemo(() => {
    const func = async (event: KonvaEventObject<TouchEvent>) => {
      setOldDist(undefined);
      if (draggable) {
        setDraggable(false);
      }
      const absolutePosition = getAbsolutePosition();
      if (!absolutePosition) return;
      const positionByStage = getPositionRelativeToStage();
      if (!positionByStage) return;
      setCurrentMousePosition();
      if (toolType === ToolType.Zoom) {
        handleZoomMouseUp(
          positionByStage,
          event as KonvaEventObject<TouchEvent>
        );
        setCurrentMousePosition();
      } else {
        if (toolType === ToolType.Pointer) {
          handlePointerMouseUp(absolutePosition.point);
        } else if (toolType === ToolType.ObjectAnnotation) {
          await (annotationTool as ObjectAnnotationTool).onMouseUp(
            absolutePosition.point
          );
        }
        annotationTool.onMouseUp(absolutePosition.point);
      }
    };
    const throttled = throttle(func, 10);
    return (event: KonvaEventObject<TouchEvent>) => throttled(event);
  }, [
    handlePointerMouseUp,
    handleZoomMouseUp,
    setCurrentMousePosition,
    annotationTool,
    toolType,
    getAbsolutePosition,
    getPositionRelativeToStage,
    setDraggable,
    draggable,
    setOldDist,
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

  return {
    handleMouseUp,
    handleMouseMove,
    handleTouchMove,
    handleZoomWheel,
    handleDblClickToZoom,
    handleMouseDown,
    handleTouchStart,
    handleTouchEnd,
  };
};
