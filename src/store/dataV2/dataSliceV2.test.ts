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
  isUnknown = false,
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
  categoryId: string,
): AnnotationVolume {
  return { id, imageId, kindId, categoryId };
}

function makeAnnotation(
  id: string,
  planeId: string,
  imageId: string,
  volumeId: string,
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
      }),
    );

    // Add an image with a duplicate name
    const incoming = makeImage("img-2", "foo");
    const originalName = incoming.name;
    state = dataSliceV2.reducer(
      state,
      addImages({ seriesId: "series-1", images: [incoming] }),
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
      (c) => c?.type,
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
      }),
    );
  }

  it("removes the series entity", () => {
    const state = dataSliceV2.reducer(
      buildStateWithSeries(),
      deleteImageSeries("series-1"),
    );
    expect(state.imageSeries.ids).not.toContain("series-1");
  });

  it("removes all child images", () => {
    const state = dataSliceV2.reducer(
      buildStateWithSeries(),
      deleteImageSeries("series-1"),
    );
    expect(state.images.ids).not.toContain("img-1");
  });

  it("removes child planes", () => {
    const state = dataSliceV2.reducer(
      buildStateWithSeries(),
      deleteImageSeries("series-1"),
    );
    expect(state.planes.ids).not.toContain("plane-1");
  });

  it("cleans up the imageSeries relationship entry", () => {
    const state = dataSliceV2.reducer(
      buildStateWithSeries(),
      deleteImageSeries("series-1"),
    );
    expect(state.relationships.imageSeries["series-1"]).toBeUndefined();
  });

  it("cleans up the images relationship entry", () => {
    const state = dataSliceV2.reducer(
      buildStateWithSeries(),
      deleteImageSeries("series-1"),
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
      }),
    );
    s = dataSliceV2.reducer(s, addKind(makeKind(KIND_ID, KIND_CAT_ID)));
    s = dataSliceV2.reducer(
      s,
      addCategory(makeAnnotationCategory(KIND_CAT_ID, KIND_ID, true)),
    );
    s = dataSliceV2.reducer(
      s,
      addAnnotationVolume(
        makeAnnotationVolume("vol-1", "img-1", KIND_ID, KIND_CAT_ID),
      ),
    );
    s = dataSliceV2.reducer(
      s,
      addAnnotation(makeAnnotation("ann-1", "plane-1", "img-1", "vol-1")),
    );
    return s;
  }

  it("removes the image entity", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotation(),
      deleteImageObject("img-1"),
    );
    expect(s.images.ids).not.toContain("img-1");
  });

  it("cascade-removes child annotation volumes", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotation(),
      deleteImageObject("img-1"),
    );
    expect(s.annotationVolumes.ids).not.toContain("vol-1");
  });

  it("cascade-removes child annotations", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotation(),
      deleteImageObject("img-1"),
    );
    expect(s.annotations.ids).not.toContain("ann-1");
  });

  it("cleans up the annotationVolumes relationship entry", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotation(),
      deleteImageObject("img-1"),
    );
    expect(s.relationships.annotationVolumes["vol-1"]).toBeUndefined();
  });

  it("removes vol-1 from its kind relationship", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotation(),
      deleteImageObject("img-1"),
    );
    expect(s.relationships.kinds[KIND_ID]?.annotationVolumeIds).not.toContain(
      "vol-1",
    );
  });

  it("is a no-op for an unknown imageId", () => {
    const before = buildStateWithAnnotation();
    const after = dataSliceV2.reducer(before, deleteImageObject("no-such-id"));
    expect(after.images.ids).toEqual(before.images.ids);
  });
});

