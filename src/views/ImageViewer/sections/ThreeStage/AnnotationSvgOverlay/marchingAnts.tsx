import type { CSSProperties } from "react";

/**
 * Marching-ants outline styling shared by the SVG previews. Strokes use
 * `vector-effect: non-scaling-stroke` so their width and dash pattern stay
 * constant in screen pixels regardless of the overlay `<g>` scale (zoom). A
 * solid black underlay provides contrast on any background; a white dashed
 * overlay animates its dash offset for the "marching" effect.
 */
export const MARCHING_ANTS_CLASS = "three-marching-ants";

export const antsUnderlayStyle: CSSProperties = {
  fill: "none",
  stroke: "#000",
  strokeWidth: 2.5,
  vectorEffect: "non-scaling-stroke",
};

export const antsOverlayStyle: CSSProperties = {
  fill: "none",
  stroke: "#fff",
  strokeWidth: 1.5,
  strokeDasharray: "6 4",
  vectorEffect: "non-scaling-stroke",
};

/** Injects the marching-ants keyframes once (rendered inside the overlay svg). */
export const MarchingAntsKeyframes = () => (
  <style>
    {`@keyframes three-march { to { stroke-dashoffset: -10; } }
      .${MARCHING_ANTS_CLASS} { animation: three-march 0.6s linear infinite; }`}
  </style>
);
