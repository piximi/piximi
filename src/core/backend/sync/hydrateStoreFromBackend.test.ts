import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";

import { classifierSlice } from "store/classifier";
import { dataSlice } from "store/data";

import { FAKE_MODEL_ID, FakeBackend } from "../fake/FakeBackend";
import { hydrateStoreFromBackend } from "./hydrateStoreFromBackend";

const seed = [
  { id: "img-a", width: 4, height: 3, channels: 2 },
  { id: "img-b", width: 2, height: 2, channels: 2 },
];

describe("hydrateStoreFromBackend", () => {
  it("mirrors a backend's images and vocabulary, but not its annotations", async () => {
    const backend = new FakeBackend({ images: seed });
    await backend.segmentation.run({
      modelId: FAKE_MODEL_ID,
      imageIds: seed.map((im) => im.id),
      channelMetaIds: [],
      kindName: "Cell",
    });
    const store = configureStore({
      reducer: { data: dataSlice.reducer, classifier: classifierSlice.reducer },
      middleware: (getDefault) => getDefault({ serializableCheck: false }),
    });

    const { mirrored } = await hydrateStoreFromBackend(backend, store.dispatch);
    await mirrored;

    const { data } = store.getState();
    expect(data.images.ids).toEqual(["img-a", "img-b"]);
    expect(data.imageSeries.ids).toHaveLength(2);
    expect(data.planes.ids).toHaveLength(2);
    expect(data.channels.ids).toHaveLength(4);
    expect(data.channelMetas.ids).toHaveLength(2);
    expect(data.kinds.ids.length).toBeGreaterThanOrEqual(2);
    expect(data.categories.ids.length).toBeGreaterThanOrEqual(2);
    expect(data.annotationVolumes.ids).toHaveLength(0);
    expect(data.annotations.ids).toHaveLength(0);
    // The classifier keeps state per kind; every hydrated kind must have it.
    const { kindClassifiers } = store.getState().classifier;
    for (const id of data.kinds.ids) {
      expect(kindClassifiers[id]?.modelTargetId).toBe(id);
    }
  });
});
