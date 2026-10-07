import { describe, expect, it } from "vitest";

import { Partition } from "core/dl/enums";
import { DTYPES, STORES, UNKNOWN_IMAGE_CATEGORY_ID } from "core/entities";

import {
  selectAllImages,
  selectAllKinds,
  selectAllCategories,
  selectImagesBySeriesId,
  selectImagesByCategoryId,
  selectAnnotationVolumesByImageId,
  selectAnnotationVolumesByKindId,
  selectAnnotationVolumesByCategoryId,
  selectAnnotationsByVolumeId,
  selectCategoriesByKindId,
  selectActiveImage,
  selectActivePlane,
  selectActiveChannels,
  selectRepresentativeImages,
} from "./selectors";
import { dataSlice } from "./dataSlice";

import type {
  AnnotationCategory,
  AnnotationObject,
  AnnotationVolume,
  Channel,
  ChannelMeta,
  ImageObject,
  ImageSeries,
  Kind,
  Plane,
} from "core/entities";

import type { RootState } from "store/rootReducer";

function makeState(): RootState {
  const data = dataSlice.reducer(undefined, { type: "" });
  return { data } as unknown as RootState;
}

function makeSeries(id: string): ImageSeries {
  return {
    id,
    experimentId: "e1",
    name: "S1",
    bitDepth: 8,
    shape: { planes: 1, height: 10, width: 10, channels: 1 },
    timeSeries: false,
    activeImageId: `${id}-img`,
  };
}

function makeImage(
  id: string,
  seriesId: string,
  categoryId = "cat-img-unknown",
): ImageObject {
  return {
    id,
    name: id,
    seriesId,
    shape: { planes: 1, height: 10, width: 10, channels: 1 },
    categoryId,
    activePlaneId: `${id}-plane`,
    timepoint: 0,
    bitDepth: 8,
    partition: Partition.Unassigned,
  };
}

describe("Tier 1 selectors", () => {
  it("selectAllImages returns empty array on initial state", () => {
    expect(selectAllImages(makeState())).toEqual([]);
  });

  it("selectAllKinds returns at least UNKNOWN kind on initial state", () => {
    expect(selectAllKinds(makeState()).length).toBeGreaterThanOrEqual(1);
  });

  it("selectAllCategories returns at least 2 unknown categories on initial state", () => {
    expect(selectAllCategories(makeState()).length).toBeGreaterThanOrEqual(2);
  });
});

function makeStateWithImages() {
  const series = makeSeries("s1");
  const img1 = makeImage("img1", "s1");
  const img2 = makeImage("img2", "s1");
  let data = dataSlice.reducer(undefined, { type: "" });
  data = dataSlice.reducer(
    data,
    dataSlice.actions.addImageSeries({
      imageSeries: [series],
      images: [img1, img2],
      planes: [],
      channels: [],
      channelMetas: [],
    }),
  );
  return { data } as unknown as RootState;
}

