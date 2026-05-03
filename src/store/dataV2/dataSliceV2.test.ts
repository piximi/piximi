import { describe, expect, it } from "vitest";

import { Partition } from "utils/dl/enums";

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
  Channel,
  ChannelMeta,
} from "./types";

const {
  clearState,
  setState,
  newExperiment,
  addImageSeries,
  addImages,
  deleteImageSeries,
  updateImageSeriesName,
  updateImageSeriesActiveImage,
  deleteImageObject,
  batchDeleteImageObject,
  updateImageName,
  updateImageActivePlane,
  updateImagePartition,
  addAnnotationVolume,
  batchAddAnnotationVolume,
  deleteAnnotationVolume,
  batchDeleteAnnotationVolume,
  addAnnotation,
  batchAddAnnotation,
  updateAnnotationPartition,
  deleteAnnotation,
  batchDeleteAnnotation,
  addKind,
  batchAddKind,
  updateKindName,
  deleteKind,
  addCategory,
  batchAddCategory,
  updateCategoryDisplayProps: updateCategoryName,
  deleteImageCategory,
  deleteAnnotationCategory,
  updateImageCategory,
  batchUpdateImageCategory,
  updateAnnotationVolumeCategory,
  batchUpdateAnnotationVolumeCategory,
  updateAnnotationVolumeKind,
  batchUpdateAnnotationVolumeKind,
  updateChannelMeta,
  batchUpdateChannelMeta,
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

function makeImage(
  id: string,
  name: string,
  seriesId = "series-1",
): ImageObject {
  return {
    id,
    name,
    seriesId,
    categoryId: "cat-1",
    activePlaneId: "plane-1",
    timepoint: 0,
    bitDepth: 8,
    partition: Partition.Unassigned,
    shape: { planes: 1, height: 10, width: 10, channels: 1 },
  };
}

function makeChannelMeta(id: string, seriesId: string): ChannelMeta {
  return {
    id,
    name: "ch-meta",
    seriesId,
    bitDepth: 8,
    colorMap: [255, 0, 0] as [number, number, number],
    visible: true,
    minValue: 0,
    maxValue: 255,
    rampMin: 10,
    rampMax: 200,
    rampMinLimit: 0,
    rampMaxLimit: 255,
  };
}

// Cascade-delete only reads planeId from Channel, so we cast a minimal object
function makeChannel(id: string, planeId: string): Channel {
  return { id, planeId } as Channel;
}

// ── State lifecycle ───────────────────────────────────────────────────────────

describe("clearState", () => {
  it("empties all user-added entity collections", () => {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [makeImage("img-1", "foo", "s1")],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    s = dataSliceV2.reducer(s, clearState());

    expect(s.imageSeries.ids).toHaveLength(0);
    expect(s.images.ids).toHaveLength(0);
    expect(s.planes.ids).toHaveLength(0);
    expect(s.annotations.ids).toHaveLength(0);
    expect(s.annotationVolumes.ids).toHaveLength(0);
  });

  it("retains the unknown kind and both unknown categories after clear", () => {
    let s = dataSliceV2.reducer(undefined, addKind(makeKind("k1", "kc1")));
    s = dataSliceV2.reducer(
      s,
      addCategory(makeAnnotationCategory("kc1", "k1", true)),
    );
    s = dataSliceV2.reducer(s, clearState());

    expect(s.kinds.ids).toHaveLength(1);
    expect(s.kinds.entities[s.kinds.ids[0] as string]?.name).toBe("Unknown");
    expect(s.categories.ids).toHaveLength(2);
  });
});

describe("setState", () => {
  const basePayload = {
    experiment: { id: "exp-1", name: "Exp" } as Experiment,
    imageSeries: [makeSeries("s1")],
    images: [makeImage("img-1", "foo", "s1")],
    kinds: [makeKind("k1", "kc1")],
    categories: [makeAnnotationCategory("kc1", "k1", true)],
    planes: [],
    channels: [] as Channel[],
    channelMetas: [],
    annotations: [],
    annotationVolumes: [],
  };

  it("populates all entity slices from payload", () => {
    const s = dataSliceV2.reducer(undefined, setState(basePayload));

    expect(s.experiment.id).toBe("exp-1");
    expect(s.imageSeries.ids).toContain("s1");
    expect(s.images.ids).toContain("img-1");
    expect(s.kinds.ids).toContain("k1");
  });

  it("replaces existing entities rather than merging", () => {
    const s0 = dataSliceV2.reducer(undefined, setState(basePayload));
    expect(s0.imageSeries.ids).toContain("s1");

    const s1 = dataSliceV2.reducer(
      s0,
      setState({
        ...basePayload,
        experiment: { id: "exp-2", name: "Exp 2" },
        imageSeries: [makeSeries("s2")],
        images: [],
      }),
    );

    expect(s1.imageSeries.ids).not.toContain("s1");
    expect(s1.imageSeries.ids).toContain("s2");
    expect(s1.experiment.id).toBe("exp-2");
  });

  it("always preserves the unknown kind and categories regardless of payload", () => {
    const s = dataSliceV2.reducer(
      undefined,
      setState({ ...basePayload, kinds: [], categories: [] }),
    );

    const unknownKind = Object.values(s.kinds.entities).find(
      (k) => k?.name === "Unknown",
    );
    expect(unknownKind).toBeDefined();

    const catTypes = Object.values(s.categories.entities).map((c) => c?.type);
    expect(catTypes).toContain("image");
    expect(catTypes).toContain("annotation");
  });
});

describe("newExperiment", () => {
  it("retains unknown Kind and Categories after reset", () => {
    const exp: Experiment = { id: "exp-2", name: "New Exp" };
    const state = dataSliceV2.reducer(undefined, newExperiment(exp));

    expect(state.kinds.ids).toHaveLength(1);
    const unknownKind = Object.values(state.kinds.entities)[0];
    expect(unknownKind?.name).toBe("Unknown");

    expect(state.categories.ids).toHaveLength(2);
    const catTypes = Object.values(state.categories.entities).map(
      (c) => c?.type,
    );
    expect(catTypes).toContain("image");
    expect(catTypes).toContain("annotation");
  });
});

// ── ImageSeries ───────────────────────────────────────────────────────────────

describe("addImageSeries", () => {
  it("adds the series entity", () => {
    const s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    expect(s.imageSeries.ids).toContain("s1");
  });

  it("adds child images", () => {
    const s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [makeImage("img-1", "foo", "s1")],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    expect(s.images.ids).toContain("img-1");
  });

  it("adds child planes", () => {
    const s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [],
        planes: [makePlane("p1", "img-1")],
        channels: [],
        channelMetas: [],
      }),
    );
    expect(s.planes.ids).toContain("p1");
  });

  it("adds channel metas", () => {
    const s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [],
        planes: [],
        channels: [],
        channelMetas: [makeChannelMeta("cm-1", "s1")],
      }),
    );
    expect(s.channelMetas.ids).toContain("cm-1");
  });
});

