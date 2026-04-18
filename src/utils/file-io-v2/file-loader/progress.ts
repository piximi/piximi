import { StageName } from "./types";

const STAGE_WEIGHTS: Record<StageName, { start: number; end: number }> = {
  analyze: { start: 0, end: 0.1 },
  load: { start: 0.1, end: 0.7 },
  store: { start: 0.7, end: 0.9 },
  finalize: { start: 0.9, end: 0.1 },
  extract: { start: 0.0, end: 0.1 },
  toDims: { start: 0.1, end: 0.4 },
  toExperiment: { start: 0.4, end: 0.1 },
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
