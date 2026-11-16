import type { ExtendedChannel } from "core/entities";

import type { ChannelDisplay } from "./types";

/* The per-client display settings a render request carries for one channel. */
export const toChannelDisplay = (channel: ExtendedChannel): ChannelDisplay => ({
  channelId: channel.id,
  colorMap: channel.colorMap,
  rampMin: channel.rampMin,
  rampMax: channel.rampMax,
  visible: channel.visible,
});
