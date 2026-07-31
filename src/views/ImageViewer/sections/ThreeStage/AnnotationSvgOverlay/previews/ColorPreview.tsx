import type { ColorAnnotationTool } from "views/ImageViewer/utils/tools";

const TEXT_OFFSET = 6;
const TEXT_FONTSIZE = 12;
const TEXT_BG_OFFSET_Y = 20;
const TEXT_CHAR_WIDTH = 7;
const TEXT_BG_RADIUS = 4;
const TEXT_BG_HEIGHT = 20;

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
      <rect
        x={toolTipPosition.x}
        y={toolTipPosition.y - TEXT_BG_OFFSET_Y}
        width={text.length * TEXT_CHAR_WIDTH}
        height={TEXT_BG_HEIGHT}
        rx={TEXT_BG_RADIUS}
        ry={TEXT_BG_RADIUS}
        fill="#000000bf"
      />
      <text
        x={toolTipPosition.x + TEXT_OFFSET}
        y={toolTipPosition.y - TEXT_OFFSET}
        fill="#fff"
        fontSize={TEXT_FONTSIZE}
      >
        {text}
      </text>
    </g>
  );
};
