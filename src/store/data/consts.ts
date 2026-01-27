import {
  ChannelData,
  ChannelMeasurements,
  ImageMeasurements,
  ObjectMeasurements,
} from "./types";

export const CHANNEL_STATISTICS_KEYS: (keyof ChannelData)[] = [
  "channelId",
  "channelData",
  "total",
  "min",
  "max",
  "mean",
  "median",
  "std",
  "mad",
  "lowerQuartile",
  "upperQuartile",
  "histogram",
];
export const CHANNEL_MEASUREMENT_KEYS: (keyof ChannelMeasurements)[] = [
  "total",
  "min",
  "max",
  "mean",
  "median",
  "std",
  "mad",
  "lowerQuartile",
  "upperQuartile",
];

export const channelStatisticKeyToDisplay = {
  total: "Total",
  min: "Min",
  max: "Max",
  mean: "Mean",
  median: "Median",
  std: "STD",
  mad: "MAD",
  lowerQuartile: "Lower Quartile",
  upperQuartile: "Upper Quartile",
};

export const IMAGE_MEASUREMENT_KEYS: (keyof ImageMeasurements)[] = [
  "channels",
  "entropy",
  "contrast",
  "snr",
];

export const OBJECT_MEASUREMENT_KEYS: (keyof ObjectMeasurements)[] = [
  "area",
  "bboxArea",
  "com",
  "compactness",
  "eqpc",
  "extent",
  "channels",
  "ped",
  "perimeter",
];

export const OBJ_MEAS_LOOKUP = {
  area: "Area",
  bboxArea: "Bounding Box Area",
  com: "Center of Mass",
  compactness: "Compactness",
  eqpc: "Diameter of a circle of equal projection area ",
  extent: "Extent",
  channels: "Channels",
  ped: "Diameter of a circle of equal perimeter",
  perimeter: "Perimeter",
};

export const INTENSE_MEAS_LOOKUP = {
  total: "Sum of pixel intensities",
  min: "Minimum intensity",
  max: "Maximum intensity",
  mean: "Mean intensity",
  median: "Median intensity",
  std: "Standard deviation",
  mad: "Median Absolute Deviation",
  lowerQuartile: "Pixel which 25% of values are lower",
  upperQuartile: "Pixel which 25% of values are higher",
};
