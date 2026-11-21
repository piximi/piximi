import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

import { dataSlice } from "store/data";

import { FAKE_MODEL_ID, FakeBackend } from "../fake/FakeBackend";
import { mirrorImageAnnotations } from "./mirrorImageAnnotations";

import type { Dispatch } from "@reduxjs/toolkit";

import type { RootState } from "store/rootReducer";

const seed = [
  { id: "img-a", width: 4, height: 3, channels: 1 },
  { id: "img-b", width: 2, height: 2, channels: 1 },
  { id: "img-c", width: 3, height: 3, channels: 1 },
];

const makeStore = () =>
  configureStore({ reducer: { data: dataSlice.reducer } }) as unknown as {
    getState(): RootState;
    dispatch: Dispatch;
  };

describe("mirrorImageAnnotations", () => {
  it("brings the images' objects, with masks, into an empty mirror and evicts them again", async () => {
    const backend = new FakeBackend({ images: seed });
    await backend.segmentation.run({
      modelId: FAKE_MODEL_ID,
      imageIds: seed.map((im) => im.id),
      channelMetaIds: [],
      kindName: "Cell",
    });
    const store = makeStore();

    const { annotations } = await mirrorImageAnnotations(backend, store, [
      "img-a",
      "img-c",
    ]);

    expect(annotations).toBe(2);
    const { data } = store.getState();
    // The images came along, since the mirror lacked them.
    expect(data.images.ids).toEqual(["img-a", "img-c"]);
    expect(data.planes.ids.length).toBe(2);
    expect(data.annotations.ids.length).toBe(2);
    expect(data.annotationVolumes.ids.length).toBe(2);
    const first = data.annotations.entities[data.annotations.ids[0]];
    expect(first.encodedMask).toEqual([0, 12]);
    expect(first.rev).toBeDefined();

    store.dispatch(dataSlice.actions.evictImageAnnotations(["img-a"]));
    const after = store.getState().data;
    expect(after.annotations.ids.length).toBe(1);
    expect(after.annotationVolumes.ids.length).toBe(1);
    expect(after.annotations.entities[after.annotations.ids[0]].imageId).toBe(
      "img-c",
    );
    // Images stay: they belong to the mirror, not the session.
    expect(after.images.ids).toEqual(["img-a", "img-c"]);
  });
});
