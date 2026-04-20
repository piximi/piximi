import { EntityState } from "@reduxjs/toolkit";
import {
  V11Category,
  V11Kind,
  V11PiximiState,
  V11RawAnnotationObject,
  V11RawImageObject,
} from "../version-readers/version-types/v11Types";
import {
  V2AnnotationObject,
  V2AnnotationVolume,
  V2Category,
  V2Channel,
  V2ChannelMeta,
  V2DataState,
  V2Experiment,
  V2ImageObject,
  V2ImageSeries,
  V2Kind,
  V2PiximiState,
  V2Plane,
} from "../version-readers/version-types/v2Types";
import { generateUUID, isUnknownCategory } from "store/data/utils";
import { Image as IJSImage } from "image-js-latest";
import { processChannel } from "utils/channelUtils";
import { CHANNEL_COLOR_MAPS, DEFAULT_COLORS } from "utils/colorUtils";
import { BitDepth } from "store/data/types";
import { subProgress } from "../progress";

const STAGES = {
  kinds: { start: 0, end: 0.1 },
  categories: { start: 0.1, end: 0.2 },
  things: { start: 0.2, end: 1 },
} as const;

/**
 * Convert v1.1 project data to v2 format.
 *
 * Key transformations:
 * - Data section (things, categories, kinds) gets split up into ImageSeries, Images, Channels, etc.
 *
 */
export function convertV11ToV2(
  v11: V11PiximiState,
  onProgress: (p: number) => void,
): V2PiximiState {
  const experiment: V2Experiment = {
    id: generateUUID(),
    name: v11.project.name,
  };
  const { things, kinds, categories } = v11.data;
  const v2Kinds = convertKinds(Object.values(kinds.entities));
  onProgress(STAGES.kinds.end);
  const v2Categories = convertCategories(
    kinds.entities,
    Object.values(categories.entities),
  );
  onProgress(STAGES.categories.end);
  const v2Data = convertThings(
    experiment.id,
    kinds.entities,
    Object.values(things.entities),
    subProgress(onProgress, STAGES.things),
  );
  return {
    project: v11.project,
    data: { experiment, ...v2Data, kinds: v2Kinds, categories: v2Categories },
    segmenter: v11.segmenter,
    classifier: v11.classifier,
  };
}

function convertKinds(v11Kinds: V11Kind[]): EntityState<V2Kind, string> {
  const v2Kinds: EntityState<V2Kind, string> = { ids: [], entities: {} };
  v11Kinds.forEach((v11Kind) => {
    if (v11Kind.displayName !== "Image") {
      v2Kinds.ids.push(v11Kind.id);
      v2Kinds.entities[v11Kind.id] = {
        id: v11Kind.id,
        name: v11Kind.displayName,
        unknownCategoryId: v11Kind.unknownCategoryId,
      };
    }
  });
  return v2Kinds;
}

function convertCategories(
  v11Kinds: Record<string, V11Kind>,
  v11Categories: V11Category[],
): EntityState<V2Category, string> {
  const v2Categories: EntityState<V2Category, string> = {
    ids: [],
    entities: {},
  };
  v11Categories.forEach((v11Cat) => {
    v2Categories.ids.push(v11Cat.id);
    const scope =
      v11Kinds[v11Cat.kind].displayName === "Image"
        ? { type: "image" as const }
        : { type: "annotation" as const, kindId: v11Cat.kind };
    v2Categories.entities[v11Cat.id] = {
      id: v11Cat.id,
      name: v11Cat.name,
      color: v11Cat.color,
      isUnknown: isUnknownCategory(v11Cat.id),
      ...scope,
    };
  });
  return v2Categories;
}

