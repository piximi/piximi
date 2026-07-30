import { useThreeViewport } from "./ThreeViewportContext";
import { useThreeAnnotationMeshes } from "./useThreeAnnotationMeshes";

import type { Image as IJSImage } from "image-js-latest";

/**
 * The annotation layer for the ThreeStage. Rendered under ThreeViewportProvider
 * (once the renderer/scene/camera exist) so it can read the camera. Owns the
 * active tool + its Redux lifecycle, the pointer pipeline, the committed
 * annotation meshes, and the SVG authoring overlay.
 */
export const ThreeAnnotationLayer = ({
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

  useThreeAnnotationMeshes({
    sceneRef,
    requestRender,
    imageWidth,
    imageHeight,
  });

  return <></>;
};
