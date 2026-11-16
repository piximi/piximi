import { DataConnector } from "core/data-connector";

import { projectReset } from "store/actions";

import { logger } from "utils/logUtils";

import { dataSlice } from "./dataSlice";

import type { StorageReference } from "core/entities";

import type { TypedAppStartListening } from "store/types";

import type { DataStateV2 } from "./types";

type ChannelState = DataStateV2["channels"];

const channelRefs = (channels: ChannelState): StorageReference[] =>
  channels.ids.map((id) => channels.entities[id].storageReference);

/** References for every channel in `prev` that is gone from `next`. */
const droppedChannelRefs = (
  prev: ChannelState,
  next: ChannelState,
): StorageReference[] =>
  channelRefs(prev).filter((ref) => !next.entities[ref.storageId]);

const deleteChannelData = async (refs: StorageReference[]) => {
  if (refs.length === 0) return;
  const result = await DataConnector.getInstance().deleteBatch(
    refs.map((ref) => ({ id: ref.storageId, storeName: ref.storeName })),
  );
  if (!result.success) {
    logger(`Failed to delete channel data: ${result.error.message}`, {
      level: "warn",
    });
  }
};

const imageDeletionTypes = new Set<string>([
  dataSlice.actions.deleteImageObject.type,
  dataSlice.actions.batchDeleteImageObject.type,
  dataSlice.actions.deleteImageSeries.type,
]);

/*
 * Channel pixels live in IndexedDB and the data slice only holds references to
 * them, so removing channels from the slice has to be mirrored there or the
 * buffers leak for the life of the database.
 */
export const registerDataStorageListeners = (
  startAppListening: TypedAppStartListening,
) => {
  startAppListening({
    predicate: (action) => imageDeletionTypes.has(action.type),
    effect: async (_action, listenerApi) => {
      await deleteChannelData(
        droppedChannelRefs(
          listenerApi.getOriginalState().data.channels,
          listenerApi.getState().data.channels,
        ),
      );
    },
  });

  // projectReset empties the slice for both "new project" and "open project".
  // A project load has already written the incoming channels to IndexedDB,
  // possibly under the same ids as the ones being replaced (ids round-trip
  // through .piximi files), and dispatches setState right after the reset in
  // the same synchronous batch. Wait a tick for that setState so its ids
  // survive; without one, every previous channel is stale.
  startAppListening({
    actionCreator: projectReset,
    effect: async (_action, listenerApi) => {
      const previous = listenerApi.getOriginalState().data.channels;
      if (previous.ids.length === 0) return;

      const taken = await listenerApi.take(dataSlice.actions.setState.match, 0);
      const incoming = new Set<string>();
      if (taken) {
        for (const channel of taken[0].payload.channels) {
          incoming.add(channel.storageReference.storageId);
        }
      }

      await deleteChannelData(
        channelRefs(previous).filter((ref) => !incoming.has(ref.storageId)),
      );
    },
  });
};
