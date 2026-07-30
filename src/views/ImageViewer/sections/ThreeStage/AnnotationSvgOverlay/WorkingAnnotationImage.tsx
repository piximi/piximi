import { useMemo } from "react";

import { useSelector } from "react-redux";

import { selectSelectedCategory } from "@ImageViewer/state/image-viewer-data/selectors";
import { selectFullWorkingAnnotation } from "views/ImageViewer/state/annotator/reselectors";
import { colorOverlayROI, hexToRGBA } from "views/ImageViewer/utils";

/**
 * The in-progress "working" annotation (drawn but not yet confirmed) rendered as
 * an SVG raster: the same `colorOverlayROI` bitmap the committed meshes use
 * (interior alpha 128, border 255), positioned at the bounding box in image
 * coordinates inside the overlay `<g>`. Re-rasterizes when the mask/box/color
 * change — including the threshold slider re-running `updateMask`. On Confirm it
 * graduates into the Three.js scene.
 */
export const WorkingAnnotationImage = ({
  imageWidth,
  imageHeight,
}: {
  imageWidth: number;
  imageHeight: number;
}) => {
  const workingAnnotation = useSelector(selectFullWorkingAnnotation);

  const selectedCategory = useSelector(selectSelectedCategory);

  const href = useMemo(() => {
    if (!workingAnnotation || !workingAnnotation.decodedMask) return undefined;

    const img = colorOverlayROI(
      workingAnnotation.decodedMask,
      workingAnnotation.boundingBox,
      imageWidth,
      imageHeight,
      hexToRGBA(selectedCategory.color, 0),
      1,
    );
    return img?.src;
  }, [workingAnnotation]);

  if (!workingAnnotation || !href) return null;

  const bb = workingAnnotation.boundingBox;
  const w = bb[2] - bb[0];
  const h = bb[3] - bb[1];
  if (w <= 0 || h <= 0) return null;

  return (
    <image
      href={href}
      x={bb[0]}
      y={bb[1]}
      width={w}
      height={h}
      preserveAspectRatio="none"
      style={{ imageRendering: "pixelated" }}
    />
  );
};
