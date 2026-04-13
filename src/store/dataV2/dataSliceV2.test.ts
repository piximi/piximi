import { describe, expect, it } from "vitest";
import { dataSliceV2 } from "./dataSliceV2";
import type { Experiment, ImageObject } from "./types";
import { Partition } from "utils/models/enums";

const { newExperiment, addImageSeries, addImages } = dataSliceV2.actions;

// Helper to build a minimal ImageObject for tests
function makeImage(id: string, name: string): ImageObject {
  return {
    id,
    name,
    seriesId: "series-1",
    categoryId: "cat-1",
    activePlaneId: "plane-1",
    timepoint: 0,
    bitDepth: 8,
    partition: Partition.Unassigned,
    shape: { planes: 1, height: 10, width: 10, channels: 1 },
  };
}

describe("addImages", () => {
  it("does not mutate the original payload objects during name deduplication", () => {
    // First build a state with a series and an image named "foo"
    let state = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [
          {
            id: "series-1",
            experimentId: "e1",
            name: "S1",
            bitDepth: 8,
            shape: { planes: 1, height: 10, width: 10, channels: 1 },
            timeSeries: false,
            activeImageId: "img-1",
          },
        ],
        images: [makeImage("img-1", "foo")],
        planes: [],
        channels: [],
        channelMetas: [],
      })
    );

    // Add an image with a duplicate name
    const incoming = makeImage("img-2", "foo");
    const originalName = incoming.name;
    state = dataSliceV2.reducer(
      state,
      addImages({ seriesId: "series-1", images: [incoming] })
    );

    // The original object must not have been mutated
    expect(incoming.name).toBe(originalName);

    // The stored image should have a deduplicated name
    expect(state.images.entities["img-2"]?.name).not.toBe(originalName);
  });
});

describe("newExperiment", () => {
  it("retains unknown Kind and Categories after reset", () => {
    const exp: Experiment = { id: "exp-2", name: "New Exp" };
    const state = dataSliceV2.reducer(undefined, newExperiment(exp));

    // unknown kind should be present
    expect(state.kinds.ids).toHaveLength(1);
    const unknownKind = Object.values(state.kinds.entities)[0];
    expect(unknownKind?.name).toBe("Unknown");

    // unknown image category and unknown annotation category should be present
    expect(state.categories.ids).toHaveLength(2);
    const catTypes = Object.values(state.categories.entities).map(
      (c) => c?.type
    );
    expect(catTypes).toContain("image");
    expect(catTypes).toContain("annotation");
  });
});
