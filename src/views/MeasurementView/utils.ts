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

/**
 * Adaptively formats a number based on its magnitude.
 *
 * Formatting rules:
 * - Integers: displayed without decimal places
 * - Large numbers (≥10000): no decimal places
 * - Medium numbers (10-9999): up to 2 decimal places
 * - Small numbers (1-10): up to 3 decimal places
 * - Very small numbers (<1): uses significant figures
 * - Removes trailing zeros after decimal point
 *
 * @param value - The number or string to format
 * @param significantFigures - Number of significant figures for very small numbers (default: 3)
 */
export const format = (
  value: string | number,
  significantFigures: number = 3,
): string => {
  if (typeof value === "string") {
    return value;
  }

  // Handle special cases
  if (!Number.isFinite(value)) {
    return String(value);
  }

  // Check if value is effectively an integer
  if (Number.isInteger(value) || Math.abs(value - Math.round(value)) < 1e-10) {
    return String(Math.round(value));
  }

  const absValue = Math.abs(value);

  // Very small numbers: use significant figures
  if (absValue < 1) {
    // TODO(human): Implement significant figures formatting for small decimals
    return value.toPrecision(significantFigures);
  }

  // Small numbers (1-100): show up to 3 decimal places
  if (absValue < 100) {
    return trimTrailingZeros(value.toFixed(2));
  }

  // Large numbers: no decimal places
  return Math.round(value).toString();
};

/**
 * Removes trailing zeros after the decimal point.
 * "1.500" -> "1.5", "2.00" -> "2"
 */
const trimTrailingZeros = (str: string): string => {
  if (!str.includes(".")) return str;
  return str.replace(/\.?0+$/, "");
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
