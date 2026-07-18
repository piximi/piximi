export type RampPoint = {
  x: number;
  opacity: number;
};
export const enum RampHandle {
  Min = "min",
  Max = "max",
}

export function maxBinCount(bins: Uint32Array): number {
  let max = 0;
  for (let i = 0; i < bins.length; i++) max = Math.max(max, bins[i]);
  return max;
}

/** Ramp value at intensity `x`: 0 below rampMin, 1 above rampMax, linear between. */
const rampOpacityAt = (x: number, rampMin: number, rampMax: number): number =>
  rampMax === rampMin
    ? x < rampMin
      ? 0
      : 1
    : clamp((x - rampMin) / (rampMax - rampMin), 0, 1);

/** Vertices of the ramp clipped to [plotMin, plotMax], for the area path and gradient. */
export const rampPlotPoints = (
  rampMin: number,
  rampMax: number,
  plotMin: number,
  plotMax: number,
): RampPoint[] => {
  const points: RampPoint[] = [
    { x: plotMin, opacity: rampOpacityAt(plotMin, rampMin, rampMax) },
  ];
  if (rampMin > plotMin && rampMin < plotMax)
    points.push({ x: rampMin, opacity: 0 });
  if (rampMax > plotMin && rampMax < plotMax)
    points.push({ x: rampMax, opacity: 1 });
  points.push({
    x: plotMax,
    opacity: rampOpacityAt(plotMax, rampMin, rampMax),
  });
  return points;
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);