function convertThings(
  experimentId: string,
  v11Kinds: Record<string, V11Kind>,
  things: Array<V11RawImageObject | V11RawAnnotationObject>,
  onProgress: (p: number) => void,
): Omit<V2DataState, "kinds" | "categories" | "experiment"> {
  const v2ImageSeries: EntityState<V2ImageSeries, string> = {
    ids: [],
    entities: {},
  };
  const v2Images: EntityState<V2ImageObject, string> = {
    ids: [],
    entities: {},
  };
  const v2ChannelMetas: EntityState<V2ChannelMeta, string> = {
    ids: [],
    entities: {},
  };
  const v2Planes: EntityState<V2Plane, string> = {
    ids: [],
    entities: {},
  };
  const v2Channels: EntityState<V2Channel, string> = {
    ids: [],
    entities: {},
  };
  const v2AnnotationVolumes: EntityState<V2AnnotationVolume, string> = {
    ids: [],
    entities: {},
  };
  const v2Annotations: EntityState<V2AnnotationObject, string> = {
    ids: [],
    entities: {},
  };

  const addToState = <T extends { id: string }>(
    state: EntityState<T, string>,
    entity: T,
  ) => {
    state.ids.push(entity.id);
    state.entities[entity.id] = entity;
  };

  const v11Images: V11RawImageObject[] = [];
  const v11Annotations: V11RawAnnotationObject[] = [];
  things.forEach((thing) => {
    if (v11Kinds[thing.kind].displayName === "Image")
      v11Images.push(thing as V11RawImageObject);
    else v11Annotations.push(thing as V11RawAnnotationObject);
  });

  const planeIdx2planeId: Record<string, Record<number, string>> = {};
  let imageIdx = 0;
  for (const image of v11Images) {
    const bitDepth = image.bitDepth;
    const { buffer, shape, dtype } = image.tensorData;
    const [planes, height, width, channels] = shape;
    const v2Series: V2ImageSeries = {
      id: generateUUID(),
      experimentId,
      name: image.name,
      bitDepth,
      shape: { planes, width, height, channels },
      timeSeries: false,
      activeImageId: image.id,
    };
    addToState(v2ImageSeries, v2Series);
    const v2Image: V2ImageObject = {
      id: image.id,
      name: image.name,
      seriesId: v2Series.id,
      shape: { planes, width, height, channels },
      categoryId: image.categoryId,
      activePlaneId: "",
      timepoint: 0,
      bitDepth,
      partition: image.partition,
    };
    planeIdx2planeId[v2Image.id] = {};
    addToState(v2Images, v2Image);

    const localMetaIds: string[] = [];
    Array.from({ length: channels }).forEach((_, idx) => {
      const meta = createV2ChannelMeta(idx, channels, bitDepth, v2Series.id);
      localMetaIds.push(meta.id);
      addToState(v2ChannelMetas, meta);
    });

    const channelData = parseChannelData(
      buffer,
      { planes, width, height, channels },
      dtype,
    );
    let planeIdx = 0;
    const activePlaneIdx = Math.floor(planes / 2);
    for (const plane of Object.values(channelData)) {
      const v2Plane: V2Plane = {
        id: generateUUID(),
        imageId: v2Image.id,
        zIndex: planeIdx,
      };
      planeIdx2planeId[v2Image.id][planeIdx] = v2Plane.id;
      addToState(v2Planes, v2Plane);
      if (planeIdx === activePlaneIdx)
        v2Images.entities[v2Image.id].activePlaneId = v2Plane.id;

      let channelIdx = 0;
      for (const channel of plane) {
        const channelJs = toImageJsData(channel, dtype, bitDepth);

        const channelImage = new IJSImage(width, height, {
          colorModel: "GREY",
          data: channelJs,
        });

        const channelStats = processChannel(channelImage);
        const meta = v2ChannelMetas.entities[localMetaIds[channelIdx]];
        updateV2ChannelMetaStats(
          meta,
          {
            rampMin: channelStats.rampMin,
            rampMax: channelStats.rampMax,
            minValue: channelStats.minValue,
            maxValue: channelStats.maxValue,
          },
          planeIdx === activePlaneIdx,
        );

        const v2Channel = createV2Channel(
          channelIdx,
          meta.id,
          v2Plane.id,
          dtype,
          width,
          height,
          bitDepth,
          channelStats,
        );
        addToState(v2Channels, v2Channel);
        channelIdx++;
      }
      planeIdx++;
    }
    onProgress((0.4 * imageIdx) / v11Images.length);
    imageIdx++;
  }
  let annIdx = 0;
  for (const ann of v11Annotations) {
    const imageId = ann.imageId;
    const planeId = planeIdx2planeId[imageId][ann.plane];
    const volumeId = generateUUID();

    addToState(v2AnnotationVolumes, {
      id: volumeId,
      imageId,
      kindId: ann.kind,
      categoryId: ann.categoryId,
    });
    addToState(v2Annotations, {
      id: ann.id,
      imageId,
      planeId,
      volumeId,
      partition: ann.partition,
      shape: ann.shape,
      boundingBox: ann.boundingBox,
      encodedMask: ann.encodedMask,
    });
    onProgress(0.4 + (0.2 * annIdx) / v11Annotations.length);
    annIdx++;
  }
  return {
    imageSeries: v2ImageSeries,
    images: v2Images,
    channelMetas: v2ChannelMetas,
    planes: v2Planes,
    channels: v2Channels,
    annotations: v2Annotations,
    annotationVolumes: v2AnnotationVolumes,
  };
}