describe("deleteKind", () => {
  const KIND_ID = "kind-del";
  const KIND_CAT_ID = "kind-cat-del";

  function buildStateWithKind() {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("series-1")],
        images: [makeImage("img-1", "foo")],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    s = dataSliceV2.reducer(s, addKind(makeKind(KIND_ID, KIND_CAT_ID)));
    s = dataSliceV2.reducer(
      s,
      addCategory(makeAnnotationCategory(KIND_CAT_ID, KIND_ID, true)),
    );
    s = dataSliceV2.reducer(
      s,
      addAnnotationVolume(
        makeAnnotationVolume("vol-1", "img-1", KIND_ID, KIND_CAT_ID),
      ),
    );
    return s;
  }

  it("removes the kind entity", () => {
    const s = dataSliceV2.reducer(buildStateWithKind(), deleteKind(KIND_ID));
    expect(s.kinds.ids).not.toContain(KIND_ID);
  });

  it("reassigns annotation volumes to unknown kind", () => {
    const s = dataSliceV2.reducer(buildStateWithKind(), deleteKind(KIND_ID));
    expect(s.annotationVolumes.entities["vol-1"]?.kindId).not.toBe(KIND_ID);
  });

  it("removes the kind's categories", () => {
    const s = dataSliceV2.reducer(buildStateWithKind(), deleteKind(KIND_ID));
    expect(s.categories.ids).not.toContain(KIND_CAT_ID);
  });

  it("cleans up the kinds relationship entry", () => {
    const s = dataSliceV2.reducer(buildStateWithKind(), deleteKind(KIND_ID));
    expect(s.relationships.kinds[KIND_ID]).toBeUndefined();
  });

  it("cannot delete the unknown kind (no-op)", () => {
    const initial = dataSliceV2.reducer(undefined, { type: "@@INIT" } as any);
    const unknownKindId = Object.values(initial.kinds.entities).find(
      (k) => k?.name === "Unknown",
    )!.id;

    const after = dataSliceV2.reducer(initial, deleteKind(unknownKindId));
    expect(after.kinds.ids).toContain(unknownKindId);
  });
});

describe("deleteImageCategory", () => {
  const IMG_CAT_ID = "img-cat-custom";

  function buildStateWithImageCategory() {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("series-1")],
        images: [
          {
            ...makeImage("img-1", "foo"),
            categoryId: IMG_CAT_ID,
          },
        ],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    s = dataSliceV2.reducer(s, addCategory(makeImageCategory(IMG_CAT_ID)));
    return s;
  }

  it("removes the category entity", () => {
    const s = dataSliceV2.reducer(
      buildStateWithImageCategory(),
      deleteImageCategory(IMG_CAT_ID),
    );
    expect(s.categories.ids).not.toContain(IMG_CAT_ID);
  });

  it("reassigns images to the unknown image category", () => {
    const before = buildStateWithImageCategory();
    const unknownCatId = Object.values(before.categories.entities).find(
      (c) => c?.type === "image" && c.isUnknown,
    )!.id;

    const s = dataSliceV2.reducer(before, deleteImageCategory(IMG_CAT_ID));
    expect(s.images.entities["img-1"]?.categoryId).toBe(unknownCatId);
  });

  it("cleans up the imageCategories relationship entry", () => {
    const s = dataSliceV2.reducer(
      buildStateWithImageCategory(),
      deleteImageCategory(IMG_CAT_ID),
    );
    expect(s.relationships.imageCategories[IMG_CAT_ID]).toBeUndefined();
  });

  it("cannot delete the unknown image category (no-op)", () => {
    const initial = dataSliceV2.reducer(undefined, { type: "@@INIT" } as any);
    const unknownCatId = Object.values(initial.categories.entities).find(
      (c) => c?.type === "image" && c.isUnknown,
    )!.id;
    const after = dataSliceV2.reducer(
      initial,
      deleteImageCategory(unknownCatId),
    );
    expect(after.categories.ids).toContain(unknownCatId);
  });
});

describe("deleteAnnotationCategory", () => {
  const KIND_ID = "kind-ac";
  const UNKNOWN_KIND_CAT_ID = "kind-ac-unknown";
  const CUSTOM_CAT_ID = "custom-ann-cat";

  function buildStateWithAnnotationCategory() {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("series-1")],
        images: [makeImage("img-1", "foo")],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    s = dataSliceV2.reducer(s, addKind(makeKind(KIND_ID, UNKNOWN_KIND_CAT_ID)));
    s = dataSliceV2.reducer(
      s,
      addCategory(makeAnnotationCategory(UNKNOWN_KIND_CAT_ID, KIND_ID, true)),
    );
    s = dataSliceV2.reducer(
      s,
      addCategory(makeAnnotationCategory(CUSTOM_CAT_ID, KIND_ID)),
    );
    s = dataSliceV2.reducer(
      s,
      addAnnotationVolume(
        makeAnnotationVolume("vol-1", "img-1", KIND_ID, CUSTOM_CAT_ID),
      ),
    );
    return s;
  }

  it("removes the annotation category", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotationCategory(),
      deleteAnnotationCategory(CUSTOM_CAT_ID),
    );
    expect(s.categories.ids).not.toContain(CUSTOM_CAT_ID);
  });

  it("reassigns annotation volumes to kind's unknown category", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotationCategory(),
      deleteAnnotationCategory(CUSTOM_CAT_ID),
    );
    expect(s.annotationVolumes.entities["vol-1"]?.categoryId).toBe(
      UNKNOWN_KIND_CAT_ID,
    );
  });

  it("removes the category from its kind relationship", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotationCategory(),
      deleteAnnotationCategory(CUSTOM_CAT_ID),
    );
    expect(s.relationships.kinds[KIND_ID]?.categoryIds).not.toContain(
      CUSTOM_CAT_ID,
    );
  });

  it("cannot delete a kind's unknown annotation category (no-op)", () => {
    const before = buildStateWithAnnotationCategory();
    const after = dataSliceV2.reducer(
      before,
      deleteAnnotationCategory(UNKNOWN_KIND_CAT_ID),
    );
    expect(after.categories.ids).toContain(UNKNOWN_KIND_CAT_ID);
  });
});

