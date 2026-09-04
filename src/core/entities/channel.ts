import type { BitDepth, ColorMap, DType } from "./primatives";
import type { StorageReference } from "./storage";

export const CHANNEL_MEASUREMENTS = [
  "maxValue",
  "minValue",
  "total",
  "mean",
  "median",
  "std",
  "mad",
  "lowerQuartile",
  "upperQuartile",
] as const;
export const CHANNEL_FEATURES = ["entropy", "contrast", "snr"];
export type ChannelMeasurement = (typeof CHANNEL_MEASUREMENTS)[number];
export type ChannelFeature = (typeof CHANNEL_FEATURES)[number];
export type Channel = {
  id: string;
  planeId: string;
  channelMetaId: string;
  name: string;
  dtype: DType;
  storageReference: StorageReference;
  bitDepth: BitDepth;
  width: number;
  height: number;
  maxValue: number;
  minValue: number;
  total?: number;
  mean?: number;
  median?: number;
  std?: number;
  mad?: number;
  lowerQuartile?: number;
  upperQuartile?: number;
  features?: Partial<Record<ChannelFeature, number>>;
};

export type ChannelMeta = {
  id: string;
  name: string;
  bitDepth: BitDepth;
  colorMap: ColorMap;
  visible: boolean;
  minValue: number;
  maxValue: number;
  rampMin: number;
  rampMax: number;
  rampMinLimit: number;
  rampMaxLimit: number;
};
export type ChannelMetaEntities = Record<string, ChannelMeta>;

export type ExtendedChannel = Channel & {
  name: string;
  colorMap: ColorMap;
  rampMin: number;
  rampMax: number;
  visible: boolean;
};
