import * as Comlink from "comlink";

import "./workerPolyfills";

import { DataConnector } from "core/data-connector";

import {
  compositeChannelsToDataUrl,
  layerFromChannel,
} from "utils/image/compositeChannels";
import { getCacheKey } from "utils/renderedSrcsCache";

import type { BBox, ExtendedChannel } from "core/entities";

const renderSrcs = async (
  items: Array<{
    channelsRef: ExtendedChannel[];
    boundingBox?: BBox;
  }>,
) => {
  const storage = DataConnector.getInstance();
  const cacheResults: Array<
    { key: string; url: string } | { key: string; error: Error }
  > = [];
  for (const item of items) {
    // The key covers every channel (visibility included) but only the visible
    // ones are drawn, matching `useRenderedSrc`.
    const cacheKey = getCacheKey(item.channelsRef, item.boundingBox);
    const visibleChannels = item.channelsRef.filter((c) => c.visible);
    if (visibleChannels.length === 0) continue;
    try {
      const result = await storage.retrieveBatch(
        visibleChannels.map((c) => ({
          id: c.storageReference.storageId,
          storeName: c.storageReference.storeName,
        })),
      );
      if (result.success) {
        const url = compositeChannelsToDataUrl(
          visibleChannels.map(layerFromChannel),
          result.data,
          item.boundingBox,
        );
        cacheResults.push({ key: cacheKey, url });
      } else {
        cacheResults.push({ key: cacheKey, error: result.error });
      }
    } catch (error) {
      // Fall back to empty src
      cacheResults.push({ key: cacheKey, error: error as Error });
    }
  }
  return cacheResults;
};

Comlink.expose({ renderSrcs });
