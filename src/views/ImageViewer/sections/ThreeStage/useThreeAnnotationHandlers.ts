import { useCallback, useEffect, useRef, useState } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import { throttle } from "lodash";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import {
  selectAnnotationMode,
  selectToolType,
} from "views/ImageViewer/state/annotator/selectors";
import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/imageViewerDataSlice";
import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "views/ImageViewer/utils/enums";
import { usePointerTool } from "views/ImageViewer/hooks/usePointerTool";

import type { Point } from "utils/types";

import { screenToImage } from "./coords";
import { useThreeViewport } from "./ThreeViewportContext";

import type {
  AnnotationTool,
  ObjectAnnotationTool,
} from "views/ImageViewer/utils/tools";

/**
 * Raw-DOM pointer pipeline that drives the active {@link AnnotationTool} on the
 * ThreeStage. Replaces the Konva-typed `useStageHandlers`: no Konva event
 * objects, no touch/zoom-tool branches (deferred). Left-drag draws; alt/middle
 * drag is reserved for panning (handled by useThreePanZoom), so this bails while
 * panning. Listeners attach once and read the latest state via a ref.
 */
export const useThreeAnnotationHandlers = ({
  mountRef,
  annotationTool,
  isPanningRef,
  onDrawTick,
}: {
  mountRef: React.RefObject<HTMLDivElement | null>;
  annotationTool: AnnotationTool;
  isPanningRef: React.RefObject<boolean>;
  onDrawTick: () => void;
}) => {
  const dispatch = useDispatch();
  const toolType = useSelector(selectToolType);
  const annotationMode = useSelector(selectAnnotationMode);
  const selectedAnnotationsIds: string[] = [];
  const { getViewportState } = useThreeViewport();

  const [absolutePosition, setAbsolutePosition] = useState<Point | undefined>();
  const [outOfBounds, setOutOfBounds] = useState(true);

  const deselectAllAnnotations = useCallback(() => {
    batch(() => {
      dispatch(imageViewerDataSlice.actions.setSelectedAnnotationIds([]));
      dispatch(
        annotatorSlice.actions.setWorkingAnnotation({ annotation: undefined }),
      );
      dispatch(
        annotatorSlice.actions.setAnnotationState(AnnotationState.Blank),
      );
    });
  }, [dispatch, annotationTool]);

  const {
    onPointerMouseDown,
    handlePointerMouseMove,
    handlePointerMouseUp,
    minimum,
    maximum,
    selecting,
  } = usePointerTool(
    absolutePosition,
    deselectAllAnnotations,
    selectedAnnotationsIds,
    toolType,
  );

  // Latest-ref: DOM listeners are attached once but must call current values.
  const latest = useRef({
    toolType,
    annotationMode,
    annotationTool,
    getViewportState,
    onPointerMouseDown,
    handlePointerMouseMove,
    handlePointerMouseUp,
    deselectAllAnnotations,
    onDrawTick,
  });
  latest.current = {
    toolType,
    annotationMode,
    annotationTool,
    getViewportState,
    onPointerMouseDown,
    handlePointerMouseMove,
    handlePointerMouseUp,
    deselectAllAnnotations,
    onDrawTick,
  };

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const pointFromEvent = (
      e: MouseEvent,
    ): { point: Point; oob: boolean } | null => {
      const vp = latest.current.getViewportState();
      if (!vp) return null;
      const rect = el.getBoundingClientRect();
      return screenToImage(e.clientX - rect.left, e.clientY - rect.top, vp);
    };

    const skipTool = (t: ToolType) =>
      t === ToolType.Zoom || t === ToolType.ColorAdjustment;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || e.altKey || isPanningRef.current) return;
      const L = latest.current;
      if (skipTool(L.toolType)) return;
      const res = pointFromEvent(e);
      if (!res) return;
      setAbsolutePosition(res.point);
      setOutOfBounds(res.oob);

      if (L.toolType === ToolType.Pointer) {
        L.onPointerMouseDown(res.point);
        return;
      }
      if (L.annotationTool.annotationState === AnnotationState.Annotated) {
        L.annotationTool.deselect();
        if (L.annotationMode === AnnotationMode.New) L.deselectAllAnnotations();
      }
      if (res.oob) return;
      L.annotationTool.onMouseDown(res.point);
      L.onDrawTick();
    };

    const onMouseMove = throttle((e: MouseEvent) => {
      if (isPanningRef.current) return;
      const L = latest.current;
      const res = pointFromEvent(e);
      if (!res) return;
      setAbsolutePosition(res.point);
      setOutOfBounds(res.oob);
      if (skipTool(L.toolType)) return;
      if (L.toolType === ToolType.Pointer) {
        L.handlePointerMouseMove(res.point);
        return;
      }
      L.annotationTool.onMouseMove(res.point);
      L.onDrawTick();
    }, 5);

    const onMouseUp = async (e: MouseEvent) => {
      if (isPanningRef.current) return;
      const L = latest.current;
      if (skipTool(L.toolType)) return;
      const res = pointFromEvent(e);
      if (!res) return;
      if (L.toolType === ToolType.Pointer) {
        L.handlePointerMouseUp(res.point);
        return;
      }
      if (L.toolType === ToolType.ObjectAnnotation) {
        await (L.annotationTool as ObjectAnnotationTool).onMouseUp(res.point);
      } else {
        L.annotationTool.onMouseUp(res.point);
      }
      L.onDrawTick();
    };

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
    pointerSelection: { minimum, maximum, selecting },
  };
};
