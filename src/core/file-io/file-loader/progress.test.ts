import { describe, expect, it } from "vitest";

import { overallProgress } from "./progress";

import type { StageName } from "./types";

describe("overallProgress", () => {
  it("maps stage-local progress into the stage's percentage range", () => {
    expect(overallProgress("analyze", 0)).toBe(0);
    expect(overallProgress("load", 0)).toBe(10);
    expect(overallProgress("load", 0.5)).toBe(40);
    expect(overallProgress("load", 1)).toBe(70);
    expect(overallProgress("finalize", 1)).toBe(100);
  });

  it("clamps local progress to [0, 1]", () => {
    expect(overallProgress("load", -1)).toBe(10);
    expect(overallProgress("load", 2)).toBe(70);
  });

  /*
   * A negative value renders as an indeterminate bar in TaskProgressToast, and
   * a backwards stage makes the bar regress — both read as a frozen upload.
   */
  it.each<[StageName[]]>([
    [["analyze", "load", "store", "finalize"]],
    [["extract", "toDims", "toExperiment"]],
  ])("stages %j are contiguous and span 0–100", (stages) => {
    expect(overallProgress(stages[0], 0)).toBe(0);
    expect(overallProgress(stages.at(-1)!, 1)).toBe(100);
    for (let i = 0; i < stages.length; i++) {
      expect(overallProgress(stages[i], 1)).toBeGreaterThanOrEqual(
        overallProgress(stages[i], 0),
      );
      if (i > 0) {
        expect(overallProgress(stages[i], 0)).toBe(
          overallProgress(stages[i - 1], 1),
        );
      }
    }
  });
});
