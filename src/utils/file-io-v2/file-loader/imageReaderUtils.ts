import {
  decodeStack,
  Stack as IJSStack,
  Image as IJSImage,
} from "image-js-latest";
import {
  DimensionConfig,
  type ChannelResult,
  type ImageResult,
  type ImageSeriesResult,
  type ReadStage,
} from "./types";
import { BitDepth } from "store/dataV2/types";
import { ChannelMeta, Plane } from "store/dataV2/types";
import { CHANNEL_COLOR_MAPS, DEFAULT_COLORS } from "utils/colorUtils";
import { Partition } from "utils/models/enums";
import { generateUUID } from "store/data/utils";
import { processChannel } from "utils/channelUtils";
import { UNKNOWN_IMAGE_CATEGORY_ID } from "store/data/constants";

// ============================================================
// Image Loading
// ============================================================
const forceStack = (image: IJSImage | IJSStack): IJSStack => {
  if (image instanceof IJSStack) {
    return image;
  }
  const splitImage = image.split();
  if (image.alpha) {
    return new IJSStack(splitImage.slice(0, splitImage.length - 1));
  }
  return new IJSStack(splitImage);
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

export const applyDimensionsToStack = (
  imageStack: IJSStack,
  dimensonSpec: DimensionConfig,
): Map<number, Map<number, Map<number, IJSImage>>> => {
  const { dimensionOrder, channels, slices, frames } = dimensonSpec;

  const imageMap: Map<number, Map<number, Map<number, IJSImage>>> = new Map();

  const addToStructure = (t: number, z: number, c: number, data: IJSImage) => {
    if (imageMap.has(t)) {
      const planes = imageMap.get(t)!;
      if (planes.has(z)) {
        const channels = planes.get(z)!;
        if (channels.has(c)) {
          throw new Error("duplicate Channel");
        }
        channels.set(c, data);
      } else {
        planes.set(z, new Map([[c, data]]));
      }
    } else {
      imageMap.set(t, new Map([[z, new Map([[c, data]])]]));
    }
  };
  switch (dimensionOrder) {
    case "xyctz":
      for (let c = 0; c < channels; c++) {
        const cOffset = c * frames * slices;
        for (let t = 0; t < frames; t++) {
          const tOffset = t * slices;
          for (let z = 0; z < slices; z++) {
            // create empty array of expected size
            const index = tOffset + cOffset + z;
            const image = imageStack.getImage(index);
            addToStructure(t, z, c, image);
          }
        }
      }
      break;
    case "xyczt":
      for (let c = 0; c < channels; c++) {
        const cOffset = c * frames * slices;
        for (let z = 0; z < slices; z++) {
          const zOffset = z * frames;
          for (let t = 0; t < frames; t++) {
            // create empty array of expected size
            const index = t + cOffset + zOffset;
            const image = imageStack.getImage(index);
            addToStructure(t, z, c, image);
          }
        }
      }
      break;
    case "xytcz":
      for (let t = 0; t < frames; t++) {
        const tOffset = t * slices * channels;
        for (let c = 0; c < channels; c++) {
          const cOffset = c * slices;
          for (let z = 0; z < slices; z++) {
            // create empty array of expected size
            const index = tOffset + cOffset + z;
            const image = imageStack.getImage(index);
            addToStructure(t, z, c, image);
          }
        }
      }
      break;
    case "xytzc":
      for (let t = 0; t < frames; t++) {
        const tOffset = t * slices * channels;
        for (let z = 0; z < slices; z++) {
          const zOffset = z * channels;
          for (let c = 0; c < channels; c++) {
            // create empty array of expected size
            const index = tOffset + zOffset + c;
            const image = imageStack.getImage(index);
            addToStructure(t, z, c, image);
          }
        }
      }
      break;
    case "xyzct":
      for (let z = 0; z < slices; z++) {
        const zOffset = z * frames * channels;
        for (let c = 0; c < channels; c++) {
          const cOffset = c * frames;
          for (let t = 0; t < frames; t++) {
            // create empty array of expected size
            const index = t + zOffset + cOffset;
            const image = imageStack.getImage(index);
            addToStructure(t, z, c, image);
          }
        }
      }
      break;
    case "xyztc":
      for (let z = 0; z < slices; z++) {
        const zOffset = z * frames * channels;
        for (let t = 0; t < frames; t++) {
          const tOffset = t * channels;
          for (let c = 0; c < channels; c++) {
            // create empty array of expected size
            const index = tOffset + zOffset + c;
            const image = imageStack.getImage(index);
            addToStructure(t, z, c, image);
          }
        }
      }
      break;
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
    timeSeries: false,
    activeImageId: "",
  };
  const channelMeta: ChannelMeta[] = Array.from(
    { length: config.shape.channels },
    (_v, idx) => ({
      id: generateUUID(),
      name: `Channel-${idx}`,
      bitDepth,
      seriesId: series.id,
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
      name: `${name}-${imageIDX}`,
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
