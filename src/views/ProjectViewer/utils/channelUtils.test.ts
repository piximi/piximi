import { describe, expect, it } from "vitest";

import { CHANNEL_MODE } from "core/dl/segmentation/optionUtils";

import {
  channelSlotCap,
  getDefaultChannelIds,
  getSegmentedChannelNames,
} from "./channelUtils";

import type { ChannelMetaEntities } from "core/entities";

/*
 * `channelSlotCap` replaces a formula that was duplicated character-for-character
 * in SegmenterStatusProvider and ChannelMapping. These assertions pin the
 * fixed-vs-passthrough asymmetry that made the duplication dangerous: a `fixed`
 * model demands its full count regardless of what the image supplies, while a
 * `passthrough` model is clamped by whichever is smaller.
 */
describe("channelSlotCap", () => {
  it("returns the model's count for a fixed policy, ignoring available channels", () => {
    expect(channelSlotCap({ mode: CHANNEL_MODE.FIXED, count: 3 }, 1)).toBe(3);
    expect(channelSlotCap({ mode: CHANNEL_MODE.FIXED, count: 3 }, 10)).toBe(3);
  });

  it("clamps a passthrough policy to the available channel count", () => {
    expect(
      channelSlotCap({ mode: CHANNEL_MODE.PASSTHROUGH, maxChannels: 4 }, 2),
    ).toBe(2);
  });

  it("clamps a passthrough policy to maxChannels when the image has more", () => {
    expect(
      channelSlotCap({ mode: CHANNEL_MODE.PASSTHROUGH, maxChannels: 4 }, 9),
    ).toBe(4);
  });

  it("returns 0 for a passthrough policy with no available channels", () => {
    expect(
      channelSlotCap({ mode: CHANNEL_MODE.PASSTHROUGH, maxChannels: 4 }, 0),
    ).toBe(0);
  });
});

/*
 * `getSegmentedChannelNames` is the list shown to the user as "what the model actually
 * receives, in order". It was previously inlined in SegmenterOptionInput with an
 * unreachable fallback branch for a non-explicit ChannelSelection mode that the
 * type system never permitted. The placeholder case matters: a `fixed` model
 * with an unfilled slot stores "" and must still render a stable label.
 */
describe("getSegmentedChannelNames", () => {
  const metas = {
    "id-a": { id: "id-a", name: "DAPI" },
    "id-b": { id: "id-b", name: "GFP" },
  } as unknown as ChannelMetaEntities;

  it("maps selected ids to names in selection order", () => {
    expect(getSegmentedChannelNames(["id-b", "id-a"], metas)).toEqual([
      "GFP",
      "DAPI",
    ]);
  });

  it("substitutes a positional placeholder for an unfilled slot", () => {
    expect(getSegmentedChannelNames(["id-a", ""], metas)).toEqual([
      "DAPI",
      "Channel 2",
    ]);
  });

  it("substitutes a positional placeholder for an id no longer present", () => {
    expect(getSegmentedChannelNames(["id-gone"], metas)).toEqual(["Channel 1"]);
  });

  it("returns an empty list for an empty selection", () => {
    expect(getSegmentedChannelNames([], metas)).toEqual([]);
  });
});

/*
 * `getDefaultChannelIds` seeds the mapping the moment a model loads. The
 * repeat-last-channel rule for `fixed` models is the subtle part and the reason
 * this is worth testing directly: a fixed-input graph needs every plane filled,
 * so a 1-channel image feeding a 3-channel model repeats its only channel rather
 * than leaving holes that would fail the readiness precheck.
 */
describe("getDefaultChannelIds", () => {
  const three = ["a", "b", "c"];

  it("takes channels in order up to the cap for a passthrough model", () => {
    expect(
      getDefaultChannelIds(
        { mode: CHANNEL_MODE.PASSTHROUGH, maxChannels: 2 },
        three,
      ),
    ).toEqual(["a", "b"]);
  });

  it("fills every slot of a fixed model when enough channels exist", () => {
    expect(
      getDefaultChannelIds({ mode: CHANNEL_MODE.FIXED, count: 2 }, three),
    ).toEqual(["a", "b"]);
  });

  it("repeats the last channel when a fixed model wants more than exist", () => {
    expect(
      getDefaultChannelIds({ mode: CHANNEL_MODE.FIXED, count: 4 }, ["a", "b"]),
    ).toEqual(["a", "b", "b", "b"]);
  });

  it("yields empty slots for a fixed model when no channels exist", () => {
    expect(
      getDefaultChannelIds({ mode: CHANNEL_MODE.FIXED, count: 2 }, []),
    ).toEqual(["", ""]);
  });

  it("yields an empty list for a passthrough model when no channels exist", () => {
    expect(
      getDefaultChannelIds(
        { mode: CHANNEL_MODE.PASSTHROUGH, maxChannels: 3 },
        [],
      ),
    ).toEqual([]);
  });
});
