import type { PenAnnotationTool } from "views/ImageViewer/utils/tools";

/**
 * Live pen-stroke preview: the drawn path at the brush width. Unlike the
 * marching-ants outlines, this stroke is in IMAGE space (brushSize is image
 * pixels), so it scales with zoom — matching the region the pen actually paints.
 */
export const PenPreview = ({ operator }: { operator: PenAnnotationTool }) => {
  const { buffer, brushSize } = operator;
  const points = (buffer ?? []).map((p) => `${p.x},${p.y}`).join(" ");
  if (!points) return null;

  return (
    <polyline
      points={points}
      fill="none"
      stroke="rgba(255,0,0,0.6)"
      strokeWidth={brushSize * 2}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
};
