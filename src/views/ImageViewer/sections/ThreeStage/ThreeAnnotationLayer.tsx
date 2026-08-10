import { useCallback, useState } from "react";

import { useAnnotationTool, useAnnotationState } from "views/ImageViewer/hooks";

import { useThreeViewport } from "./ThreeViewportContext";
import { useThreeAnnotationHandlers } from "./useThreeAnnotationHandlers";
import { useThreeAnnotationMeshes } from "./useThreeAnnotationMeshes";
import { AnnotationSvgOverlay } from "./AnnotationSvgOverlay";

import type { Image as IJSImage } from "image-js-latest";

/**
 * The annotation layer for the ThreeStage. Rendered under ThreeViewportProvider
 * (once the renderer/scene/camera exist) so it can read the camera. Owns the
 * active tool + its Redux lifecycle, the pointer pipeline, the committed
 * annotation meshes, and the SVG authoring overlay.
 */
export const ThreeAnnotationLayer = ({
  mountRef,
  isPanningRef,
  ijsImage,
  stageWidth,
  stageHeight,
  imageWidth,
  imageHeight,
}: {
  mountRef: React.RefObject<HTMLDivElement | null>;
  isPanningRef: React.RefObject<boolean>;
  ijsImage: IJSImage | null;
  stageWidth: number;
  stageHeight: number;
  imageWidth: number;
  imageHeight: number;
}) => {
  const { sceneRef, requestRender } = useThreeViewport();

  const [drawTick, setDrawTick] = useState(0);
  const bumpDrawTick = useCallback(() => setDrawTick((t) => t + 1), []);

  const annotationTool = useAnnotationTool(ijsImage);
  useAnnotationState(annotationTool);

  const { absolutePosition, outOfBounds } = useThreeAnnotationHandlers({
    mountRef,
    annotationTool,
    isPanningRef,
    onDrawTick: bumpDrawTick,
  });

  useThreeAnnotationMeshes({
    sceneRef,
    requestRender,
    imageWidth,
    imageHeight,
  });

  return (
    <AnnotationSvgOverlay
      annotationTool={annotationTool}
      drawTick={drawTick}
      absolutePosition={absolutePosition}
      outOfBounds={outOfBounds}
      stageWidth={stageWidth}
      stageHeight={stageHeight}
    />
  );
};
