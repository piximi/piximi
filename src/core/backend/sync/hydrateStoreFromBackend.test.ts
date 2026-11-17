import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";

import { dataSlice } from "store/data";

import { FAKE_MODEL_ID, FakeBackend } from "../fake/FakeBackend";
import { hydrateStoreFromBackend } from "./hydrateStoreFromBackend";

const seed = [
  { id: "img-a", width: 4, height: 3, channels: 2 },
  { id: "img-b", width: 2, height: 2, channels: 2 },
];

describe("hydrateStoreFromBackend", () => {
  it("mirrors a backend's project into the store, masks included", async () => {
    const backend = new FakeBackend({ images: seed });
    await backend.segmentation.run({
      modelId: FAKE_MODEL_ID,
      imageIds: seed.map((im) => im.id),
      channelMetaIds: [],
      kindName: "Cell",
    });
    const store = configureStore({
      reducer: { data: dataSlice.reducer },
      middleware: (getDefault) => getDefault({ serializableCheck: false }),
    });

    await hydrateStoreFromBackend(backend, store.dispatch);

    const { data } = store.getState();
    expect(data.images.ids).toEqual(["img-a", "img-b"]);
    expect(data.imageSeries.ids).toHaveLength(2);
    expect(data.planes.ids).toHaveLength(2);
    expect(data.channels.ids).toHaveLength(4);
    expect(data.channelMetas.ids).toHaveLength(2);
    expect(data.kinds.ids.length).toBeGreaterThanOrEqual(2);
    expect(data.annotationVolumes.ids).toHaveLength(2);
    expect(data.annotations.ids).toHaveLength(2);
    for (const id of data.annotations.ids) {
      const annotation = data.annotations.entities[id];
      expect(annotation.encodedMask.length).toBeGreaterThan(0);
    }
  });
});
