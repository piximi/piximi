import { DataArray } from "image-js";
import { Tensor2D, Tensor4D } from "@tensorflow/tfjs";

import { getObjectMaskData, prepareChannels } from "utils/measurements/utils";
import { decode } from "views/ImageViewer/utils";

import {
  MeasurementDisplayTable,
  MeasurementOptions,
} from "store/measurements/types";
import { RecursivePartial } from "utils/types";
import { ChartValues } from "./types";

/**
 * Formats a value for display, converting numbers to fixed decimal places.
 * @param value - The value to format (number or string)
 * @param sf - Number of significant figures/decimal places (default: 2)
 * @returns Formatted string representation of the value
 */
export const format = (value: string | number, sf: number = 2) => {
  if (typeof value === "number") {
    return value.toFixed(sf);
  } else {
    return value;
  }
};

/**
 * Transforms measurement display tables into a format suitable for chart visualization.
 * Extracts measurement types and creates chart-ready data structure.
 * @param measurementTables - Record of measurement tables keyed by ID
 * @returns Object containing chart values keyed by measurement type
 */
export const formatChartItems = (
  measurementTables: Record<string, MeasurementDisplayTable>,
): ChartValues => {
  const items: ChartValues = {};
  const measurementData = Object.values(measurementTables);
  if (measurementData.length === 0) {
    return items;
  }

  measurementData.forEach((data) => {
    const measurementType = data.measurementId;

    items[measurementType] = {
      measurementType,
    };
  });

  return items;
};

/**
 * Generates histogram data from raw numerical values by binning them into equal-sized intervals.
 * @param rawData - Array of numerical values to create histogram from
 * @param numBins - Number of bins to divide the data range into
 * @returns Object containing bin counts, x-axis labels, bin size, and minimum value, or undefined if no data
 */
export const getHistogramData = (
  rawData: number[],
  numBins: number,
):
  | { data: number[]; xAxis: number[]; binSize: number; min: number }
  | undefined => {
  if (rawData.length === 0) return;
  let min = Infinity;
  let max = -Infinity;

  // Find min and max values in the dataset
  for (const item of rawData) {
    if (item < min) min = item;
    if (item > max) max = item;
  }

  const valueRange = max - min > 0 ? max - min : min;
  const binSize = valueRange / numBins + 1;
  const data = new Array(numBins).fill(0);

  // Count values in each bin
  for (const item of rawData) {
    const binIndex = Math.floor((item - min) / binSize);
    data[binIndex]++;
  }

  // Generate x-axis labels for histogram bins
  let i = 0;
  const xAxis: number[] = [];
  while (i < numBins + 1) {
    xAxis.push(+format(i * binSize));
    i++;
  }

  return { data, xAxis, binSize, min };
};

/**
 * Recursively updates the selection state of a tree item and all of its descendants.
 * Used for measurement option trees where selecting/deselecting a parent should
 * affect all child options.
 * @param updates - Object to accumulate the changes to be applied
 * @param itemId - ID of the tree item to update
 * @param items - Complete measurement options tree
 * @param selectionState - Whether to turn selection "on" or "off"
 */
export const selectTreeItemChildren = (
  updates: RecursivePartial<MeasurementOptions>,
  itemId: string,
  items: MeasurementOptions,
  selectionState: "on" | "off",
) => {
  const dataItem = items[itemId];
  if (dataItem) {
    // Update this item's state
    updates[dataItem.id as keyof MeasurementOptions] = {
      state: selectionState,
      children: dataItem.children,
    };
    if (dataItem.children) {
      // Recursively update all children with the same selection state
      dataItem.children.forEach((child) => {
        selectTreeItemChildren(updates, child, items, selectionState);
      });
    }
  }
};

/**
 * Prepares image/object data for measurements by extracting channel data and applying masks.
 * Handles three cases:
 * 1. Pre-decoded mask - applies mask to extract only relevant pixels
 * 2. Encoded mask - decodes then applies mask
 * 3. No mask - uses all pixel data
 * @param thingData - Object containing tensor data and optional mask (encoded or decoded)
 * @returns Object with channel arrays, mask data, and mask dimensions for measurements
 */
export const prepareThingData = async (thingData: {
  data: Tensor4D;
  encodedMask?: number[];
  decodedMask?: DataArray;
}) => {
  let channelData: Tensor2D;
  let maskData: DataArray | undefined = undefined;
  let maskShape: { width: number; height: number } | undefined;
  let prep_t0 = 0;
  let prep_tf = 0;
  let mask_t0 = 0;
  let mask_tf = 0;
  let dec_t0 = 0;
  let dec_tf = 0;
  if (thingData.decodedMask) {
    // Use pre-decoded mask to filter pixels
    prep_t0 = performance.now();
    const fullChannelData = prepareChannels(thingData.data);
    prep_tf = performance.now();
    mask_t0 = performance.now();
    channelData = await getObjectMaskData(
      fullChannelData,
      thingData.decodedMask,
    );
    mask_tf = performance.now();
    fullChannelData.dispose();
    maskData = thingData.decodedMask;
    maskShape = {
      height: thingData.data.shape[1],
      width: thingData.data.shape[2],
    };
  } else if (thingData.encodedMask) {
    // Decode mask first, then filter pixels
    dec_t0 = performance.now();
    const decodedMask = Uint8Array.from(decode(thingData.encodedMask));
    dec_tf = performance.now();
    prep_t0 = performance.now();
    const fullChannelData = prepareChannels(thingData.data);
    prep_tf = performance.now();
    mask_t0 = performance.now();
    channelData = await getObjectMaskData(fullChannelData, decodedMask);
    mask_tf = performance.now();
    fullChannelData.dispose();
    maskData = decodedMask;
    maskShape = {
      height: thingData.data.shape[1],
      width: thingData.data.shape[2],
    };
  } else {
    // No mask - use all pixels
    prep_t0 = performance.now();
    channelData = prepareChannels(thingData.data);
    prep_tf = performance.now();
  }
  const thingInfo = {
    channels: channelData.arraySync(),
    maskData,
    maskShape,
  };
  channelData.dispose();

  return {
    thingInfo,
    perf: {
      prep: prep_tf - prep_t0,
      mask: mask_tf - mask_t0,
      dec: dec_tf - dec_t0,
    },
  };
};
