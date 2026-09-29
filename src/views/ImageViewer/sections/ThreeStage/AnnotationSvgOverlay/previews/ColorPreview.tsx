import { AnchoredLabel } from "./AnchoredLabel";

import type { ColorAnnotationTool } from "views/ImageViewer/utils/tools";

export const ColorPreview = ({
  operator,
}: {
  operator: ColorAnnotationTool;
}) => {
  const {
    overlayData,
    overlayBoundingBox,
    origin,
    toolTipPosition,
    tolerance,
  } = operator;
  if (!overlayData || !overlayBoundingBox || !toolTipPosition) return null;

  const [x1, y1, x2, y2] = overlayBoundingBox;

  const text = `Tolerance: ${tolerance}`;

  return (
    <g>
      <image
        href={overlayData}
        x={x1}
        y={y1}
        width={x2 - x1}
        height={y2 - y1}
        preserveAspectRatio="none"
        style={{ imageRendering: "pixelated" }}
      />
      <line
        x1={origin.x}
        y1={origin.y}
        x2={toolTipPosition.x}
        y2={toolTipPosition.y}
        stroke="#fff"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />

      <AnchoredLabel x={toolTipPosition.x} y={toolTipPosition.y} text={text} />
    </g>
  );
};
