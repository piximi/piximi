import { useMemo, useState } from "react";

import { useSelector } from "react-redux";

import { Box } from "@mui/material";

import { selectActiveImageId } from "@ImageViewer/state/image-viewer-data/selectors";
import { selectExtendedImageById } from "store/data/selectors";
import { useParameterizedSelector } from "store/hooks";
import { useActiveImage } from "@ImageViewer/contexts/ActiveImageProvider";

import type { Point } from "utils/types";

import { useThreeChannelRenderer } from "./useThreeChannelRenderer";
import { useThreePanZoom } from "./useThreePanZoom";
import { ActiveImageInfoStrip } from "./ActiveImageInfoStrip";
import { ThreeAnnotationLayer } from "./ThreeAnnotationLayer";
import { useThreeRenderer } from "./useThreeRenderer";

type ThreeStageProps = {
  stageWidth: number;
  stageHeight: number;
};

export const ThreeStage = ({ stageWidth, stageHeight }: ThreeStageProps) => {
  const activeImageId = useSelector(selectActiveImageId);
  const image = useParameterizedSelector(
    selectExtendedImageById,
    activeImageId ?? "",
  );
  const imageWidth = image?.shape.width ?? 1;
  const imageHeight = image?.shape.height ?? 1;
  // Set once the renderer/scene/camera exist, gating the annotation layer.

  const [cursor, setCursor] = useState<{ point?: Point; oob: boolean }>({
    oob: true,
  });

  const { mountRef, ready } = useThreeRenderer(stageWidth, stageHeight);

  // Composited IJSImage (from GPU readback) that the annotation tools operate on.
  const { ijsImageRef, ijsImageVersion } = useActiveImage();
  const ijsImage = useMemo(
    () => ijsImageRef?.current ?? null,
    [ijsImageRef, ijsImageVersion],
  );

  // --- Channel rendering (uniforms + DataArrayTexture) ---
  useThreeChannelRenderer(imageWidth, imageHeight);
  // --- Pan / zoom ---
  const { isPanningRef } = useThreePanZoom(mountRef);

  return (
    <Box sx={{ zIndex: 999 }}>
      <Box
        sx={{
          position: "relative",
          width: stageWidth,
          height: stageHeight,
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <Box ref={mountRef} sx={{ width: stageWidth, height: stageHeight }} />
        {ready && (
          <ThreeAnnotationLayer
            mountRef={mountRef}
            isPanningRef={isPanningRef}
            ijsImage={ijsImage}
            stageWidth={stageWidth}
            stageHeight={stageHeight}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            onCursorChange={setCursor}
          />
        )}
      </Box>
      {image && (
        <ActiveImageInfoStrip
          absolutePosition={cursor.point}
          image={image}
          width={stageWidth}
          show={!cursor.oob}
        />
      )}
    </Box>
  );
};
