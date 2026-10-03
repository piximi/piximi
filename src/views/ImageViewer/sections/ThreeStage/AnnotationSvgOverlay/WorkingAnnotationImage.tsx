import { useMemo } from "react";

import { useSelector } from "react-redux";

import { hexToRGBA } from "utils/image";
import { maskToDataURL } from "utils/image/imageHelper";

import { selectSelectedCategory } from "views/ImageViewer/state/imageViewerData/selectors";

import { selectFullWorkingAnnotation } from "@ImageViewer/state/annotator/reselectors";
import { selectPendingOperation } from "@ImageViewer/state/operations/reselectors";

/**
 * The in-progress "working" annotation (drawn but not yet confirmed), rasterized
 * by `maskToDataURL` and positioned at its bounding box in image coordinates
 * inside the overlay `<g>`. Re-rasterizes when the mask, box or colour changes —
 * including the threshold slider re-running `updateMask`. On Confirm it
 * graduates into the Three.js scene.
 */
export const WorkingAnnotationImage = () => {
  const workingAnnotation = useSelector(selectFullWorkingAnnotation);
  const pendingOperation = useSelector(selectPendingOperation);

  const selectedCategory = useSelector(selectSelectedCategory);

  const href = useMemo(() => {
    if (!workingAnnotation || !workingAnnotation.decodedMask) return undefined;
    const bb = workingAnnotation.boundingBox;
    return maskToDataURL(
      workingAnnotation.decodedMask,
      bb[2] - bb[0],
      bb[3] - bb[1],
      hexToRGBA(selectedCategory.color, 0) as [number, number, number],
    );
  }, [workingAnnotation, selectedCategory.color]);

  if (!workingAnnotation || !href) return null;
  // While an operation is staged the target's own mesh already shows the combined
  // result. Keeping the stroke on top would paint over the hole a Subtract just
  // made, since the SVG overlay always composites above the WebGL canvas.
  if (pendingOperation && !pendingOperation.empty) return null;

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