describe("Tier 2 FK join selectors", () => {
  it("selectImagesBySeriesId returns images for that series", () => {
    const state = makeStateWithImages();
    const result = selectImagesBySeriesId(state, "s1");
    expect(result).toHaveLength(2);
    expect(result.every((im) => im.seriesId === "s1")).toBe(true);
  });

  it("selectImagesBySeriesId returns empty for unknown series", () => {
    expect(selectImagesBySeriesId(makeState(), "nonexistent")).toHaveLength(0);
  });

  it("selectImagesByCategoryId filters correctly", () => {
    let data = dataSlice.reducer(undefined, { type: "" });
    const series = makeSeries("s1");
    const img1 = makeImage("img1", "s1", "cat-a");
    const img2 = makeImage("img2", "s1", "cat-b");
    data = dataSlice.reducer(
      data,
      dataSlice.actions.addImageSeries({
        imageSeries: [series],
        images: [img1, img2],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    const state = { data } as unknown as RootState;
    expect(selectImagesByCategoryId(state, "cat-a")).toHaveLength(1);
    expect(selectImagesByCategoryId(state, "cat-a")[0].id).toBe("img1");
  });

  it("selectCategoriesByKindId returns annotation categories for that kind", () => {
    let data = dataSlice.reducer(undefined, { type: "" });
    const kind: Kind = {
      id: "k1",
      name: "K1",
      unknownCategoryId: "cat-k1-unk",
    };
    const category: AnnotationCategory = {
      id: "cat-k1-unk",
      name: "Unknown",
      type: "annotation",
      kindId: "k1",
      color: "#fff",
      isUnknown: true,
    };
    data = dataSlice.reducer(
      data,
      dataSlice.actions.addKind({ kind, category }),
    );
    const state = { data } as unknown as RootState;
    const result = selectCategoriesByKindId(state, "k1");
    expect(result.some((c) => c.id === "cat-k1-unk")).toBe(true);
  });

  it("selectAnnotationVolumesByImageId filters by imageId", () => {
    let data = dataSlice.reducer(undefined, { type: "" });
    const vol1: AnnotationVolume = {
      id: "v1",
      imageId: "img1",
      kindId: "k1",
      categoryId: "c1",
    };
    const vol2: AnnotationVolume = {
      id: "v2",
      imageId: "img2",
      kindId: "k1",
      categoryId: "c1",
    };
    data = dataSlice.reducer(
      data,
      dataSlice.actions.batchAddAnnotationVolume([vol1, vol2]),
    );
    const state = { data } as unknown as RootState;
    expect(selectAnnotationVolumesByImageId(state, "img1")).toHaveLength(1);
    expect(selectAnnotationVolumesByImageId(state, "img1")[0].id).toBe("v1");
  });

  it("selectAnnotationVolumesByKindId filters by kindId", () => {
    let data = dataSlice.reducer(undefined, { type: "" });
    const vol1: AnnotationVolume = {
      id: "v1",
      imageId: "img1",
      kindId: "k1",
      categoryId: "c1",
    };
    const vol2: AnnotationVolume = {
      id: "v2",
      imageId: "img1",
      kindId: "k2",
      categoryId: "c2",
    };
    data = dataSlice.reducer(
      data,
      dataSlice.actions.batchAddAnnotationVolume([vol1, vol2]),
    );
    const state = { data } as unknown as RootState;
    expect(selectAnnotationVolumesByKindId(state, "k1")).toHaveLength(1);
  });

  it("selectAnnotationVolumesByCategoryId filters by categoryId", () => {
    let data = dataSlice.reducer(undefined, { type: "" });
    const vol1: AnnotationVolume = {
      id: "v1",
      imageId: "img1",
      kindId: "k1",
      categoryId: "c1",
    };
    const vol2: AnnotationVolume = {
      id: "v2",
      imageId: "img1",
      kindId: "k1",
      categoryId: "c2",
    };
    data = dataSlice.reducer(
      data,
      dataSlice.actions.batchAddAnnotationVolume([vol1, vol2]),
    );
    const state = { data } as unknown as RootState;
    expect(selectAnnotationVolumesByCategoryId(state, "c1")).toHaveLength(1);
  });

  it("selectAnnotationsByVolumeId filters by volumeId", () => {
    let data = dataSlice.reducer(undefined, { type: "" });
    const ann1: AnnotationObject = {
      id: "a1",
      planeId: "pl1",
      imageId: "img1",
      volumeId: "v1",
      partition: Partition.Unassigned,
      shape: { planes: 1, height: 10, width: 10, channels: 1 },
      boundingBox: [0, 0, 10, 10],
      encodedMask: [],
    };
    const ann2: AnnotationObject = { ...ann1, id: "a2", volumeId: "v2" };
    data = dataSlice.reducer(
      data,
      dataSlice.actions.batchAddAnnotation([ann1, ann2]),
    );
    const state = { data } as unknown as RootState;
    expect(selectAnnotationsByVolumeId(state, "v1")).toHaveLength(1);
    expect(selectAnnotationsByVolumeId(state, "v1")[0].id).toBe("a1");
  });
});

describe("Tier 2 active-entity selectors", () => {
  it("selectActiveImage returns the active image for a series", () => {
    let data = dataSlice.reducer(undefined, { type: "" });
    const series: ImageSeries = { ...makeSeries("s1"), activeImageId: "img1" };
    const img = makeImage("img1", "s1");
    data = dataSlice.reducer(
      data,
      dataSlice.actions.addImageSeries({
        imageSeries: [series],
        images: [img],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    const state = { data } as unknown as RootState;
    expect(selectActiveImage(state, "s1")?.id).toBe("img1");
  });

  it("selectActiveImage returns undefined for unknown series", () => {
    expect(selectActiveImage(makeState(), "nonexistent")).toBeUndefined();
  });

  it("selectActivePlane returns the active plane for an image", () => {
    let data = dataSlice.reducer(undefined, { type: "" });
    const series = makeSeries("s1");
    const img: ImageObject = {
      ...makeImage("img1", "s1"),
      activePlaneId: "pl1",
    };
    const plane: Plane = { id: "pl1", imageId: "img1", zIndex: 0 };
    data = dataSlice.reducer(
      data,
      dataSlice.actions.addImageSeries({
        imageSeries: [series],
        images: [img],
        planes: [plane],
        channels: [],
        channelMetas: [],
      }),
    );
    const state = { data } as unknown as RootState;
    expect(selectActivePlane(state, "img1")?.id).toBe("pl1");
  });

  it("selectActivePlane returns undefined for unknown image", () => {
    expect(selectActivePlane(makeState(), "nonexistent")).toBeUndefined();
  });

  it("selectActiveChannels returns only channels on the active plane", () => {
    let data = dataSlice.reducer(undefined, { type: "" });
    const series = makeSeries("s1");
    const img: ImageObject = {
      ...makeImage("img1", "s1"),
      activePlaneId: "pl1",
    };
    const plane: Plane = { id: "pl1", imageId: "img1", zIndex: 0 };
    const storageReference = {
      storageId: "sid",
      storeName: STORES.CHANNEL_DATA,
      width: 10,
      height: 10,
      dtype: DTYPES.UINT8,
      byteSize: 100,
    } as const;
    const ch1: Channel = {
      id: "ch1",
      planeId: "pl1",
      channelMetaId: "cm1",
      name: "C1",
      dtype: DTYPES.UINT8,
      storageReference,
      bitDepth: 8,
      width: 10,
      height: 10,
      maxValue: 255,
      minValue: 0,
    };
    const ch2: Channel = { ...ch1, id: "ch2", planeId: "pl2" }; // different plane
    data = dataSlice.reducer(
      data,
      dataSlice.actions.addImageSeries({
        imageSeries: [series],
        images: [img],
        planes: [plane],
        channels: [ch1, ch2],
        channelMetas: [],
      }),
    );
    const state = { data } as unknown as RootState;
    const result = selectActiveChannels(state, "img1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ch1");
  });

  it("selectActiveChannels returns empty array for unknown image", () => {
    expect(selectActiveChannels(makeState(), "nonexistent")).toEqual([]);
  });
});

describe("selectRepresentativeImages", () => {
  // buildExtendedImage drops images without an active plane, an existing
  // category, and at least one visible channel, so each image gets all three.
  function addRenderableSeries(
    data: RootState["data"],
    series: ImageSeries,
    imageIds: string[],
  ): RootState["data"] {
    const images = imageIds.map((id, timepoint) => ({
      ...makeImage(id, series.id, UNKNOWN_IMAGE_CATEGORY_ID),
      timepoint,
    }));
    const planes: Plane[] = imageIds.map((id) => ({
      id: `${id}-plane`,
      imageId: id,
      zIndex: 0,
    }));
    const channelMeta: ChannelMeta = {
      id: `${series.id}-cm`,
      name: "C1",
      bitDepth: 8,
      colorMap: [255, 255, 255],
      visible: true,
      minValue: 0,
      maxValue: 255,
      rampMin: 0,
      rampMax: 255,
      rampMinLimit: 0,
      rampMaxLimit: 255,
    };
    const channels: Channel[] = imageIds.map((id) => ({
      id: `${id}-ch`,
      planeId: `${id}-plane`,
      channelMetaId: channelMeta.id,
      name: "C1",
      dtype: DTYPES.UINT8,
      storageReference: {
        storageId: `${id}-sid`,
        storeName: STORES.CHANNEL_DATA,
        width: 10,
        height: 10,
        dtype: DTYPES.UINT8,
        byteSize: 100,
      },
      bitDepth: 8,
      width: 10,
      height: 10,
      maxValue: 255,
      minValue: 0,
    }));
    return dataSlice.reducer(
      data,
      dataSlice.actions.addImageSeries({
        imageSeries: [series],
        images,
        planes,
        channels,
        channelMetas: [channelMeta],
      }),
    );
  }

  it("returns one image per series: each series' active image", () => {
    let data = dataSlice.reducer(undefined, { type: "" });
    data = addRenderableSeries(
      data,
      { ...makeSeries("s1"), activeImageId: "s1-b" },
      ["s1-a", "s1-b", "s1-c"],
    );
    data = addRenderableSeries(
      data,
      { ...makeSeries("s2"), activeImageId: "s2-a" },
      ["s2-a", "s2-b", "s2-c"],
    );
    const state = { data } as unknown as RootState;

    const result = selectRepresentativeImages(state);
    expect(result.map((im) => im.id)).toEqual(["s1-b", "s2-a"]);
  });

  it("returns the image referenced by the series' activeImageId", () => {
    let data = dataSlice.reducer(undefined, { type: "" });
    // Active image is not timepoint 0, so this can't pass by picking the first.
    data = addRenderableSeries(
      data,
      { ...makeSeries("ts1"), timeSeries: true, activeImageId: "ti1" },
      ["ti0", "ti1"],
    );
    const state = { data } as unknown as RootState;

    const result = selectRepresentativeImages(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ti1");
  });
});
