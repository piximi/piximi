import { MeasurementDisplayTable } from "store/measurements/types";
import { ChartValues } from "./types";

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