describe("updateImageSeriesName", () => {
  it("updates the series name", () => {
    const s0 = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1", "Old Name")],
        images: [],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    const s = dataSliceV2.reducer(
      s0,
      updateImageSeriesName({ seriesId: "s1", name: "New Name" }),
    );
    expect(s.imageSeries.entities["s1"]?.name).toBe("New Name");
  });
});

describe("updateImageSeriesActiveImage", () => {
  it("updates activeImageId on the series", () => {
    const s0 = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [makeImage("img-1", "a", "s1"), makeImage("img-2", "b", "s1")],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    const s = dataSliceV2.reducer(
      s0,
      updateImageSeriesActiveImage({ seriesId: "s1", imageId: "img-2" }),
    );
    expect(s.imageSeries.entities["s1"]?.activeImageId).toBe("img-2");
  });
});

describe("deleteImageSeries", () => {
  function buildStateWithSeries() {
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

  it("removes child channels", () => {
    const s0 = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("series-1")],
        images: [makeImage("img-1", "foo")],
        planes: [makePlane("plane-1", "img-1")],
        channels: [makeChannel("ch-1", "plane-1")],
        channelMetas: [],
      }),
    );
    const s = dataSliceV2.reducer(s0, deleteImageSeries("series-1"));
    expect(s.channels.ids).not.toContain("ch-1");
  });

  it("removes child channelMetas", () => {
    const s0 = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("series-1")],
        images: [],
        planes: [],
        channels: [],
        channelMetas: [makeChannelMeta("cm-1", "series-1")],
      }),
    );
    const s = dataSliceV2.reducer(s0, deleteImageSeries("series-1"));
    expect(s.channelMetas.ids).not.toContain("cm-1");
  });

  it("is a no-op for an unknown seriesId", () => {
    const before = buildStateWithSeries();
    const after = dataSliceV2.reducer(before, deleteImageSeries("no-such-id"));
    expect(after.imageSeries.ids).toEqual(before.imageSeries.ids);
  });
});

