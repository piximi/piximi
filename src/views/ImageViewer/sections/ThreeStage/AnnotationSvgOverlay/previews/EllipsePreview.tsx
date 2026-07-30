import {
  MARCHING_ANTS_CLASS,
  antsOverlayStyle,
  antsUnderlayStyle,
} from "../marchingAnts";

import type { EllipticalAnnotationTool } from "views/ImageViewer/utils/tools";

/** Live ellipse preview from the tool's center + radius (image coordinates). */
export const EllipsePreview = ({
  operator,
}: {
  operator: EllipticalAnnotationTool;
}) => {
  const { center, radius } = operator;
  if (!center || !radius) return null;

  const rx = Math.abs(radius.x);
  const ry = Math.abs(radius.y);

  return (
    <g>
      <ellipse
        cx={center.x}
        cy={center.y}
        rx={rx}
        ry={ry}
        style={antsUnderlayStyle}
      />
      <ellipse
        cx={center.x}
        cy={center.y}
        rx={rx}
        ry={ry}
        className={MARCHING_ANTS_CLASS}
        style={antsOverlayStyle}
      />
    </g>
  );
};
