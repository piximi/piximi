import { group } from "zarr";

import { DataConnector } from "core/data-connector";
import { STORES } from "core/data-connector/types";

import type { CancelToken } from "utils/workers/types";

import { PiximiStore } from "../zarr/stores";
import { writeV2 } from "./version-writers/writeV2";

import type { ChannelDataAccessor, SaveProjectWorkerInput } from "./types";

const STAGES = {
  write: { start: 0.0, end: 0.9 },
  zip: { start: 0.9, end: 1.0 },
} as const;

/**
 * Reads channel buffers straight out of IndexedDB inside the worker.
 *
 * Deliberately not handed buffers from the main thread: `DataConnector`'s LRU
 * returns the *cached* ArrayBuffer, and transferring one to a worker detaches
 * the main thread's copy — which would blank out every rendered image. Opening
 * a connector here avoids the transfer entirely. `useCache: false` keeps this
 * from standing up a second 500MB cache alongside the main thread's.
 */
const createChannelAccessor = (): ChannelDataAccessor => {
  const storage = DataConnector.getInstance({ useCache: false });

  return async (channelIds) => {
    const result = await storage.retrieveBatch(
      channelIds.map((id) => ({ id, storeName: STORES.CHANNEL_DATA })),
    );
    if (!result.success) {
      throw new Error("Failed to read channel data from storage");
    }

    const buffers = new Map<
      string,
      { data: ArrayBuffer; histogram: ArrayBuffer }
    >();
    for (const [id, stored] of result.data) {
      buffers.set(id, { data: stored.data, histogram: stored.histogram });
    }
    return buffers;
  };
};

export async function saveProject(
  input: SaveProjectWorkerInput,
  cancelToken: CancelToken,
  onProgress: ({ value }: { value: number }) => void,
): Promise<{ blob: Blob }> {
  // `createStoreFromZip` recovers the zarr root by splitting its folder name on
  // ".", so a dot in the project name would truncate the root it looks for and
  // make the saved file unreadable.
  const rootName = input.name.replace(/[./\\]/g, "_") || "project";
  const store = new PiximiStore(rootName);
  const root = await group(store, store.rootName);

  const throwIfCancelled = () => {
    if (cancelToken.cancelled) throw new Error("Project save cancelled");
  };

  await writeV2(root, input.project, createChannelAccessor(), (p) => {
    throwIfCancelled();
    onProgress({ value: STAGES.write.end * p });
  });

  throwIfCancelled();
  store.attachModels(input.models);

  const blob = await store.zip.generateAsync(
    {
      type: "blob",
      // Level 1 rather than the default 6. Pixel arrays dominate the archive
      // and barely deflate at any level, so the higher levels buy a percent or
      // two for a lot of seconds. The RLE mask dataset and the zarr metadata do
      // compress, which is why this isn't STORE. `ZipStore.setItem` writes every
      // entry the same way, so this is archive-wide rather than per-file.
      compression: "DEFLATE",
      compressionOptions: { level: 1 },
    },
    ({ percent }) => {
      onProgress({
        value:
          STAGES.zip.start +
          (STAGES.zip.end - STAGES.zip.start) * (percent / 100),
      });
    },
  );

  throwIfCancelled();
  return { blob };
}
