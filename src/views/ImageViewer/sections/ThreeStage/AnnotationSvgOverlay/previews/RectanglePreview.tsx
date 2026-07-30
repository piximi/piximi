import {
  MARCHING_ANTS_CLASS,
  antsOverlayStyle,
  antsUnderlayStyle,
} from "../marchingAnts";

import type {
  RectangularAnnotationTool,
  SelectionTool,
  ThresholdAnnotationTool,
} from "views/ImageViewer/utils/tools";

/**
 * Live drag-rectangle preview, drawn in image coordinates inside the overlay
 * `<g>`. Shared by the rectangular, selection, and threshold tools (threshold's
 * live preview is just the region rect; its raster mask appears afterwards as
 * the working annotation). Width/height may be negative when dragging up/left,
 * so they are normalized for SVG.
 */
export const RectanglePreview = ({
  operator,
}: {
  operator: RectangularAnnotationTool | SelectionTool | ThresholdAnnotationTool;
}) => {
  const { origin, width, height } = operator;
  if (!origin || !width || !height) return null;

  const x = Math.min(origin.x, origin.x + width);
  const y = Math.min(origin.y, origin.y + height);
  const w = Math.abs(width);
  const h = Math.abs(height);

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} style={antsUnderlayStyle} />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        className={MARCHING_ANTS_CLASS}
        style={antsOverlayStyle}
      />
    </g>
  );
};
