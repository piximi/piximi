import { describe, expect, it } from "vitest";

import type { RootState } from "store/rootReducer";

import { Partition } from "utils/dl/enums";
import { STORES } from "utils/data-connector/types";

import { DTYPES } from "./types";
import {
  selectAllImageSeries,
  selectImageSeriesById,
  selectAllImages,
  selectImageById,
  selectAllPlanes,
  selectPlaneById,
  selectAllChannels,
  selectChannelById,
  selectAllChannelMetas,
  selectChannelMetaById,
  selectAllKinds,
  selectKindById,
  selectAllCategories,
  selectCategoryById,
  selectAllAnnotationVolumes,
  selectAnnotationVolumeById,
  selectAllAnnotations,
  selectAnnotationById,
  selectImagesBySeriesId,
  selectImagesByCategoryId,
  selectPlanesByImageId,
  selectChannelsByPlaneId,
  selectAnnotationVolumesByImageId,
  selectAnnotationVolumesByKindId,
  selectAnnotationVolumesByCategoryId,
  selectAnnotationsByVolumeId,
  selectCategoriesByKindId,
  selectChannelMetaByChannelId,
  selectActiveImage,
  selectActivePlane,
  selectActiveChannels,
  selectRepresentativeImages,
} from "./selectors";
import { dataSliceV2 } from "./dataSliceV2";

import type {
  ImageSeries,
  ImageObject,
  Kind,
  Category,
  AnnotationVolume,
  AnnotationObject,
  Plane,
  Channel,
} from "./types";

