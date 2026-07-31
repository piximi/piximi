import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { useSelector } from "react-redux";

import {
  selectAnnotationState,
  selectPenSelectionBrushSize,
  selectToolType,
} from "views/ImageViewer/state/annotator/selectors";
import { selectFullWorkingAnnotation } from "views/ImageViewer/state/annotator/reselectors";
import { AnnotationState, ToolType } from "views/ImageViewer/utils/enums";

import type { Point } from "utils/types";

import { useThreeViewport } from "../ThreeViewportContext";
import { MarchingAntsKeyframes } from "./marchingAnts";
import { RectanglePreview } from "./previews/RectanglePreview";
import { EllipsePreview } from "./previews/EllipsePreview";
import { PolylinePreview } from "./previews/PolylinePreview";
import { PenPreview } from "./previews/PenPreview";
import { ColorPreview } from "./previews/ColorPreview";
import { QuickPreview } from "./previews/QuickPreview";
import { WorkingAnnotationImage } from "./WorkingAnnotationImage";
import { SelectionBorder, SelectionButtons } from "./SelectionChrome";
import { BrushCursor } from "./BrushCursor";

import type {
  AnnotationTool,
  ColorAnnotationTool,
  EllipticalAnnotationTool,
  LassoAnnotationTool,
  PenAnnotationTool,
  PolygonalAnnotationTool,
  QuickAnnotationTool,
  RectangularAnnotationTool,
} from "views/ImageViewer/utils/tools";

const LivePreview = ({
  operator,
  toolType,
}: {
  operator: AnnotationTool;
  toolType: ToolType;
}) => {
  switch (toolType) {
    case ToolType.RectangularAnnotation:
    case ToolType.ThresholdAnnotation:
      return (
        <RectanglePreview operator={operator as RectangularAnnotationTool} />
      );
    case ToolType.EllipticalAnnotation:
      return <EllipsePreview operator={operator as EllipticalAnnotationTool} />;
    case ToolType.PolygonalAnnotation:
      return <PolylinePreview operator={operator as PolygonalAnnotationTool} />;
    case ToolType.LassoAnnotation:
      return <PolylinePreview operator={operator as LassoAnnotationTool} />;
    case ToolType.PenAnnotation:
      return <PenPreview operator={operator as PenAnnotationTool} />;
    case ToolType.ColorAnnotation:
      return <ColorPreview operator={operator as ColorAnnotationTool} />;
    case ToolType.QuickAnnotation:
      return <QuickPreview operator={operator as QuickAnnotationTool} />;
    default:
      return null;
  }
};

/**
 * SVG authoring overlay over the WebGL canvas. Owns the transient annotation UI:
 * live drawing preview, the working (unconfirmed) mask, selection chrome, and
 * the pen cursor. A single `<g transform>` mirrors the camera (updated
 * imperatively on camera changes), so children draw in image coordinates. The
 * svg is pointer-events:none so drawing/pan/zoom reach the canvas beneath; only
 * the confirm/cancel buttons re-enable pointer events.
 */
export const AnnotationSvgOverlay = ({
  annotationTool,
  drawTick,
  absolutePosition,
  outOfBounds,
  stageWidth,
  stageHeight,
}: {
  annotationTool: AnnotationTool;
  drawTick: number;
  absolutePosition: Point | undefined;
  outOfBounds: boolean;
  stageWidth: number;
  stageHeight: number;
}) => {
  const toolType = useSelector(selectToolType);
  const annotationState = useSelector(selectAnnotationState);
  const brushSize = useSelector(selectPenSelectionBrushSize);
  const workingAnnotation = useSelector(selectFullWorkingAnnotation);

  const { onCameraChange, getImageToScreenTransform } = useThreeViewport();
  const gRef = useRef<SVGGElement>(null);

  const applyTransform = useCallback(() => {
    const g = gRef.current;
    const t = getImageToScreenTransform();
    if (g && t) {
      g.setAttribute(
        "transform",
        `translate(${t.tx} ${t.ty}) scale(${t.scale})`,
      );
    }
  }, [getImageToScreenTransform]);

  // Re-apply after each render (covers dim changes) and on camera pan/zoom.
  useLayoutEffect(() => {
    applyTransform();
  });
  useEffect(
    () => onCameraChange(applyTransform),
    [onCameraChange, applyTransform],
  );

  const isAnnotating = annotationState === AnnotationState.Annotating;

  return (
    <svg
      width={stageWidth}
      height={stageHeight}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <MarchingAntsKeyframes />
      <g ref={gRef} data-draw-tick={drawTick}>
        {(isAnnotating || toolType === ToolType.QuickAnnotation) && (
          <LivePreview operator={annotationTool} toolType={toolType} />
        )}
        <WorkingAnnotationImage
          imageWidth={annotationTool.image.width}
          imageHeight={annotationTool.image.height}
        />
        {workingAnnotation && (
          <SelectionBorder boundingBox={workingAnnotation.boundingBox} />
        )}
        {toolType === ToolType.PenAnnotation && !outOfBounds && (
          <BrushCursor position={absolutePosition} brushSize={brushSize} />
        )}
      </g>
      {workingAnnotation && (
        <SelectionButtons
          annotationTool={annotationTool}
          boundingBox={workingAnnotation.boundingBox}
        />
      )}
    </svg>
  );
};
