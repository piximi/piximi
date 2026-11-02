import { useCallback, useEffect, useEffectEvent, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { throttle } from "lodash";

import { imageViewerDataSlice } from "@ImageViewer/state/imageViewerData";
import { useThreeViewport } from "@ImageViewer/contexts/ThreeViewportProvider";
import { annotatorSlice } from "@ImageViewer/state/annotator";
import {
  selectAnnotationMode,
  selectToolType,
} from "@ImageViewer/state/annotator/selectors";
import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "@ImageViewer/utils/enums";
import { screenToImage } from "@ImageViewer//utils/coords";

import { usePointerTool } from "./usePointerTool";

import type { Point } from "utils/types";

import type {
  AnnotationTool,
  ObjectAnnotationTool,
} from "@ImageViewer/core/annotation-tools";

const skipTool = (t: ToolType) => t === ToolType.ColorAdjustment;

/**
 * Raw-DOM pointer pipeline that drives the active {@link AnnotationTool} on the
 * ThreeStage. No touch/zoom-tool branches (deferred). Left-drag draws; alt/middle
 * drag is reserved for panning (handled by useThreePanZoom), so this bails while
 * panning. Listeners attach once and call effect events, which always see the latest render.
 */
export const useThreeAnnotationHandlers = ({
  mountRef,
  annotationTool,
  isPanningRef,
  onDrawTick,
  onCursorChange,
}: {
  mountRef: React.RefObject<HTMLDivElement | null>;
  annotationTool: AnnotationTool;
  isPanningRef: React.RefObject<boolean>;
  onDrawTick: () => void;
  onCursorChange: (cursor: { point?: Point; oob: boolean }) => void;
}) => {
  const dispatch = useDispatch();
  const toolType = useSelector(selectToolType);
  const annotationMode = useSelector(selectAnnotationMode);
  const { getViewportState } = useThreeViewport();

  const [absolutePosition, setAbsolutePosition] = useState<Point | undefined>();
  const [outOfBounds, setOutOfBounds] = useState(true);

  const deselectAllAnnotations = useCallback(() => {
    // Clears the whole selection layer — criterion and manual overrides alike.
    dispatch(imageViewerDataSlice.actions.clearSelectionLayer());
    dispatch(annotatorSlice.actions.setWorkingAnnotation(undefined));
    dispatch(annotatorSlice.actions.setAnnotationState(AnnotationState.Blank));
  }, [dispatch]);

  const {
    onPointerMouseDown,
    handlePointerMouseMove,
    handlePointerMouseUp,
    isPickingTarget,
    pickTargetAt,
  } = usePointerTool(absolutePosition, deselectAllAnnotations, toolType);
  const applyCursor = (res: { point?: Point; oob: boolean }) => {
    setAbsolutePosition(res.point);
    setOutOfBounds(res.oob);
    onCursorChange?.(res);
  };

  const pointFromEvent = (e: MouseEvent, el: HTMLDivElement) => {
    const vp = getViewportState();
    if (!vp) return null;
    const rect = el.getBoundingClientRect();
    return screenToImage(e.clientX - rect.left, e.clientY - rect.top, vp);
  };

  const handleMouseDown = useEffectEvent(
    (e: MouseEvent, el: HTMLDivElement) => {
      if (e.button !== 0 || e.altKey || isPanningRef.current) return;

      if (skipTool(toolType)) return;
      const res = pointFromEvent(e, el);
      if (!res) return;
      applyCursor(res);

      // An outstanding target pick takes priority over drawing: the stroke that
      // needs the target already exists, so starting a new one would discard it.
      if (isPickingTarget) {
        pickTargetAt(res.point);
        return;
      }
      if (toolType === ToolType.Pointer) {
        onPointerMouseDown(res.point);
        annotationTool.onMouseDown(res.point);
        onDrawTick();
        return;
      }

      if (annotationTool.annotationState === AnnotationState.Annotated) {
        annotationTool.deselect();
        if (annotationMode === AnnotationMode.New) deselectAllAnnotations();
      }
      if (res.oob) return;
      annotationTool.onMouseDown(res.point);
      onDrawTick();
    },
  );
  const handleMouseMove = useEffectEvent(
    (e: MouseEvent, el: HTMLDivElement) => {
      if (isPanningRef.current) return;

      const res = pointFromEvent(e, el);
      if (!res) return;
      applyCursor(res);
      if (skipTool(toolType)) return;
      if (toolType === ToolType.Pointer) {
        annotationTool.onMouseMove(res.point);
        onDrawTick();
        handlePointerMouseMove(res.point);
        return;
      }
      annotationTool.onMouseMove(res.point);
      onDrawTick();
    },
  );

  const handleMouseUp = useEffectEvent(
    async (e: MouseEvent, el: HTMLDivElement) => {
      if (isPanningRef.current) return;

      if (skipTool(toolType)) return;
      const res = pointFromEvent(e, el);
      if (!res) return;
      if (toolType === ToolType.Pointer) {
        handlePointerMouseUp(res.point);
        annotationTool.deselect();
        onDrawTick();
        return;
      }
      if (toolType === ToolType.ObjectAnnotation) {
        await (annotationTool as ObjectAnnotationTool).onMouseUp(res.point);
      } else {
        annotationTool.onMouseUp(res.point);
      }
      onDrawTick();
    },
  );

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => handleMouseDown(e, el);

    const onMouseMove = throttle((e: MouseEvent) => handleMouseMove(e, el), 5);

    const onMouseUp = (e: MouseEvent) => handleMouseUp(e, el);

    el.addEventListener("mousedown", onMouseDown);
    // Move only over the canvas (avoids re-rendering while the cursor is over
    // other UI); release on window so drags that end off-canvas still finalize.
    el.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      onMouseMove.cancel();
    };
  }, [mountRef, isPanningRef]);

  return {
    absolutePosition,
    outOfBounds,
  };
};