function toImageJsData(
  data: Float32Array | Int32Array | Uint8Array,
  dtype: "float32" | "int32" | "uint8",
  bitDepth: BitDepth,
): Uint8Array | Uint16Array {
  switch (dtype) {
    case "uint8":
      return data as Uint8Array; // already compatible, no copy needed

    case "float32":
      if (bitDepth === 8) {
        return Uint8Array.from(data, (v) => Math.round(v * 255));
      } else if (bitDepth === 16) {
        return Uint16Array.from(data, (v) => Math.round(v * 65535));
      } else {
        throw new Error(`Unsupported bitDepth: ${bitDepth}`);
      }
    case "int32":
      throw new Error('Did not expect "int32" dtype ¯\\_(ツ)_/¯');
  }
}

function parseChannelData(
  buffer: ArrayBuffer,
  shape: { channels: number; width: number; height: number; planes: number },
  dtype: "float32" | "int32" | "uint8",
) {
  const { channels, width, height, planes } = shape;
  const ctor =
    dtype === "float32"
      ? Float32Array
      : dtype === "int32"
        ? Int32Array
        : Uint8Array;
  const data = new ctor(buffer);

  const channelData: Record<number, Array<typeof data>> = {};
  for (let p = 0; p < planes; p++) {
    channelData[p] = Array.from(
      { length: channels },
      (_) => new ctor(width * height),
    );
    const planeOffset = p * height * width * channels;
    for (let h = 0; h < height; h++) {
      const rowOffset = planeOffset + h * width * channels;
      for (let w = 0; w < width; w++) {
        const pixelOffset = rowOffset + w * channels;
        for (let c = 0; c < channels; c++) {
          channelData[p][c][h * width + w] = data[pixelOffset + c];
        }
      }
    }
  }
  return channelData;
}

function createV2ChannelMeta(
  idx: number,
  totalChannels: number,
  bitDepth: BitDepth,
  seriesId: string,
): V2ChannelMeta {
  return {
    id: generateUUID(),
    name: `Channel-${idx}`,
    bitDepth,
    seriesId,
    colorMap:
      totalChannels === 1 ? CHANNEL_COLOR_MAPS.WHITE : DEFAULT_COLORS[idx % 6],
    minValue: 2 ** bitDepth - 1,
    maxValue: 0,
    rampMinLimit: 2 ** bitDepth - 1,
    rampMaxLimit: 0,
    rampMin: 2 ** bitDepth - 1,
    rampMax: 0,
    visible: true,
  };
}

function createV2Channel(
  idx: number,
  metaId: string,
  planeId: string,
  dtype: "float32" | "int32" | "uint8",
  width: number,
  height: number,
  bitDepth: BitDepth,
  channelStats: {
    data: ArrayBuffer;
    histogram: ArrayBuffer;
    rampMin: number;
    rampMax: number;
    minValue: number;
    maxValue: number;
    std: number;
    mad: number;
    total: number;
    mean: number;
    median: number;
    upperQuartile: number;
    lowerQuartile: number;
  },
): V2Channel {
  return {
    id: generateUUID(),
    name: `Channel-${idx}`,
    channelMetaId: metaId,
    dtype,
    planeId,
    histogram: channelStats.histogram,
    data: channelStats.data,
    width: width,
    height: height,
    bitDepth,
    maxValue: channelStats.maxValue,
    minValue: channelStats.minValue,
    total: channelStats.total,
    mean: channelStats.mean,
    median: channelStats.median,
    mad: channelStats.mad,
    std: channelStats.std,
    upperQuartile: channelStats.upperQuartile,
    lowerQuartile: channelStats.lowerQuartile,
  };
}

function updateV2ChannelMetaStats(
  meta: V2ChannelMeta,
  stats: Pick<
    ReturnType<typeof processChannel>,
    "minValue" | "maxValue" | "rampMin" | "rampMax"
  >,
  isActivePlane: boolean,
): void {
  if (stats.minValue < meta.minValue) {
    meta.minValue = stats.minValue;
    meta.rampMinLimit = stats.minValue;
  }
  if (stats.maxValue > meta.maxValue) {
    meta.maxValue = stats.maxValue;
    meta.rampMaxLimit = stats.maxValue;
  }
  if (isActivePlane) {
    meta.rampMin = stats.rampMin;
    meta.rampMax = stats.rampMax;
  }
}