// ── Images ────────────────────────────────────────────────────────────────────

describe("addImages", () => {
  it("does not mutate the original payload objects during name deduplication", () => {
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

    const incoming = makeImage("img-2", "foo");
    const originalName = incoming.name;
    state = dataSliceV2.reducer(
      state,
      addImages({ seriesId: "series-1", images: [incoming] }),
    );

    expect(incoming.name).toBe(originalName);
    expect(state.images.entities["img-2"]?.name).not.toBe(originalName);
  });

  it("is a no-op when seriesId does not exist", () => {
    const before = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    const after = dataSliceV2.reducer(
      before,
      addImages({
        seriesId: "no-such-series",
        images: [makeImage("img-1", "foo", "no-such-series")],
      }),
    );
    expect(after.images.ids).toHaveLength(0);
  });

  it("deduplicates three images with the same name into distinct names", () => {
    const base = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    const withFirst = dataSliceV2.reducer(
      base,
      addImages({ seriesId: "s1", images: [makeImage("img-a", "dup", "s1")] }),
    );
    const s = dataSliceV2.reducer(
      withFirst,
      addImages({
        seriesId: "s1",
        images: [
          makeImage("img-b", "dup", "s1"),
          makeImage("img-c", "dup", "s1"),
        ],
      }),
    );
    const names = ["img-a", "img-b", "img-c"].map(
      (id) => s.images.entities[id]?.name,
    );
    expect(new Set(names).size).toBe(3);
  });
});

describe("updateImageName", () => {
  it("updates the image name", () => {
    const s0 = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [makeImage("img-1", "old", "s1")],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    const s = dataSliceV2.reducer(
      s0,
      updateImageName({ imageId: "img-1", name: "new" }),
    );
    expect(s.images.entities["img-1"]?.name).toBe("new");
  });
});

describe("updateImageActivePlane", () => {
  it("updates activePlaneId on the image", () => {
    const s0 = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [makeImage("img-1", "foo", "s1")],
        planes: [makePlane("p1", "img-1"), makePlane("p2", "img-1")],
        channels: [],
        channelMetas: [],
      }),
    );
    const s = dataSliceV2.reducer(
      s0,
      updateImageActivePlane({ imageId: "img-1", planeId: "p2" }),
    );
    expect(s.images.entities["img-1"]?.activePlaneId).toBe("p2");
  });
});

