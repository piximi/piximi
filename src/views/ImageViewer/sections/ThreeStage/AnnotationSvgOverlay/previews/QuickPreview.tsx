import type { QuickAnnotationTool } from "views/ImageViewer/utils/tools";

/**
 * Live quick-annotation preview: the superpixel mask accumulated as the pointer
 * sweeps across regions. The tool stamps selected superpixels into a full-image
 * RGBA `currentMask` and re-encodes just the touched region to `overlayData`
 * (positioned by `overlayBoundingBox`) on each change; here we blit that raster in
 * image coordinates inside the overlay <g>. On mouse-up it graduates into the redux
 * working annotation, which WorkingAnnotationImage then renders.
 */
export const QuickPreview = ({
  operator,
}: {
  operator: QuickAnnotationTool;
}) => {
  const { overlayData, overlayBoundingBox } = operator;
  if (!overlayData || !overlayBoundingBox) return null;

  const [x1, y1, x2, y2] = overlayBoundingBox;

  return (
    <image
      href={overlayData}
      x={x1}
      y={y1}
      width={x2 - x1}
      height={y2 - y1}
      preserveAspectRatio="none"
      style={{ imageRendering: "pixelated" }}
    />
  );
};
