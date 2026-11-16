import { configureStore } from "@reduxjs/toolkit";

import { DataConnector } from "core/data-connector";
import {
  STORES,
  UNKNOWN_IMAGE_CATEGORY,
  UNKNOWN_KIND,
  UNKNOWN_KIND_CATEGORY,
} from "core/entities";
import { Partition } from "core/dl/enums";

import { dataSlice } from "store/data";

import { describeBackendConformance } from "../conformance/backendConformance";
import { LocalBackend } from "./LocalBackend";
import { createMainThreadThumbnailRenderer } from "./thumbnails";

import type { Channel, ChannelMeta } from "core/entities";
import type { ChannelStorageInput } from "core/data-connector/types";

import type { StoreHandle } from "./LocalBackend";

type ImageSeed = {
  id: string;
  width: number;
  height: number;
  channels: number;
};

const seed: ImageSeed[] = [
  { id: "img-a", width: 4, height: 3, channels: 2 },
  { id: "img-b", width: 2, height: 2, channels: 2 },
  { id: "img-c", width: 5, height: 1, channels: 2 },
];

const channelId = (imageId: string, c: number) => `${imageId}-ch${c}`;

const makeChannel = (im: ImageSeed, c: number): Channel => ({
  id: channelId(im.id, c),
  planeId: `${im.id}-plane`,
  channelMetaId: `meta-${c}`,
  name: `Channel ${c}`,
  dtype: "uint8",
  bitDepth: 8,
  width: im.width,
  height: im.height,
  minValue: 0,
  maxValue: 255,
  storageReference: {
    storageId: channelId(im.id, c),
    storeName: STORES.CHANNEL_DATA,
    width: im.width,
    height: im.height,
    dtype: "uint8",
    byteSize: im.width * im.height,
  },
});

const makeStorageInput = (im: ImageSeed, c: number): ChannelStorageInput => {
  const { storageReference: _ref, ...channel } = makeChannel(im, c);
  const data = new Uint8Array(im.width * im.height);
  for (let i = 0; i < data.length; i++) data[i] = (i * 37 + c * 64) % 256;
  return { ...channel, data: data.buffer, histogram: new Uint8Array(1).buffer };
};

const makeProject = () => ({
  experiment: { id: "exp", name: "exp" },
  imageSeries: seed.map((im) => ({
    id: `${im.id}-series`,
    experimentId: "exp",
    name: im.id,
    bitDepth: 8 as const,
    shape: {
      planes: 1,
      height: im.height,
      width: im.width,
      channels: im.channels,
    },
    timeSeries: false,
    activeImageId: im.id,
  })),
  images: seed.map((im) => ({
    id: im.id,
    name: im.id,
    seriesId: `${im.id}-series`,
    shape: {
      planes: 1,
      height: im.height,
      width: im.width,
      channels: im.channels,
    },
    categoryId: "unknown",
    activePlaneId: `${im.id}-plane`,
    timepoint: 0,
    bitDepth: 8 as const,
    partition: Partition.Unassigned,
  })),
  planes: seed.map((im) => ({
    id: `${im.id}-plane`,
    imageId: im.id,
    zIndex: 0,
  })),
  channels: seed.flatMap((im) =>
    Array.from({ length: im.channels }, (_, c) => makeChannel(im, c)),
  ),
  channelMetas: [0, 1].map(
    (c): ChannelMeta => ({
      id: `meta-${c}`,
      name: `Channel ${c}`,
      bitDepth: 8,
      colorMap: [c === 0 ? 1 : 0, c === 1 ? 1 : 0, 0],
      visible: true,
      minValue: 0,
      maxValue: 255,
      rampMin: 0,
      rampMax: 255,
      rampMinLimit: 0,
      rampMaxLimit: 255,
    }),
  ),
  kinds: [UNKNOWN_KIND],
  categories: [UNKNOWN_IMAGE_CATEGORY, UNKNOWN_KIND_CATEGORY],
  annotations: [],
  annotationVolumes: [],
});

describeBackendConformance("LocalBackend", async () => {
  DataConnector.resetInstance();
  const storage = DataConnector.getInstance();
  await storage.storeBatch(
    seed.flatMap((im) =>
      Array.from({ length: im.channels }, (_, c) => ({
        id: channelId(im.id, c),
        storeName: STORES.CHANNEL_DATA,
        data: makeStorageInput(im, c),
      })),
    ),
  );

  const store = configureStore({
    reducer: { data: dataSlice.reducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });
  store.dispatch(dataSlice.actions.setState(makeProject()));

  const backend = new LocalBackend({
    store: store as unknown as StoreHandle,
    dataConnector: storage,
    thumbnails: createMainThreadThumbnailRenderer(storage),
  });

  return {
    backend,
    images: seed.map((im) => ({
      ...im,
      channelIds: Array.from({ length: im.channels }, (_, c) =>
        channelId(im.id, c),
      ),
    })),
    teardown: async () => {
      await storage.clearAll();
      storage.close();
    },
  };
});
