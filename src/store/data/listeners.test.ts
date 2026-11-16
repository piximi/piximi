import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DataConnector } from "core/data-connector";
import { STORES } from "core/entities";
import { Partition } from "core/dl/enums";

import { projectReset } from "store/actions";

import { dataSlice } from "./dataSlice";
import { registerDataStorageListeners } from "./listeners";

import type { Channel } from "core/entities";
import type { ChannelStorageInput } from "core/data-connector/types";

import type { TypedAppStartListening } from "store/types";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const shape = { planes: 1, height: 1, width: 1, channels: 1 };

function makeChannel(imageId: string): Channel {
  const id = `${imageId}-ch`;
  return {
    id,
    planeId: `${imageId}-plane`,
    channelMetaId: "meta",
    name: id,
    dtype: "uint8",
    bitDepth: 8,
    width: 1,
    height: 1,
    minValue: 0,
    maxValue: 1,
    storageReference: {
      storageId: id,
      storeName: STORES.CHANNEL_DATA,
      width: 1,
      height: 1,
      dtype: "uint8",
      byteSize: 2,
    },
  };
}

function makeStorageInput(imageId: string): ChannelStorageInput {
  const { storageReference: _ref, ...channel } = makeChannel(imageId);
  return {
    ...channel,
    data: new Uint8Array([1]).buffer,
    histogram: new Uint8Array([1]).buffer,
  };
}

/** One series, image, plane and channel per image id. */
function makeProject(imageIds: string[]) {
  return {
    experiment: { id: "exp", name: "exp" },
    imageSeries: imageIds.map((id) => ({
      id: `${id}-series`,
      experimentId: "exp",
      name: id,
      bitDepth: 8 as const,
      shape,
      timeSeries: false,
      activeImageId: id,
    })),
    images: imageIds.map((id) => ({
      id,
      name: id,
      seriesId: `${id}-series`,
      shape,
      categoryId: "unknown",
      activePlaneId: `${id}-plane`,
      timepoint: 0,
      bitDepth: 8 as const,
      partition: Partition.Unassigned,
    })),
    planes: imageIds.map((id) => ({
      id: `${id}-plane`,
      imageId: id,
      zIndex: 0,
    })),
    channels: imageIds.map(makeChannel),
    kinds: [],
    categories: [],
    channelMetas: [],
    annotations: [],
    annotationVolumes: [],
  };
}

function makeStore() {
  const listener = createListenerMiddleware();
  registerDataStorageListeners(
    listener.startListening as unknown as TypedAppStartListening,
  );
  return configureStore({
    reducer: { data: dataSlice.reducer },
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }).prepend(listener.middleware),
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("data storage listeners", () => {
  let storage: DataConnector;

  const storeChannels = (imageIds: string[]) =>
    storage.storeBatch(
      imageIds.map((id) => ({
        id: `${id}-ch`,
        storeName: STORES.CHANNEL_DATA,
        data: makeStorageInput(id),
      })),
    );

  const hasChannelData = async (imageId: string) =>
    (await storage.retrieve(`${imageId}-ch`, STORES.CHANNEL_DATA)).success;

  const expectChannelData = (imageId: string, present: boolean) =>
    vi.waitFor(async () => {
      expect(await hasChannelData(imageId)).toBe(present);
    });

  beforeEach(() => {
    DataConnector.resetInstance();
    storage = DataConnector.getInstance();
  });

  afterEach(async () => {
    await storage.clearAll();
    storage.close();
  });

  it("deletes a deleted image's channel data", async () => {
    const store = makeStore();
    await storeChannels(["img1", "img2"]);
    store.dispatch(dataSlice.actions.setState(makeProject(["img1", "img2"])));

    store.dispatch(dataSlice.actions.deleteImageObject("img1"));

    await expectChannelData("img1", false);
    expect(await hasChannelData("img2")).toBe(true);
  });

  it("deletes channel data for every image in a deleted series", async () => {
    const store = makeStore();
    await storeChannels(["img1", "img2"]);
    store.dispatch(dataSlice.actions.setState(makeProject(["img1", "img2"])));

    store.dispatch(dataSlice.actions.deleteImageSeries("img1-series"));

    await expectChannelData("img1", false);
    expect(await hasChannelData("img2")).toBe(true);
  });

  it("deletes every channel on a bare projectReset (new project)", async () => {
    const store = makeStore();
    await storeChannels(["img1", "img2"]);
    store.dispatch(dataSlice.actions.setState(makeProject(["img1", "img2"])));

    store.dispatch(projectReset());

    await expectChannelData("img1", false);
    await expectChannelData("img2", false);
  });

  it("keeps channels the incoming project re-uses on a project load", async () => {
    const store = makeStore();
    await storeChannels(["img1", "img2"]);
    store.dispatch(dataSlice.actions.setState(makeProject(["img1", "img2"])));

    // Mirrors useProjectLoader: the new project's channels are already in
    // IndexedDB (here "img2" is shared with the old project) and reset +
    // setState are dispatched back to back.
    await storeChannels(["img2", "img3"]);
    store.dispatch(projectReset());
    store.dispatch(dataSlice.actions.setState(makeProject(["img2", "img3"])));

    await expectChannelData("img1", false);
    expect(await hasChannelData("img2")).toBe(true);
    expect(await hasChannelData("img3")).toBe(true);
  });
});