function makeState(): RootState {
  const dataV2 = dataSliceV2.reducer(undefined, { type: "" });
  return { dataV2 } as unknown as RootState;
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
  it("selectAllImageSeries returns empty array on initial state", () => {
    expect(selectAllImageSeries(makeState())).toEqual([]);
  });

  it("selectImageSeriesById returns correct series", () => {
    const series = makeSeries("s1");
    let dataV2 = dataSliceV2.reducer(undefined, { type: "" });
    dataV2 = dataSliceV2.reducer(
      dataV2,
      dataSliceV2.actions.addImageSeries({
        imageSeries: [series],
        images: [],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    const state = { dataV2 } as unknown as RootState;
    expect(selectImageSeriesById(state, "s1")).toEqual(series);
  });

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
  let dataV2 = dataSliceV2.reducer(undefined, { type: "" });
  dataV2 = dataSliceV2.reducer(
    dataV2,
    dataSliceV2.actions.addImageSeries({
      imageSeries: [series],
      images: [img1, img2],
      planes: [],
      channels: [],
      channelMetas: [],
    }),
  );
  return { dataV2 } as unknown as RootState;
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
    let dataV2 = dataSliceV2.reducer(undefined, { type: "" });
    const series = makeSeries("s1");
    const img1 = makeImage("img1", "s1", "cat-a");
    const img2 = makeImage("img2", "s1", "cat-b");
    dataV2 = dataSliceV2.reducer(
      dataV2,
      dataSliceV2.actions.addImageSeries({
        imageSeries: [series],
        images: [img1, img2],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    const state = { dataV2 } as unknown as RootState;
    expect(selectImagesByCategoryId(state, "cat-a")).toHaveLength(1);
    expect(selectImagesByCategoryId(state, "cat-a")[0].id).toBe("img1");
  });

  it("selectCategoriesByKindId returns annotation categories for that kind", () => {
    let dataV2 = dataSliceV2.reducer(undefined, { type: "" });
    const kind: Kind = {
      id: "k1",
      name: "K1",
      unknownCategoryId: "cat-k1-unk",
    };
    const cat: Category = {
      id: "cat-k1-unk",
      name: "Unknown",
      type: "annotation",
      kindId: "k1",
      color: "#fff",
      isUnknown: true,
    };
    dataV2 = dataSliceV2.reducer(dataV2, dataSliceV2.actions.addKind(kind));
    dataV2 = dataSliceV2.reducer(dataV2, dataSliceV2.actions.addCategory(cat));
    const state = { dataV2 } as unknown as RootState;
    const result = selectCategoriesByKindId(state, "k1");
    expect(result.some((c) => c.id === "cat-k1-unk")).toBe(true);
  });

  it("selectAnnotationVolumesByImageId filters by imageId", () => {
    let dataV2 = dataSliceV2.reducer(undefined, { type: "" });
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
    dataV2 = dataSliceV2.reducer(
      dataV2,
      dataSliceV2.actions.batchAddAnnotationVolume([vol1, vol2]),
    );
    const state = { dataV2 } as unknown as RootState;
    expect(selectAnnotationVolumesByImageId(state, "img1")).toHaveLength(1);
    expect(selectAnnotationVolumesByImageId(state, "img1")[0].id).toBe("v1");
  });

  it("selectAnnotationVolumesByKindId filters by kindId", () => {
    let dataV2 = dataSliceV2.reducer(undefined, { type: "" });
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
    dataV2 = dataSliceV2.reducer(
      dataV2,
      dataSliceV2.actions.batchAddAnnotationVolume([vol1, vol2]),
    );
    const state = { dataV2 } as unknown as RootState;
    expect(selectAnnotationVolumesByKindId(state, "k1")).toHaveLength(1);
  });

  it("selectAnnotationVolumesByCategoryId filters by categoryId", () => {
    let dataV2 = dataSliceV2.reducer(undefined, { type: "" });
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
    dataV2 = dataSliceV2.reducer(
      dataV2,
      dataSliceV2.actions.batchAddAnnotationVolume([vol1, vol2]),
    );
    const state = { dataV2 } as unknown as RootState;
    expect(selectAnnotationVolumesByCategoryId(state, "c1")).toHaveLength(1);
  });

  it("selectAnnotationsByVolumeId filters by volumeId", () => {
    let dataV2 = dataSliceV2.reducer(undefined, { type: "" });
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
    dataV2 = dataSliceV2.reducer(
      dataV2,
      dataSliceV2.actions.batchAddAnnotation([ann1, ann2]),
    );
    const state = { dataV2 } as unknown as RootState;
    expect(selectAnnotationsByVolumeId(state, "v1")).toHaveLength(1);
    expect(selectAnnotationsByVolumeId(state, "v1")[0].id).toBe("a1");
  });
});

describe("Tier 2 active-entity selectors", () => {
  it("selectActiveImage returns the active image for a series", () => {
    let dataV2 = dataSliceV2.reducer(undefined, { type: "" });
    const series: ImageSeries = { ...makeSeries("s1"), activeImageId: "img1" };
    const img = makeImage("img1", "s1");
    dataV2 = dataSliceV2.reducer(
      dataV2,
      dataSliceV2.actions.addImageSeries({
        imageSeries: [series],
        images: [img],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    const state = { dataV2 } as unknown as RootState;
    expect(selectActiveImage(state, "s1")?.id).toBe("img1");
  });

  it("selectActiveImage returns undefined for unknown series", () => {
    expect(selectActiveImage(makeState(), "nonexistent")).toBeUndefined();
  });

  it("selectActivePlane returns the active plane for an image", () => {
    let dataV2 = dataSliceV2.reducer(undefined, { type: "" });
    const series = makeSeries("s1");
    const img: ImageObject = {
      ...makeImage("img1", "s1"),
      activePlaneId: "pl1",
    };
    const plane: Plane = { id: "pl1", imageId: "img1", zIndex: 0 };
    dataV2 = dataSliceV2.reducer(
      dataV2,
      dataSliceV2.actions.addImageSeries({
        imageSeries: [series],
        images: [img],
        planes: [plane],
        channels: [],
        channelMetas: [],
      }),
    );
    const state = { dataV2 } as unknown as RootState;
    expect(selectActivePlane(state, "img1")?.id).toBe("pl1");
  });

  it("selectActivePlane returns undefined for unknown image", () => {
    expect(selectActivePlane(makeState(), "nonexistent")).toBeUndefined();
  });

  it("selectActiveChannels returns only channels on the active plane", () => {
    let dataV2 = dataSliceV2.reducer(undefined, { type: "" });
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
    dataV2 = dataSliceV2.reducer(
      dataV2,
      dataSliceV2.actions.addImageSeries({
        imageSeries: [series],
        images: [img],
        planes: [plane],
        channels: [ch1, ch2],
        channelMetas: [],
      }),
    );
    const state = { dataV2 } as unknown as RootState;
    const result = selectActiveChannels(state, "img1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ch1");
  });

  it("selectActiveChannels returns empty array for unknown image", () => {
    expect(selectActiveChannels(makeState(), "nonexistent")).toEqual([]);
  });
});

describe("selectRepresentativeImages", () => {
  it("returns all images for a non-time-series series", () => {
    let dataV2 = dataSliceV2.reducer(undefined, { type: "" });
    const series = makeSeries("s1"); // timeSeries: false
    const img1 = makeImage("img1", "s1");
    const img2 = makeImage("img2", "s1");
    dataV2 = dataSliceV2.reducer(
      dataV2,
      dataSliceV2.actions.addImageSeries({
        imageSeries: [series],
        images: [img1, img2],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    const state = { dataV2 } as unknown as RootState;
    expect(selectRepresentativeImages(state)).toHaveLength(2);
  });

  it("returns only timepoint=0 image for a time-series", () => {
    let dataV2 = dataSliceV2.reducer(undefined, { type: "" });
    const series: ImageSeries = {
      ...makeSeries("ts1"),
      timeSeries: true,
      activeImageId: "ti0",
    };
    const ti0: ImageObject = { ...makeImage("ti0", "ts1"), timepoint: 0 };
    const ti1: ImageObject = { ...makeImage("ti1", "ts1"), timepoint: 1 };
    dataV2 = dataSliceV2.reducer(
      dataV2,
      dataSliceV2.actions.addImageSeries({
        imageSeries: [series],
        images: [ti0, ti1],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    const state = { dataV2 } as unknown as RootState;
    const result = selectRepresentativeImages(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ti0");
  });

  it("mixes regular and time-series images correctly", () => {
    let dataV2 = dataSliceV2.reducer(undefined, { type: "" });
    const regular: ImageSeries = { ...makeSeries("s1"), timeSeries: false };
    const ts: ImageSeries = {
      ...makeSeries("ts1"),
      timeSeries: true,
      activeImageId: "ti0",
    };
    const img1 = makeImage("img1", "s1");
    const ti0: ImageObject = { ...makeImage("ti0", "ts1"), timepoint: 0 };
    const ti1: ImageObject = { ...makeImage("ti1", "ts1"), timepoint: 1 };
    dataV2 = dataSliceV2.reducer(
      dataV2,
      dataSliceV2.actions.addImageSeries({
        imageSeries: [regular, ts],
        images: [img1, ti0, ti1],
        planes: [],
        channels: [],
        channelMetas: [],
      }),
    );
    const state = { dataV2 } as unknown as RootState;
    // 1 regular + 1 representative from time-series
    expect(selectRepresentativeImages(state)).toHaveLength(2);
  });
});
