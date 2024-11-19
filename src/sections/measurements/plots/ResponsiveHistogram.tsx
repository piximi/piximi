import { useEffect, useState } from "react";
import { ResponsiveMarimekko } from "@nivo/marimekko";

import { usePreferredNivoTheme } from "hooks";

import { ParsedMeasurementData } from "store/measurements/types";

import { format, getHistogramData } from "../utils";
import { ChartConfig } from "../types";

export const ResponsiveHistogram = ({
  chartConfig,
  measurementData,
  thingIds,
}: {
  chartConfig: ChartConfig;
  measurementData: ParsedMeasurementData;
  thingIds: string[];
}) => {
  const [formattedData, setFormattedData] = useState<
    { id: Number; title: string; numValues: number; total: number }[]
  >([]);
  const [xMin, setXMin] = useState<number>(0);
  const [xAxis, setXAxis] = useState<number[]>([]);
  const theme = usePreferredNivoTheme();

  useEffect(() => {
    const xAxis = chartConfig["x-axis"];
    if (!xAxis) return;
    const rawData: number[] = [];
    const formattedData: {
      id: number;
      title: string;
      numValues: number;
      total: number;
    }[] = [];
    thingIds
      .map((thingId) => measurementData[thingId])
      .forEach((thing) => {
        const data = thing.measurements[xAxis.measurementType];
        if (data) {
          rawData.push(data);
        }
      });

    const hist = getHistogramData(rawData, chartConfig.numBins!);
    if (!hist) return;
    hist.data.forEach((binCount, idx) => {
      formattedData.push({
        id: idx,
        title: `${format(hist.xAxis[idx] + hist.min)} - ${
          idx + 1 === hist.data.length
            ? format(hist.xAxis[idx] + hist.binSize + hist.min)
            : format(hist.xAxis[idx + 1] + hist.min)
        }`,
        numValues: +format(hist.binSize!),
        total: binCount,
      });
    });
    setXMin(hist.min);
    setXAxis(hist.xAxis);
    setFormattedData(formattedData);
  }, [chartConfig, measurementData, thingIds]);

  return chartConfig["x-axis"] ? (
    <ResponsiveMarimekko
      theme={theme}
      colors={{ scheme: chartConfig.colorTheme }}
      data={formattedData}
      id="id"
      value="numValues"
      dimensions={[
        {
          id: "total",
          value: "total",
        },
      ]}
      innerPadding={0}
      axisTop={null}
      //gridXValues={xAxis}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 45,
        ticksPosition: "before",
        tickValues: xAxis,
        format: (value) => format(value + xMin),
        legend: chartConfig["x-axis"]!.measurementType,
        legendOffset: 65,
        legendPosition: "middle",
        truncateTickAt: 0,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "count",
        legendOffset: -40,
        legendPosition: "middle",
        truncateTickAt: 0,
      }}
      margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
      borderWidth={1}
      borderColor="black"
    />
  ) : (
    <></>
  );
};
