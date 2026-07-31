import {
  MARCHING_ANTS_CLASS,
  antsOverlayStyle,
  antsUnderlayStyle,
} from "../marchingAnts";

import type {
  LassoAnnotationTool,
  MagneticAnnotationTool,
  PolygonalAnnotationTool,
} from "views/ImageViewer/utils/tools";

/**
 * Live polyline preview for the polygonal and lasso tools: the in-progress
 * contour (`buffer`) as marching-ants, plus origin/anchor vertex markers.
 * Marker radius is a small image-space value (it scales mildly with zoom).
 */
export const PolylinePreview = ({
  operator,
}: {
  operator:
    | PolygonalAnnotationTool
    | LassoAnnotationTool
    | MagneticAnnotationTool;
}) => {
  const { origin, anchor, buffer } = operator;
  if (!origin) return null;

  const points = (buffer ?? []).map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <g>
      {points && (
        <>
          <polyline points={points} style={antsUnderlayStyle} />
          <polyline
            points={points}
            className={MARCHING_ANTS_CLASS}
            style={antsOverlayStyle}
          />
        </>
      )}
      <circle
        cx={origin.x}
        cy={origin.y}
        r={4}
        fill="#fff"
        stroke="#000"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {anchor && (
        <circle
          cx={anchor.x}
          cy={anchor.y}
          r={4}
          fill="#000"
          stroke="#fff"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </g>
  );
};