describe("updateImageCategory", () => {
  const OLD_CAT = "img-cat-old";
  const NEW_CAT = "img-cat-new";

  function buildState() {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("series-1")],
        images: [{ ...makeImage("img-1", "foo"), categoryId: OLD_CAT }],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    s = dataSliceV2.reducer(s, addCategory(makeImageCategory(OLD_CAT)));
    s = dataSliceV2.reducer(s, addCategory(makeImageCategory(NEW_CAT)));
    return s;
  }

  it("updates the image's categoryId", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      updateImageCategory({ imageId: "img-1", categoryId: NEW_CAT }),
    );
    expect(s.images.entities["img-1"]?.categoryId).toBe(NEW_CAT);
  });

  it("removes image from old category's relationship", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      updateImageCategory({ imageId: "img-1", categoryId: NEW_CAT }),
    );
    expect(s.relationships.imageCategories[OLD_CAT]?.imageIds).not.toContain(
      "img-1",
    );
  });

  it("adds image to new category's relationship", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      updateImageCategory({ imageId: "img-1", categoryId: NEW_CAT }),
    );
    expect(s.relationships.imageCategories[NEW_CAT]?.imageIds).toContain(
      "img-1",
    );
  });

  it("is a no-op when categoryId is unchanged", () => {
    const before = buildState();
    const after = dataSliceV2.reducer(
      before,
      updateImageCategory({ imageId: "img-1", categoryId: OLD_CAT }),
    );
    expect(after.relationships.imageCategories[OLD_CAT]?.imageIds).toContain(
      "img-1",
    );
  });
});

describe("updateAnnotationVolumeKind", () => {
  const KIND_A = "kind-a";
  const KIND_A_UNKNOWN_CAT = "kind-a-unknown";
  const KIND_B = "kind-b";
  const KIND_B_UNKNOWN_CAT = "kind-b-unknown";

  function buildState() {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("series-1")],
        images: [makeImage("img-1", "foo")],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    s = dataSliceV2.reducer(s, addKind(makeKind(KIND_A, KIND_A_UNKNOWN_CAT)));
    s = dataSliceV2.reducer(
      s,
      addCategory(makeAnnotationCategory(KIND_A_UNKNOWN_CAT, KIND_A, true)),
    );
    s = dataSliceV2.reducer(s, addKind(makeKind(KIND_B, KIND_B_UNKNOWN_CAT)));
    s = dataSliceV2.reducer(
      s,
      addCategory(makeAnnotationCategory(KIND_B_UNKNOWN_CAT, KIND_B, true)),
    );
    s = dataSliceV2.reducer(
      s,
      addAnnotationVolume(
        makeAnnotationVolume("vol-1", "img-1", KIND_A, KIND_A_UNKNOWN_CAT),
      ),
    );
    return s;
  }

  it("updates the volume's kindId", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      updateAnnotationVolumeKind({ volumeId: "vol-1", kindId: KIND_B }),
    );
    expect(s.annotationVolumes.entities["vol-1"]?.kindId).toBe(KIND_B);
  });

  it("resets categoryId to the new kind's unknown category", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      updateAnnotationVolumeKind({ volumeId: "vol-1", kindId: KIND_B }),
    );
    expect(s.annotationVolumes.entities["vol-1"]?.categoryId).toBe(
      KIND_B_UNKNOWN_CAT,
    );
  });

  it("moves volume from old kind to new kind in relationships", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      updateAnnotationVolumeKind({ volumeId: "vol-1", kindId: KIND_B }),
    );
    expect(s.relationships.kinds[KIND_A]?.annotationVolumeIds).not.toContain(
      "vol-1",
    );
    expect(s.relationships.kinds[KIND_B]?.annotationVolumeIds).toContain(
      "vol-1",
    );
  });
});
