import { describe, expect, it } from "vitest";

import { CHANNEL_MODE } from "./optionUtils";
import {
  channelSlotCap,
  getDefaultChannelIds,
  getSegmentedChannelNames,
  reconcileChannelSelection,
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

/*
 * `reconcileChannelSelection` is what lets a channel mapping survive a project
 * save/load. Before it existed, `modelLoaded` reseeded defaults unconditionally,
 * so a restored mapping was destroyed the moment the user loaded the model it
 * belonged to. The assertions below pin the three ways a restored selection can
 * legitimately go stale — an id the image no longer has, a `fixed` model whose
 * count changed, and a `passthrough` selection that now exceeds its cap — while
 * confirming an intact one is handed back untouched.
 */
describe("reconcileChannelSelection", () => {
  const three = ["a", "b", "c"];
  const fixed2 = { mode: CHANNEL_MODE.FIXED, count: 2 } as const;
  const pass4 = { mode: CHANNEL_MODE.PASSTHROUGH, maxChannels: 4 } as const;

  it("keeps a still-valid fixed selection, preserving the user's order", () => {
    expect(reconcileChannelSelection(fixed2, ["c", "a"], three)).toEqual([
      "c",
      "a",
    ]);
  });

  it("keeps a passthrough selection shorter than the cap", () => {
    // `channelSlotRemoved` lets the user drop slots, so a short selection is
    // deliberate, not damage.
    expect(reconcileChannelSelection(pass4, ["b"], three)).toEqual(["b"]);
  });

  it("reseeds defaults when a selected id is no longer in the image", () => {
    expect(reconcileChannelSelection(fixed2, ["a", "gone"], three)).toEqual([
      "a",
      "b",
    ]);
  });

  it("reseeds defaults when a fixed model's count no longer matches", () => {
    expect(reconcileChannelSelection(fixed2, ["a", "b", "c"], three)).toEqual([
      "a",
      "b",
    ]);
  });

  it("reseeds defaults when a passthrough selection exceeds the cap", () => {
    const pass2 = { mode: CHANNEL_MODE.PASSTHROUGH, maxChannels: 2 } as const;
    expect(reconcileChannelSelection(pass2, three, three)).toEqual(["a", "b"]);
  });

  it("reseeds defaults for an empty selection, the fresh-state case", () => {
    expect(reconcileChannelSelection(fixed2, [], three)).toEqual(["a", "b"]);
  });

  it("treats an unfilled fixed slot as stale rather than preserving it", () => {
    // "" is the placeholder a short image leaves behind; it is never a real id,
    // so it must not survive reconciliation.
    expect(reconcileChannelSelection(fixed2, ["a", ""], three)).toEqual([
      "a",
      "b",
    ]);
  });
});
