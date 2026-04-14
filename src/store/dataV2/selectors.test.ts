import { describe, expect, it } from "vitest";
import { dataSliceV2 } from "./dataSliceV2";
import type { RootState } from "store/rootReducer";
import type { ImageSeries, ImageObject } from "./types";
import {
  selectAllImageSeries, selectImageSeriesById,
  selectAllImages, selectImageById,
  selectAllPlanes, selectPlaneById,
  selectAllChannels, selectChannelById,
  selectAllChannelMetas, selectChannelMetaById,
  selectAllKinds, selectKindById,
  selectAllCategories, selectCategoryById,
  selectAllAnnotationVolumes, selectAnnotationVolumeById,
  selectAllAnnotations, selectAnnotationById,
} from "./selectors";
import { Partition } from "utils/models/enums";

function makeState(): RootState {
  const datav2 = dataSliceV2.reducer(undefined, { type: "" });
  return { datav2 } as unknown as RootState;
}

function makeSeries(id: string): ImageSeries {
  return { id, experimentId: "e1", name: "S1", bitDepth: 8,
    shape: { planes: 1, height: 10, width: 10, channels: 1 },
    timeSeries: false, activeImageId: `${id}-img` };
}

function makeImage(id: string, seriesId: string, categoryId = "cat-img-unknown"): ImageObject {
  return { id, name: id, seriesId,
    shape: { planes: 1, height: 10, width: 10, channels: 1 },
    categoryId, activePlaneId: `${id}-plane`, timepoint: 0,
    bitDepth: 8, partition: Partition.Unassigned };
}

describe("Tier 1 selectors", () => {
  it("selectAllImageSeries returns empty array on initial state", () => {
    expect(selectAllImageSeries(makeState())).toEqual([]);
  });

  it("selectImageSeriesById returns correct series", () => {
    const series = makeSeries("s1");
    let datav2 = dataSliceV2.reducer(undefined, { type: "" });
    datav2 = dataSliceV2.reducer(datav2, dataSliceV2.actions.addImageSeries({
      imageSeries: [series], images: [], planes: [], channels: [], channelMetas: []
    }));
    const state = { datav2 } as unknown as RootState;
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
