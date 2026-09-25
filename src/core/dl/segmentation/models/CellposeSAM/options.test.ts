import { describe, expect, it } from "vitest";

import { isCellposePassthrough, toCellposeSegmentOptions } from "./options";

/*
 * These assertions lock the defect this module was written to fix: Cellpose-SAM
 * previously shipped `{ diameter: 30, chan: 0, chan2: 0 }`, which silently
 * rescaled every image and switched cellpose-js out of passthrough into a
 * grayscale mean across distinct markers.
 *
 * `chan`/`chan2` are checked with `in` rather than `=== undefined` on purpose:
 * cellpose-js decides passthrough vs. legacy by whether the caller supplied the
 * option at all, so a present-but-undefined key would be just as wrong.
 */
describe("toCellposeSegmentOptions", () => {
  it("omits diameter and chan/chan2 by default", () => {
    const opts = toCellposeSegmentOptions();

    expect("diameter" in opts).toBe(false);
    expect("chan" in opts).toBe(false);
    expect("chan2" in opts).toBe(false);
    expect(opts.tile).toBe(256);
  });

  it("omits chan/chan2 in passthrough even when stale values linger", () => {
    const opts = toCellposeSegmentOptions({
      channelMode: "passthrough",
      chan: 2,
      chan2: 1,
      diameter: 45,
      cellprobThreshold: -1.5,
      niter: 400,
      maxSizeFraction: 0.6,
      resample: true,
    });

    expect("chan" in opts).toBe(false);
    expect("chan2" in opts).toBe(false);
    // The other knobs still come through.
    expect(opts.diameter).toBe(45);
    expect(opts.resample).toBe(true);
    expect(opts.dynamics).toEqual({
      cellprobThreshold: -1.5,
      niter: 400,
      maxSizeFraction: 0.6,
    });
  });

  it("defaults chan/chan2 to 0 in legacy mode", () => {
    const opts = toCellposeSegmentOptions({ channelMode: "legacy" });

    expect(opts.chan).toBe(0);
    expect(opts.chan2).toBe(0);
  });

  it("passes explicit legacy chan/chan2 through verbatim", () => {
    const opts = toCellposeSegmentOptions({
      channelMode: "legacy",
      chan: 2,
      chan2: 1,
    });

    expect(opts.chan).toBe(2);
    expect(opts.chan2).toBe(1);
  });

  it("treats a set diameter as a rescale and an unset one as native", () => {
    expect(toCellposeSegmentOptions({ diameter: 30 }).diameter).toBe(30);
    expect(
      "diameter" in toCellposeSegmentOptions({ diameter: undefined }),
    ).toBe(false);
    expect("diameter" in toCellposeSegmentOptions({ diameter: NaN })).toBe(
      false,
    );
  });

  it("builds dynamics only when at least one sub-key is set", () => {
    expect("dynamics" in toCellposeSegmentOptions()).toBe(false);
    expect(toCellposeSegmentOptions({ niter: 300 }).dynamics).toEqual({
      niter: 300,
    });
  });

  it("omits resample unless explicitly enabled", () => {
    expect("resample" in toCellposeSegmentOptions()).toBe(false);
    expect("resample" in toCellposeSegmentOptions({ resample: false })).toBe(
      false,
    );
  });
});

describe("isCellposePassthrough", () => {
  it("is true unless the user opts into legacy", () => {
    expect(isCellposePassthrough()).toBe(true);
    expect(isCellposePassthrough({ channelMode: "passthrough" })).toBe(true);
    expect(isCellposePassthrough({ channelMode: "legacy" })).toBe(false);
  });
});