describe("updateImagePartition", () => {
  it("updates partition on the image", () => {
    const s0 = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [makeImage("img-1", "foo", "s1")],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    const s = dataSliceV2.reducer(
      s0,
      updateImagePartition({ id: "img-1", partition: Partition.Training }),
    );
    expect(s.images.entities["img-1"]?.partition).toBe(Partition.Training);
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
      updateImageCategory({ id: "img-1", categoryId: NEW_CAT }),
    );
    expect(s.images.entities["img-1"]?.categoryId).toBe(NEW_CAT);
  });

  it("is a no-op when categoryId is already the target", () => {
    const before = buildState();
    const after = dataSliceV2.reducer(
      before,
      updateImageCategory({ id: "img-1", categoryId: OLD_CAT }),
    );
    expect(after.images.entities["img-1"]?.categoryId).toBe(OLD_CAT);
  });

  it("is a no-op when target category does not exist", () => {
    const before = buildState();
    const after = dataSliceV2.reducer(
      before,
      updateImageCategory({ id: "img-1", categoryId: "no-such-cat" }),
    );
    expect(after.images.entities["img-1"]?.categoryId).toBe(OLD_CAT);
  });
});

describe("batchUpdateImageCategory", () => {
  const CAT_A = "img-cat-a";
  const CAT_B = "img-cat-b";

  function buildState() {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [
          { ...makeImage("img-1", "a", "s1"), categoryId: CAT_A },
          { ...makeImage("img-2", "b", "s1"), categoryId: CAT_A },
        ],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    s = dataSliceV2.reducer(s, addCategory(makeImageCategory(CAT_A)));
    s = dataSliceV2.reducer(s, addCategory(makeImageCategory(CAT_B)));
    return s;
  }

  it("updates all images' categoryId", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      batchUpdateImageCategory([
        { id: "img-1", categoryId: CAT_B },
        { id: "img-2", categoryId: CAT_B },
      ]),
    );
    expect(s.images.entities["img-1"]?.categoryId).toBe(CAT_B);
    expect(s.images.entities["img-2"]?.categoryId).toBe(CAT_B);
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
        channels: [makeChannel("ch-1", "plane-1")],
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

  it("cascade-removes child planes", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotation(),
      deleteImageObject("img-1"),
    );
    expect(s.planes.ids).not.toContain("plane-1");
  });

  it("cascade-removes child channels", () => {
    const s = dataSliceV2.reducer(
      buildStateWithAnnotation(),
      deleteImageObject("img-1"),
    );
    expect(s.channels.ids).not.toContain("ch-1");
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

  it("is a no-op for an unknown imageId", () => {
    const before = buildStateWithAnnotation();
    const after = dataSliceV2.reducer(before, deleteImageObject("no-such-id"));
    expect(after.images.ids).toEqual(before.images.ids);
  });
});

describe("batchDeleteImageObject", () => {
  function buildState() {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [makeImage("img-1", "a", "s1"), makeImage("img-2", "b", "s1")],
        planes: [makePlane("p1", "img-1"), makePlane("p2", "img-2")],
        channels: [makeChannel("ch-1", "p1"), makeChannel("ch-2", "p2")],
        channelMetas: [],
      }),
    );
    const KIND_ID = "kind-b";
    const KIND_CAT_ID = "kind-cat-b";
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
      addAnnotation(makeAnnotation("ann-1", "p1", "img-1", "vol-1")),
    );
    return s;
  }

  it("removes all specified image entities", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      batchDeleteImageObject(["img-1", "img-2"]),
    );
    expect(s.images.ids).not.toContain("img-1");
    expect(s.images.ids).not.toContain("img-2");
  });

  it("cascade-removes child planes and channels", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      batchDeleteImageObject(["img-1"]),
    );
    expect(s.planes.ids).not.toContain("p1");
    expect(s.channels.ids).not.toContain("ch-1");
  });

  it("cascade-removes annotation volumes and annotations", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      batchDeleteImageObject(["img-1"]),
    );
    expect(s.annotationVolumes.ids).not.toContain("vol-1");
    expect(s.annotations.ids).not.toContain("ann-1");
  });

  it("skips unknown ids without affecting valid ones", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      batchDeleteImageObject(["img-1", "no-such-id"]),
    );
    expect(s.images.ids).not.toContain("img-1");
    expect(s.images.ids).toContain("img-2");
  });
});

// ── Kinds ─────────────────────────────────────────────────────────────────────

