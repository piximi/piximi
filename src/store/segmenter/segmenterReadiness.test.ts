import { describe, expect, it } from "vitest";

import { CHANNEL_MODE } from "core/dl/segmentation/optionUtils";

import { ErrorReason, segmenterError } from "./segmenterReadiness";

/*
 * `segmenterError` is the single gate on running inference. It was previously a
 * useMemo chain inside SegmenterStatusProvider, reachable only by mounting the
 * provider against a real Redux store. The severity ordering is load-bearing:
 * when both conditions fail the user is told about the missing images first,
 * because picking channels cannot help them.
 */
describe("segmenterError", () => {
  const fixed2 = { mode: CHANNEL_MODE.FIXED, count: 2 } as const;

  it("reports no error before a model is loaded, given images exist", () => {
    expect(
      segmenterError({ policy: undefined, channelIds: [], imageCount: 1 }),
    ).toBeUndefined();
  });

  it("reports missing images even with no model loaded", () => {
    expect(
      segmenterError({ policy: undefined, channelIds: [], imageCount: 0 })
        ?.reason,
    ).toBe(ErrorReason.NoInferenceImages);
  });

  it("reports a channel mismatch when a fixed model has an unfilled slot", () => {
    expect(
      segmenterError({ policy: fixed2, channelIds: ["a", ""], imageCount: 1 })
        ?.reason,
    ).toBe(ErrorReason.ChannelMismatch);
  });

  it("reports a channel mismatch when a fixed model has too few slots", () => {
    expect(
      segmenterError({ policy: fixed2, channelIds: ["a"], imageCount: 1 })
        ?.reason,
    ).toBe(ErrorReason.ChannelMismatch);
  });

  it("reports a channel mismatch when nothing is selected at all", () => {
    expect(
      segmenterError({ policy: fixed2, channelIds: [], imageCount: 1 })?.reason,
    ).toBe(ErrorReason.ChannelMismatch);
  });

  it("accepts a filled fixed selection", () => {
    expect(
      segmenterError({ policy: fixed2, channelIds: ["a", "b"], imageCount: 1 }),
    ).toBeUndefined();
  });

  it("accepts any non-empty selection for a passthrough model", () => {
    expect(
      segmenterError({
        policy: { mode: CHANNEL_MODE.PASSTHROUGH, maxChannels: 4 },
        channelIds: ["a"],
        imageCount: 1,
      }),
    ).toBeUndefined();
  });

  it("prefers the missing-images error when both conditions fail", () => {
    expect(
      segmenterError({ policy: fixed2, channelIds: [], imageCount: 0 })?.reason,
    ).toBe(ErrorReason.NoInferenceImages);
  });
});
