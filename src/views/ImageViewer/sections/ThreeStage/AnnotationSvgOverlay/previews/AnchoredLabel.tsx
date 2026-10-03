import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { useThreeViewport } from "@ImageViewer/contexts/ThreeViewportProvider";

const OFFSET_X = 6;
const OFFSET_Y = 6;
const FONT_SIZE = 12;

/**
 * A text chip pinned to an image-space point but drawn at a constant screen
 * size. Lives inside the overlay's camera-scaled <g>, so the anchor rides the
 * parent transform; the inner scale(1/zoom) cancels that scale so font size
 * stays in screen pixels. Zoom arrives via onCameraChange and is applied
 * imperatively, matching AnnotationSvgOverlay — pan/zoom must not re-render.
 */
export const AnchoredLabel = ({
  x,
  y,
  text,
}: {
  x: number;
  y: number;
  text: string;
}) => {
  const { onCameraChange, getImageToScreenTransform } = useThreeViewport();
  const gRef = useRef<SVGGElement>(null);

  // Latest-ref so the subscribed callback is stable across the per-mousemove
  // re-renders that drawTick drives.
  const anchorRef = useRef({ x, y });
  anchorRef.current = { x, y };

  const applyTransform = useCallback(() => {
    const g = gRef.current;
    const t = getImageToScreenTransform();
    if (!g || !t) return;
    const { x, y } = anchorRef.current;
    g.setAttribute("transform", `translate(${x} ${y}) scale(${1 / t.scale})`);
  }, [getImageToScreenTransform]);

  useLayoutEffect(() => {
    applyTransform();
  });
  useEffect(
    () => onCameraChange(applyTransform),
    [onCameraChange, applyTransform],
  );

  return (
    <g ref={gRef}>
      <text
        x={OFFSET_X}
        y={-OFFSET_Y}
        fill="#fff"
        stroke="#000"
        strokeWidth={3}
        paintOrder="stroke"
        strokeLinejoin="round"
        fontSize={FONT_SIZE}
      >
        {text}
      </text>
    </g>
  );
};