describe("batchAddKind", () => {
  it("adds multiple kinds in one dispatch", () => {
    const s = dataSliceV2.reducer(
      undefined,
      batchAddKind([makeKind("k1", "kc1"), makeKind("k2", "kc2")]),
    );
    expect(s.kinds.ids).toContain("k1");
    expect(s.kinds.ids).toContain("k2");
  });
});

describe("updateKindName", () => {
  it("updates the kind name", () => {
    const s0 = dataSliceV2.reducer(undefined, addKind(makeKind("k1", "kc1")));
    const s = dataSliceV2.reducer(
      s0,
      updateKindName({ kindId: "k1", name: "Renamed" }),
    );
    expect(s.kinds.entities["k1"]?.name).toBe("Renamed");
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

  it("cannot delete the unknown kind (no-op)", () => {
    const initial = dataSliceV2.reducer(undefined, { type: "@@INIT" } as any);
    const unknownKindId = Object.values(initial.kinds.entities).find(
      (k) => k?.name === "Unknown",
    )!.id;

    const after = dataSliceV2.reducer(initial, deleteKind(unknownKindId));
    expect(after.kinds.ids).toContain(unknownKindId);
  });
});

// ── Categories ────────────────────────────────────────────────────────────────

describe("batchAddCategory", () => {
  it("adds multiple categories in one dispatch", () => {
    const s = dataSliceV2.reducer(
      undefined,
      batchAddCategory([makeImageCategory("ic1"), makeImageCategory("ic2")]),
    );
    expect(s.categories.ids).toContain("ic1");
    expect(s.categories.ids).toContain("ic2");
  });
});

describe("updateCategoryName", () => {
  it("updates the category name", () => {
    const s0 = dataSliceV2.reducer(
      undefined,
      addCategory(makeImageCategory("ic1")),
    );
    const s = dataSliceV2.reducer(
      s0,
      updateCategoryName({ id: "ic1", name: "Renamed" }),
    );
    expect(s.categories.entities["ic1"]?.name).toBe("Renamed");
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

  it("cannot delete a kind's unknown annotation category (no-op)", () => {
    const before = buildStateWithAnnotationCategory();
    const after = dataSliceV2.reducer(
      before,
      deleteAnnotationCategory(UNKNOWN_KIND_CAT_ID),
    );
    expect(after.categories.ids).toContain(UNKNOWN_KIND_CAT_ID);
  });
});

// ── AnnotationVolumes ─────────────────────────────────────────────────────────

describe("updateAnnotationVolumeCategory", () => {
  const KIND_ID = "kind-uavc";
  const OLD_CAT = "kind-uavc-unknown";
  const NEW_CAT = "kind-uavc-custom";

  function buildState() {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [makeImage("img-1", "foo", "s1")],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    s = dataSliceV2.reducer(s, addKind(makeKind(KIND_ID, OLD_CAT)));
    s = dataSliceV2.reducer(
      s,
      addCategory(makeAnnotationCategory(OLD_CAT, KIND_ID, true)),
    );
    s = dataSliceV2.reducer(
      s,
      addCategory(makeAnnotationCategory(NEW_CAT, KIND_ID)),
    );
    s = dataSliceV2.reducer(
      s,
      addAnnotationVolume(
        makeAnnotationVolume("vol-1", "img-1", KIND_ID, OLD_CAT),
      ),
    );
    return s;
  }

  it("updates the volume's categoryId", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      updateAnnotationVolumeCategory({
        volumeId: "vol-1",
        categoryId: NEW_CAT,
      }),
    );
    expect(s.annotationVolumes.entities["vol-1"]?.categoryId).toBe(NEW_CAT);
  });

  it("is a no-op when categoryId is already the target", () => {
    const before = buildState();
    const after = dataSliceV2.reducer(
      before,
      updateAnnotationVolumeCategory({
        volumeId: "vol-1",
        categoryId: OLD_CAT,
      }),
    );
    expect(after.annotationVolumes.entities["vol-1"]?.categoryId).toBe(OLD_CAT);
  });

  it("is a no-op when target category does not exist", () => {
    const before = buildState();
    const after = dataSliceV2.reducer(
      before,
      updateAnnotationVolumeCategory({
        volumeId: "vol-1",
        categoryId: "no-such-cat",
      }),
    );
    expect(after.annotationVolumes.entities["vol-1"]?.categoryId).toBe(OLD_CAT);
  });
});

describe("batchUpdateAnnotationVolumeCategory", () => {
  const KIND_ID = "kind-buavc";
  const CAT_A = "cat-a-buavc";
  const CAT_B = "cat-b-buavc";

  function buildState() {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [makeImage("img-1", "foo", "s1")],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    s = dataSliceV2.reducer(s, addKind(makeKind(KIND_ID, CAT_A)));
    s = dataSliceV2.reducer(
      s,
      addCategory(makeAnnotationCategory(CAT_A, KIND_ID, true)),
    );
    s = dataSliceV2.reducer(
      s,
      addCategory(makeAnnotationCategory(CAT_B, KIND_ID)),
    );
    s = dataSliceV2.reducer(
      s,
      batchAddAnnotationVolume([
        makeAnnotationVolume("vol-1", "img-1", KIND_ID, CAT_A),
        makeAnnotationVolume("vol-2", "img-1", KIND_ID, CAT_A),
      ]),
    );
    return s;
  }

  it("updates all volumes' categoryId", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      batchUpdateAnnotationVolumeCategory([
        { volumeId: "vol-1", categoryId: CAT_B },
        { volumeId: "vol-2", categoryId: CAT_B },
      ]),
    );
    expect(s.annotationVolumes.entities["vol-1"]?.categoryId).toBe(CAT_B);
    expect(s.annotationVolumes.entities["vol-2"]?.categoryId).toBe(CAT_B);
  });

  it("skips entry when volume does not exist", () => {
    const before = buildState();
    const after = dataSliceV2.reducer(
      before,
      batchUpdateAnnotationVolumeCategory([
        { volumeId: "no-such-vol", categoryId: CAT_B },
      ]),
    );
    expect(after.annotationVolumes.ids).toEqual(before.annotationVolumes.ids);
  });

  it("skips entry when categoryId is already the target", () => {
    const before = buildState();
    const after = dataSliceV2.reducer(
      before,
      batchUpdateAnnotationVolumeCategory([
        { volumeId: "vol-1", categoryId: CAT_A },
      ]),
    );
    expect(after.annotationVolumes.entities["vol-1"]?.categoryId).toBe(CAT_A);
  });

  it("skips entry when target category does not exist", () => {
    const before = buildState();
    const after = dataSliceV2.reducer(
      before,
      batchUpdateAnnotationVolumeCategory([
        { volumeId: "vol-1", categoryId: "no-such-cat" },
      ]),
    );
    expect(after.annotationVolumes.entities["vol-1"]?.categoryId).toBe(CAT_A);
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
});

describe("batchUpdateAnnotationVolumeKind", () => {
  const KIND_A = "kind-a-buavk";
  const KIND_A_CAT = "kind-a-cat-buavk";
  const KIND_B = "kind-b-buavk";
  const KIND_B_CAT = "kind-b-cat-buavk";

  function buildState() {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [makeImage("img-1", "foo", "s1")],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    s = dataSliceV2.reducer(s, addKind(makeKind(KIND_A, KIND_A_CAT)));
    s = dataSliceV2.reducer(
      s,
      addCategory(makeAnnotationCategory(KIND_A_CAT, KIND_A, true)),
    );
    s = dataSliceV2.reducer(s, addKind(makeKind(KIND_B, KIND_B_CAT)));
    s = dataSliceV2.reducer(
      s,
      addCategory(makeAnnotationCategory(KIND_B_CAT, KIND_B, true)),
    );
    s = dataSliceV2.reducer(
      s,
      batchAddAnnotationVolume([
        makeAnnotationVolume("vol-1", "img-1", KIND_A, KIND_A_CAT),
        makeAnnotationVolume("vol-2", "img-1", KIND_A, KIND_A_CAT),
      ]),
    );
    return s;
  }

  it("updates all volumes' kindId", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      batchUpdateAnnotationVolumeKind([
        { volumeId: "vol-1", kindId: KIND_B },
        { volumeId: "vol-2", kindId: KIND_B },
      ]),
    );
    expect(s.annotationVolumes.entities["vol-1"]?.kindId).toBe(KIND_B);
    expect(s.annotationVolumes.entities["vol-2"]?.kindId).toBe(KIND_B);
  });

  it("resets categoryId to the new kind's unknown category", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      batchUpdateAnnotationVolumeKind([{ volumeId: "vol-1", kindId: KIND_B }]),
    );
    expect(s.annotationVolumes.entities["vol-1"]?.categoryId).toBe(KIND_B_CAT);
  });

  it("skips entry when volume does not exist", () => {
    const before = buildState();
    const after = dataSliceV2.reducer(
      before,
      batchUpdateAnnotationVolumeKind([
        { volumeId: "no-such-vol", kindId: KIND_B },
      ]),
    );
    expect(after.annotationVolumes.ids).toEqual(before.annotationVolumes.ids);
  });

  it("skips entry when kindId is already the target", () => {
    const before = buildState();
    const after = dataSliceV2.reducer(
      before,
      batchUpdateAnnotationVolumeKind([{ volumeId: "vol-1", kindId: KIND_A }]),
    );
    expect(after.annotationVolumes.entities["vol-1"]?.kindId).toBe(KIND_A);
  });
});

