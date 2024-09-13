import {
  MeasurementDisplayTable,
  MeasurementOptions,
} from "store/measurements/types";
import { ChartValues } from "./types";
import { RecursivePartial } from "utils/common/types";
import { DataArray } from "image-js";
import { getObjectMaskData, prepareChannels } from "utils/measurements/helpers";
import { decode } from "utils/annotator";
import * as tf from "@tensorflow/tfjs";

export const format = (value: string | number) => {
  if (typeof value === "number") {
    return value.toFixed(2);
  } else {
    return value;
  }
};

export const formatChartItems = (
  measurementTables: Record<string, MeasurementDisplayTable>
): ChartValues => {
  const items: ChartValues = {};
  const measurementData = Object.values(measurementTables);
  if (measurementData.length === 0) {
    return items;
  }

  measurementData.forEach((data, idx) => {
    const measurementType = data.measurementId;

    items[measurementType] = {
      measurementType,
    };
  });

  return items;
};

export const getHistogramData = (
  rawData: number[],
  numBins: number
):
  | { data: number[]; xAxis: number[]; binSize: number; min: number }
  | undefined => {
  if (rawData.length === 0) return;
  let min = Infinity;
  let max = -Infinity;

  for (const item of rawData) {
    if (item < min) min = item;
    if (item > max) max = item;
  }

  const valueRange = max - min > 0 ? max - min : min;
  const binSize = valueRange / numBins + 1;
  const data = new Array(numBins).fill(0);

  for (const item of rawData) {
    const binIndex = Math.floor((item - min) / binSize);
    data[binIndex]++;
  }

  let i = 0;
  const xAxis: number[] = [];
  while (i < numBins + 1) {
    xAxis.push(+format(i * binSize));
    i++;
  }

  return { data, xAxis, binSize, min };
};

/*
  Given a selection tree item, updates the selection status of all of its children
*/
export const selectTreeItemChildren = (
  updates: RecursivePartial<MeasurementOptions>,
  itemId: string,
  items: MeasurementOptions,
  selectionStatus: "on" | "off"
) => {
  const dataItem = items[itemId];
  if (dataItem) {
    // data item exists
    updates[dataItem.id as keyof MeasurementOptions] = {
      state: selectionStatus,
      children: dataItem.children,
    };
    if (dataItem.children) {
      // data item has children, select or deselect all children
      dataItem.children.forEach((child) => {
        selectTreeItemChildren(updates, child, items, selectionStatus);
      });
    }
  }
};

export const prepareThingData = async (thingData: {
  data: tf.Tensor4D;
  encodedMask?: number[];
  decodedMask?: DataArray;
}) => {
  let channelData: tf.Tensor2D;
  let maskData: DataArray | undefined = undefined;
  let maskShape: { width: number; height: number } | undefined;
  if (thingData.decodedMask) {
    const fullChannelData = prepareChannels(thingData.data);
    channelData = await getObjectMaskData(
      fullChannelData,
      thingData.decodedMask
    );
    fullChannelData.dispose();
    maskData = thingData.decodedMask;
    maskShape = {
      height: thingData.data.shape[1],
      width: thingData.data.shape[2],
    };
  } else if (thingData.encodedMask) {
    const decodedMask = Uint8Array.from(decode(thingData.encodedMask));

    const fullChannelData = prepareChannels(thingData.data);
    channelData = await getObjectMaskData(fullChannelData, decodedMask);
    fullChannelData.dispose();
    maskData = decodedMask;
    maskShape = {
      height: thingData.data.shape[1],
      width: thingData.data.shape[2],
    };
  } else {
    channelData = prepareChannels(thingData.data);
  }
  const thingInfo = {
    channels: channelData.arraySync(),
    maskData,
    maskShape,
  };
  channelData.dispose();

  return thingInfo;
};
