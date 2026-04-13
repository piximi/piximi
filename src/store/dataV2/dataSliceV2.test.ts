import { describe, expect, it } from "vitest";
import { dataSliceV2 } from "./dataSliceV2";
import type {
  Experiment,
  ImageObject,
  ImageSeries,
  Kind,
  Category,
  AnnotationVolume,
  AnnotationObject,
  Plane,
} from "./types";
import { Partition } from "utils/models/enums";

const {
  newExperiment,
  addImageSeries,
  addImages,
  deleteImageSeries,
  deleteImageObject,
  batchDeleteImageObject,
  addAnnotationVolume,
  deleteAnnotationVolume,
  batchDeleteAnnotationVolume,
  addAnnotation,
  deleteAnnotation,
  addKind,
  deleteKind,
  addCategory,
  deleteImageCategory,
  deleteAnnotationCategory,
  updateImageCategory,
  batchUpdateImageCategory,
  updateAnnotationVolumeCategory,
  updateAnnotationVolumeKind,
} = dataSliceV2.actions;

// ── Fixture factories ────────────────────────────────────────────────────────

function makeSeries(id: string, name = "S1"): ImageSeries {
  return {
    id,
    experimentId: "e1",
    name,
    bitDepth: 8,
    shape: { planes: 1, height: 10, width: 10, channels: 1 },
    timeSeries: false,
    activeImageId: `${id}-img`,
  };
}

function makeKind(id: string, unknownCategoryId: string): Kind {
  return { id, name: "MyKind", unknownCategoryId };
}

function makeAnnotationCategory(
  id: string,
  kindId: string,
  isUnknown = false
): Category {
  return {
    id,
    name: isUnknown ? "Unknown" : "Cat",
    type: "annotation",
    kindId,
    color: "#ff0000",
    isUnknown,
  };
}

function makeImageCategory(id: string, isUnknown = false): Category {
  return {
    id,
    name: isUnknown ? "Unknown" : "ImgCat",
    type: "image",
    color: "#00ff00",
    isUnknown,
  };
}

function makeAnnotationVolume(
  id: string,
  imageId: string,
  kindId: string,
  categoryId: string
): AnnotationVolume {
  return { id, imageId, kindId, categoryId };
}

function makeAnnotation(
  id: string,
  planeId: string,
  imageId: string,
  volumeId: string
): AnnotationObject {
  return {
    id,
    planeId,
    imageId,
    volumeId,
    partition: Partition.Unassigned,
    shape: { planes: 1, height: 10, width: 10, channels: 1 },
    boundingBox: [0, 0, 10, 10],
    encodedMask: [],
  };
}

function makePlane(id: string, imageId: string): Plane {
  return { id, imageId, zIndex: 0 };
}

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

describe("deleteImageSeries", () => {
  function buildStateWithSeries() {
    // series-1 has img-1; img-1 has plane-1; plane-1 has no channels
    return dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("series-1")],
        images: [makeImage("img-1", "foo")],
        planes: [makePlane("plane-1", "img-1")],
        channels: [],
        channelMetas: [],
      })
    );
  }

  it("removes the series entity", () => {
    const state = dataSliceV2.reducer(
      buildStateWithSeries(),
      deleteImageSeries("series-1")
    );
    expect(state.imageSeries.ids).not.toContain("series-1");
  });

  it("removes all child images", () => {
    const state = dataSliceV2.reducer(
      buildStateWithSeries(),
      deleteImageSeries("series-1")
    );
    expect(state.images.ids).not.toContain("img-1");
  });

  it("removes child planes", () => {
    const state = dataSliceV2.reducer(
      buildStateWithSeries(),
      deleteImageSeries("series-1")
    );
    expect(state.planes.ids).not.toContain("plane-1");
  });

  it("cleans up the imageSeries relationship entry", () => {
    const state = dataSliceV2.reducer(
      buildStateWithSeries(),
      deleteImageSeries("series-1")
    );
    expect(state.relationships.imageSeries["series-1"]).toBeUndefined();
  });

  it("cleans up the images relationship entry", () => {
    const state = dataSliceV2.reducer(
      buildStateWithSeries(),
      deleteImageSeries("series-1")
    );
    expect(state.relationships.images["img-1"]).toBeUndefined();
  });

  it("is a no-op for an unknown seriesId", () => {
    const before = buildStateWithSeries();
    const after = dataSliceV2.reducer(before, deleteImageSeries("no-such-id"));
    expect(after.imageSeries.ids).toEqual(before.imageSeries.ids);
  });
});

describe("deleteImageObject", () => {
  const KIND_ID = "kind-1";
  const KIND_CAT_ID = "kind-cat-1";

  function buildStateWithAnnotation() {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("series-1")],
        images: [makeImage("img-1", "foo")],
        planes: [makePlane("plane-1", "img-1")],
        channels: [],
        channelMetas: [],
      })
    );
    s = dataSliceV2.reducer(s, addKind(makeKind(KIND_ID, KIND_CAT_ID)));
    s = dataSliceV2.reducer(
      s,
      addCategory(makeAnnotationCategory(KIND_CAT_ID, KIND_ID, true))
    );
    s = dataSliceV2.reducer(
      s,
      addAnnotationVolume(makeAnnotationVolume("vol-1", "img-1", KIND_ID, KIND_CAT_ID))
    );
    s = dataSliceV2.reducer(
      s,
      addAnnotation(makeAnnotation("ann-1", "plane-1", "img-1", "vol-1"))
    );
    return s;
  }

  it("removes the image entity", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotation(),
      deleteImageObject("img-1")
    );
    expect(s.images.ids).not.toContain("img-1");
  });

  it("cascade-removes child annotation volumes", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotation(),
      deleteImageObject("img-1")
    );
    expect(s.annotationVolumes.ids).not.toContain("vol-1");
  });

  it("cascade-removes child annotations", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotation(),
      deleteImageObject("img-1")
    );
    expect(s.annotations.ids).not.toContain("ann-1");
  });

  it("cleans up the annotationVolumes relationship entry", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotation(),
      deleteImageObject("img-1")
    );
    expect(s.relationships.annotationVolumes["vol-1"]).toBeUndefined();
  });

  it("removes vol-1 from its kind relationship", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotation(),
      deleteImageObject("img-1")
    );
    expect(
      s.relationships.kinds[KIND_ID]?.annotationVolumeIds
    ).not.toContain("vol-1");
  });

  it("is a no-op for an unknown imageId", () => {
    const before = buildStateWithAnnotation();
    const after = dataSliceV2.reducer(before, deleteImageObject("no-such-id"));
    expect(after.images.ids).toEqual(before.images.ids);
  });
});
