import { decodeStack, Stack as IJSStack } from "image-js-latest";

import { generateUUID, UNKNOWN_IMAGE_CATEGORY_ID } from "core/entities";
import { Partition } from "core/dl/enums";

import { CHANNEL_COLOR_MAPS, DEFAULT_COLORS } from "utils/colorUtils";
import { processChannel } from "utils/channelUtils";

import type { Image as IJSImage } from "image-js-latest";

import type { BitDepth, ChannelMeta, Plane } from "core/entities";

import type {
  ChannelResult,
  ImageResult,
  ImageSeriesResult,
  ReadStage,
  DimensionConfig,
  DimensionOrder,
} from "./types";

// ============================================================
// Image Loading
// ============================================================
const toSingleChannelPlanes = (image: IJSImage): IJSImage[] => {
  if (image.channels === 1) return [image];
  const planes = image.split();
  // split() yields one plane per channel *including* alpha — drop the alpha plane(s).
  return image.alpha ? planes.slice(0, image.components) : planes;
};

const forceStack = (image: IJSImage | IJSStack): IJSStack => {
  const images = image instanceof IJSStack ? image.getImages() : [image];
  return new IJSStack(images.flatMap(toSingleChannelPlanes));
};

/**
 * Load image from ArrayBuffer
 * Returns an image-js Stack (even for single images)
 */
export async function loadImageFromBuffer(
  buffer: ArrayBuffer,
): Promise<IJSStack> {
  const dataArray = new Uint8Array(buffer);

  const image = decodeStack(dataArray);

  return forceStack(image);
}

/*
 * Where frame (c, z, t) sits in a flat stack whose dimensions after x and y
 * vary in `order`, the first listed fastest: the OME convention, so `xyczt`
 * stores every channel of a plane together and the planes of a timepoint
 * together (also how ImageJ writes hyperstacks). The engine's
 * `frame_index` agrees, pinned by the shared `dims.json` vectors.
 */
export const frameIndex = (
  order: DimensionOrder,
  c: number,
  z: number,
  t: number,
  sizes: { channels: number; slices: number; frames: number },
): number => {
  const size = { c: sizes.channels, z: sizes.slices, t: sizes.frames };
  const coord = { c, z, t };
  let index = 0;
  let stride = 1;
  for (const axis of order.slice(2).split("") as Array<"c" | "z" | "t">) {
    index += coord[axis] * stride;
    stride *= size[axis];
  }
  return index;
};

export const applyDimensionsToStack = (
  imageStack: IJSStack,
  dimensonSpec: DimensionConfig,
): Map<number, Map<number, Map<number, IJSImage>>> => {
  const { dimensionOrder, channels, slices, frames } = dimensonSpec;
  const expected = channels * slices * frames;
  if (imageStack.size !== expected) {
    throw new Error(
      `${channels} channels x ${slices} slices x ${frames} frames needs ${expected} frames; the file has ${imageStack.size}`,
    );
  }

  const imageMap: Map<number, Map<number, Map<number, IJSImage>>> = new Map();
  for (let t = 0; t < frames; t++) {
    const planes = new Map<number, Map<number, IJSImage>>();
    for (let z = 0; z < slices; z++) {
      const channelMap = new Map<number, IJSImage>();
      for (let c = 0; c < channels; c++) {
        const index = frameIndex(dimensionOrder, c, z, t, dimensonSpec);
        channelMap.set(c, imageStack.getImage(index));
      }
      planes.set(z, channelMap);
    }
    imageMap.set(t, planes);
  }
  return imageMap;
};

