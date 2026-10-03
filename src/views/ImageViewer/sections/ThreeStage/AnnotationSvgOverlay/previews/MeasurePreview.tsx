import { AnchoredLabel } from "./AnchoredLabel";

import type { MeasureTool } from "@ImageViewer/core/annotation-tools";

export const MeasurePreview = ({ operator }: { operator: MeasureTool }) => {
  const { origin, toolTipPosition, distance } = operator;
  if (!origin || !distance || !toolTipPosition) return null;

  const text = `${distance}px`;

  return (
    <g>
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
