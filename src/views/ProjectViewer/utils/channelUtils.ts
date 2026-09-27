import { CHANNEL_MODE } from "core/dl/segmentation/optionUtils";

import { arrayRange } from "utils/arrayUtils";

import type { ChannelMetaEntities } from "core/entities";
import type { ChannelPolicy } from "core/dl/segmentation/types";

/*
 * How many channel slots a model exposes for the image at hand. A `fixed`
 * graph always wants its full count (short images get a repeated last channel,
 * see `defaultChannelIds`); a `passthrough` model takes what the image has, up
 * to its own ceiling.
 */
export const channelSlotCap = (
  policy: ChannelPolicy,
  availableCount: number,
): number =>
  policy.mode === CHANNEL_MODE.FIXED
    ? policy.count
    : Math.min(policy.maxChannels, availableCount);

export const getDefaultChannelIds = (
  policy: ChannelPolicy,
  availableIds: string[],
): string[] => {
  if (policy.mode === CHANNEL_MODE.PASSTHROUGH) {
    // The model takes the image's channels as-is by default.
    return availableIds.slice(0, channelSlotCap(policy, availableIds.length));
  }
  // A fixed-input graph needs every plane filled, so repeat the last available
  // channel when the image has fewer than the model wants.
  return arrayRange(policy.count).map((_, idx) => {
    if (availableIds.length === 0) return "";
    if (idx >= availableIds.length) return availableIds.at(-1)!;
    return availableIds[idx];
  });
};

export const getSegmentedChannelNames = (
  channelIds: string[],
  channelMetas: ChannelMetaEntities,
): string[] =>
  channelIds.map((id, idx) => channelMetas[id]?.name ?? `Channel ${idx + 1}`);