export const experimentFromStack = (
  imageSeriesMap: Map<number, Map<number, Map<number, IJSImage>>>,
  config: {
    fileName: string;
    shape: {
      width: number;
      height: number;
      channels: number;
      planes: number;
    };

    bitDepth: BitDepth;
  },
  onProgress?: ({ value, stage }: { value: number; stage: ReadStage }) => void,
) => {
  const imageSeries: ImageSeriesResult[] = [];
  const images: ImageResult[] = [];
  const planes: Plane[] = [];
  const channels: ChannelResult[] = [];
  const channelMetas: ChannelMeta[] = [];

  const bitDepth = config.bitDepth;
  const name = parseFilename(config.fileName);
  const series: ImageSeriesResult = {
    id: generateUUID(),
    name: `${name}-series`,
    bitDepth: config.bitDepth,
    shape: config.shape,
    timeSeries: imageSeriesMap.size > 1,
    activeImageId: "",
  };
  const channelMeta: ChannelMeta[] = Array.from(
    { length: config.shape.channels },
    (_v, idx) => ({
      id: generateUUID(),
      name: `Channel-${idx}`,
      bitDepth,
      colorMap:
        config.shape.channels === 1
          ? CHANNEL_COLOR_MAPS.WHITE
          : DEFAULT_COLORS[idx % 6],
      minValue: 2 ** bitDepth - 1,
      maxValue: 0,
      rampMinLimit: 2 ** bitDepth - 1,
      rampMaxLimit: 0,
      rampMin: 2 ** bitDepth - 1,
      rampMax: 0,
      visible: true,
    }),
  );
  channelMetas.push(...channelMeta);
  const initImagePlane = Math.floor(config.shape.planes / 2);
  let planeNum = 0;
  const totalPlanes = imageSeriesMap.size * config.shape.planes;
  imageSeriesMap.forEach((imageMap, imageIDX) => {
    const image: ImageResult = {
      id: generateUUID(),
      name: series.timeSeries ? `${name}-t${imageIDX}` : name,
      seriesId: series.id,
      shape: config.shape,
      categoryId: UNKNOWN_IMAGE_CATEGORY_ID,
      activePlaneId: "",
      partition: Partition.Unassigned,
      timepoint: series.timeSeries ? imageIDX : 0,
      bitDepth,
    };

    if (imageIDX === 0) series.activeImageId = image.id;

    imageMap.forEach((planeMap, planeIDX) => {
      onProgress &&
        onProgress({ stage: "toExperiment", value: planeNum / totalPlanes });
      const plane: Plane = {
        id: generateUUID(),
        imageId: image.id,
        zIndex: planeIDX,
      };
      if (planeIDX === initImagePlane) image.activePlaneId = plane.id;
      planeNum++;
      planeMap.forEach((channel, channelIDX) => {
        const {
          data,
          histogram,
          minValue,
          rampMin,
          maxValue,
          rampMax,
          total,
          mad,
          mean,
          median,
          std,
          upperQuartile,
          lowerQuartile,
        } = processChannel(channel);
        const meta = channelMeta[channelIDX];
        if (minValue < meta.minValue) {
          meta.minValue = minValue;
          meta.rampMinLimit = minValue;
        }
        if (maxValue > meta.maxValue) {
          meta.maxValue = maxValue;
          meta.rampMaxLimit = maxValue;
        }
        if (planeIDX === initImagePlane) {
          meta.rampMin = rampMin;
          meta.rampMax = rampMax;
        }

        const channelResult: ChannelResult = {
          id: generateUUID(),
          name: `Channel-${channelIDX}`,
          channelMetaId: meta.id,
          dtype: "float32",
          planeId: plane.id,
          histogram,
          data,
          width: channel.width,
          height: channel.height,
          bitDepth,
          maxValue,
          minValue,
          total,
          mean,
          median,
          mad,
          std,
          upperQuartile,
          lowerQuartile,
        };
        channels.push(channelResult);
      });
      planes.push(plane);
    });
    images.push(image);
  });
  imageSeries.push(series);

  return { imageSeries, images, planes, channels, channelMetas };
};

const parseFilename = (filename: string): string => {
  const splitName = filename.split(".");
  if (splitName.length === 1) return splitName[0];
  splitName.pop();
  return splitName.join(".");
};