describe("deleteAnnotationVolume", () => {
  const KIND_ID = "kind-dav";
  const KIND_CAT_ID = "kind-cat-dav";

  function buildState() {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [makeImage("img-1", "foo", "s1")],
        planes: [makePlane("p1", "img-1")],
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
      addAnnotation(makeAnnotation("ann-1", "p1", "img-1", "vol-1")),
    );
    return s;
  }

  it("removes the annotation volume entity", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      deleteAnnotationVolume("vol-1"),
    );
    expect(s.annotationVolumes.ids).not.toContain("vol-1");
  });

  it("cascade-removes child annotations", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      deleteAnnotationVolume("vol-1"),
    );
    expect(s.annotations.ids).not.toContain("ann-1");
  });
});

describe("batchDeleteAnnotationVolume", () => {
  const KIND_ID = "kind-bdav";
  const KIND_CAT_ID = "kind-cat-bdav";

  function buildState() {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [makeImage("img-1", "foo", "s1")],
        planes: [makePlane("p1", "img-1")],
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
      addAnnotationVolume(
        makeAnnotationVolume("vol-2", "img-1", KIND_ID, KIND_CAT_ID),
      ),
    );
    s = dataSliceV2.reducer(
      s,
      addAnnotation(makeAnnotation("ann-1", "p1", "img-1", "vol-1")),
    );
    return s;
  }

  it("removes all specified volumes", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      batchDeleteAnnotationVolume(["vol-1", "vol-2"]),
    );
    expect(s.annotationVolumes.ids).not.toContain("vol-1");
    expect(s.annotationVolumes.ids).not.toContain("vol-2");
  });

  it("cascade-removes child annotations", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      batchDeleteAnnotationVolume(["vol-1"]),
    );
    expect(s.annotations.ids).not.toContain("ann-1");
  });
});

