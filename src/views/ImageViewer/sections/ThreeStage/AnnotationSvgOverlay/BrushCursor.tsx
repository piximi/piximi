import type { Point } from "utils/types";

/**
 * Pen brush cursor: a circle of the brush radius at the pointer, in image space
 * (so it scales with zoom to match the region the pen paints). Replaces the old
 * Konva `PenAnnotationToolTip`.
 */
export const BrushCursor = ({
  position,
  brushSize,
}: {
  position: Point | undefined;
  brushSize: number;
}) => {
  if (!position || !brushSize) return null;
  return (
    <circle
      cx={position.x}
      cy={position.y}
      r={brushSize}
      fill="rgba(255,255,255,0.1)"
      stroke="#fff"
      strokeWidth={1}
      strokeDasharray="3 3"
      vectorEffect="non-scaling-stroke"
    />
  );
};
