import { Tensor2D, Tensor4D } from "@tensorflow/tfjs";
import saveAs from "file-saver";
import { DataArray } from "image-js";
import { v4 as uuidv4 } from "uuid";

import { decode } from "views/ImageViewer/utils";
import {
  ChartConfig,
  ChartType,
  ChartValues,
  MeasurementDisplayTable,
} from "./types";

import { CHANNEL_MEASUREMENT_KEYS } from "store/data/consts";
import { ChannelMeasurements } from "store/data/types";

import { getObjectMaskData, prepareChannels } from "utils/measurements/utils";

export const format = (value: string | number, sf: number = 2) => {
  if (typeof value === "number") {
    return value.toFixed(sf);
  } else {
    return value;
  }
};

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

export const getHistogramData = (
  rawData: number[],
  numBins: number,
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

export const prepareEntityChannelData = async (
  data: Tensor4D,
  encodedMask?: number[],
  decodedMask?: DataArray,
) => {
  let channelData: Tensor2D;
  if (decodedMask) {
    const fullChannelData = prepareChannels(data);
    channelData = await getObjectMaskData(fullChannelData, decodedMask);
    fullChannelData.dispose();
  } else if (encodedMask) {
    const decodedMask = Uint8Array.from(decode(encodedMask));

    const fullChannelData = prepareChannels(data);
    channelData = await getObjectMaskData(fullChannelData, decodedMask);
    fullChannelData.dispose();
  } else {
    channelData = prepareChannels(data);
  }
  const channelArray = channelData.arraySync();
  channelData.dispose();

  return channelArray;
};

export const savePlot = (
  plotRef: React.MutableRefObject<HTMLDivElement | null>,
  plotName: string,
) => {
  if (!plotRef.current) return;
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  const data = parser.parseFromString(
    plotRef.current.innerHTML,
    "image/svg+xml",
  );
  const errorNode = data.querySelector("parsererror");
  if (errorNode) {
    throw new Error(errorNode.textContent || "Unknown error parsing svg");
  }

  const svgData = data.getElementsByTagName("svg")[0];

  const img = new Image();
  const svgStr = serializer.serializeToString(svgData);

  img.src = "data:image/svg+xml;base64," + window.btoa(svgStr);

  const canvas = document.createElement("canvas");
  const width = Math.round(+svgData.getAttribute("width")!);
  const height = Math.round(+svgData.getAttribute("height")!);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }
  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height);

    const url = canvas.toDataURL("image/png");
    saveAs(url, plotName);
  };
};

export const values2ChannelMeasurementLabel = (
  channelId: number,
  measurement: keyof ChannelMeasurements,
) => {
  return measurement + "-" + channelId;
};

export const channelMeasurementLabel2Values = (
  label: string,
): { measurement: keyof ChannelMeasurements; channelId: number } => {
  const [measurement, channelId] = label.split("-");
  if (
    !CHANNEL_MEASUREMENT_KEYS.includes(
      measurement as keyof ChannelMeasurements,
    ) ||
    Number.isNaN(+channelId)
  )
    throw new Error(
      `Could not parse values from channel measurement label"${label}`,
    );
  return {
    measurement: measurement as keyof ChannelMeasurements,
    channelId: +channelId,
  };
};

export const generateInitialPlot = () => {
  const initialChartConfig: ChartConfig = {
    chart: ChartType.Histogram,
    colorTheme: "nivo",
    numBins: 10,
  };
  const initialPlotId = uuidv4();
  return {
    id: initialPlotId,
    name: "Plot 1",
    chartConfig: initialChartConfig,
  };
};