// ── Annotations ───────────────────────────────────────────────────────────────

describe("batchAddAnnotation", () => {
  it("adds multiple annotations in one dispatch", () => {
    const s = dataSliceV2.reducer(
      undefined,
      batchAddAnnotation([
        makeAnnotation("ann-1", "p1", "img-1", "vol-1"),
        makeAnnotation("ann-2", "p1", "img-1", "vol-1"),
      ]),
    );
    expect(s.annotations.ids).toContain("ann-1");
    expect(s.annotations.ids).toContain("ann-2");
  });
});

describe("updateAnnotationPartition", () => {
  it("updates partition on the annotation", () => {
    const s0 = dataSliceV2.reducer(
      undefined,
      addAnnotation(makeAnnotation("ann-1", "p1", "img-1", "vol-1")),
    );
    const s = dataSliceV2.reducer(
      s0,
      updateAnnotationPartition({
        id: "ann-1",
        partition: Partition.Validation,
      }),
    );
    expect(s.annotations.entities["ann-1"]?.partition).toBe(
      Partition.Validation,
    );
  });
});

describe("deleteAnnotation", () => {
  function buildState() {
    let s = dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [makeImage("img-1", "foo", "s1")],
        planes: [makePlane("p1", "img-1")],
        channels: [],
        channelMetas: [],
      }),
    );
    const KIND_ID = "kind-da";
    const KIND_CAT_ID = "kind-cat-da";
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
      addAnnotation(makeAnnotation("ann-1", "p1", "img-1", "vol-1")),
    );
    return s;
  }

  it("removes the annotation entity", () => {
    const s = dataSliceV2.reducer(buildState(), deleteAnnotation("ann-1"));
    expect(s.annotations.ids).not.toContain("ann-1");
  });

  it("is a no-op for an unknown annotationId", () => {
    const before = buildState();
    const after = dataSliceV2.reducer(before, deleteAnnotation("no-such-id"));
    expect(after.annotations.ids).toEqual(before.annotations.ids);
  });
});

