import { DataArray } from "utils/file-io/types";

import { BitDepth } from "utils/file-io/types";

/**
 * Generates a random integer between two values.
 * @param min - The minimum possible returned value (inclusive)
 * @param max - The maximum number (exclusive)
 * @returns The largest integer less than or equal to the given maximum value.
 */
export const getRandomInt = (min: number, max: number) => {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
};

export const scaleUpRange = (
  range: [number, number],
  bitDepth: BitDepth,
): [number, number] => {
  return [
    Math.floor(range[0] * (2 ** bitDepth - 1)),
    Math.floor(range[1] * (2 ** bitDepth - 1)),
  ];
};

export const scaleUpRanges = (
  ranges: { [channel: number]: [number, number] },
  bitDepth: BitDepth,
  opts: { inPlace: boolean } = { inPlace: false },
): { [channel: number]: [number, number] } => {
  const operandRanges = opts.inPlace ? ranges : { ...ranges };

  for (const ch of Object.keys(ranges)) {
    const chKey = parseInt(ch);
    operandRanges[chKey] = scaleUpRange(ranges[chKey], bitDepth);
  }

  return ranges;
};

export const scaleDownRange = (
  range: [number, number],
  bitDepth: BitDepth,
): [number, number] => {
  return [range[0] / (2 ** bitDepth - 1), range[1] / (2 ** bitDepth - 1)];
};

export const scaleDownRanges = (
  ranges: { [channel: number]: [number, number] },
  bitDepth: BitDepth,
  opts: { inPlace: boolean } = { inPlace: false },
): { [channel: number]: [number, number] } => {
  const operandRanges = opts.inPlace ? ranges : { ...ranges };

  for (const ch of Object.keys(ranges)) {
    const chKey = parseInt(ch);
    operandRanges[chKey] = scaleDownRange(ranges[chKey], bitDepth);
  }

  return ranges;
};

export const extractMinMax = (ranges: {
  [channel: number]: [number, number];
}) => {
  const channels = Object.keys(ranges).map((ch) => parseInt(ch));
  const mins = Array(channels.length);
  const maxs = Array(channels.length);

  for (const ch of channels) {
    const [min, max] = ranges[ch];
    mins[ch] = min;
    maxs[ch] = max;
  }

  return { mins, maxs };
};

export const convertToDataArray = (
  depth: number,
  source: DataArray | Array<number>,
): DataArray => {
  switch (depth) {
    case 1:
      throw Error("Binary bit depth not (yet) supported");
    case 8:
      return Uint8Array.from(source);
    case 16:
      return Uint16Array.from(source);
    case 32:
      return Float32Array.from(source);
    default:
      throw Error("Unrecognized bit depth");
  }
};
