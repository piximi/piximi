import { StageName } from "../types";

const STAGE_WEIGHTS: Record<StageName, { start: number; end: number }> = {
  analyze: { start: 0, end: 10 },
  load: { start: 10, end: 70 },
  store: { start: 70, end: 90 },
  finalize: { start: 90, end: 100 },
  extract: { start: 0, end: 10 },
  toDims: { start: 10, end: 40 },
  toExperiment: { start: 40, end: 100 },
};

/**
 * Convert a stage-local progress (0-1) into an overall percentage.
 *
 * Usage:
 *   overallProgress("load", 0.5)  // => 40  (halfway through the 10-70 range)
 */
export function overallProgress(
  stage: StageName,
  localProgress: number,
): number {
  const { start, end } = STAGE_WEIGHTS[stage];
  return Math.round(
    start + (end - start) * Math.min(1, Math.max(0, localProgress)),
  );
}