describe("batchDeleteAnnotation", () => {
  function buildState() {
    return dataSliceV2.reducer(
      undefined,
      batchAddAnnotation([
        makeAnnotation("ann-1", "p1", "img-1", "vol-1"),
        makeAnnotation("ann-2", "p1", "img-1", "vol-1"),
      ]),
    );
  }

  it("removes all specified annotation entities", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      batchDeleteAnnotation(["ann-1", "ann-2"]),
    );
    expect(s.annotations.ids).not.toContain("ann-1");
    expect(s.annotations.ids).not.toContain("ann-2");
  });

  it("skips unknown ids without affecting valid ones", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      batchDeleteAnnotation(["ann-1", "no-such-id"]),
    );
    expect(s.annotations.ids).not.toContain("ann-1");
    expect(s.annotations.ids).toContain("ann-2");
  });
});

// ── ChannelMeta ───────────────────────────────────────────────────────────────

describe("updateChannelMeta", () => {
  function buildState() {
    return dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [],
        planes: [],
        channels: [],
        channelMetas: [makeChannelMeta("cm-1", "s1")],
      }),
    );
  }

  it("updates a single field on the channel meta", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      updateChannelMeta({ id: "cm-1", changes: { visible: false } }),
    );
    expect(s.channelMetas.entities["cm-1"]?.visible).toBe(false);
  });

  it("updates multiple fields at once", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      updateChannelMeta({ id: "cm-1", changes: { rampMin: 50, rampMax: 150 } }),
    );
    expect(s.channelMetas.entities["cm-1"]?.rampMin).toBe(50);
    expect(s.channelMetas.entities["cm-1"]?.rampMax).toBe(150);
  });
});

describe("batchUpdateChannelMeta", () => {
  function buildState() {
    return dataSliceV2.reducer(
      undefined,
      addImageSeries({
        imageSeries: [makeSeries("s1")],
        images: [],
        planes: [],
        channels: [],
        channelMetas: [
          makeChannelMeta("cm-1", "s1"),
          makeChannelMeta("cm-2", "s1"),
        ],
      }),
    );
  }

  it("updates multiple channel metas in one dispatch", () => {
    const s = dataSliceV2.reducer(
      buildState(),
      batchUpdateChannelMeta([
        { id: "cm-1", changes: { visible: false } },
        { id: "cm-2", changes: { rampMin: 20 } },
      ]),
    );
    expect(s.channelMetas.entities["cm-1"]?.visible).toBe(false);
    expect(s.channelMetas.entities["cm-2"]?.rampMin).toBe(20);
  });
});
