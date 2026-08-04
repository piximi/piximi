import { useMemo } from "react";

import { ResponsiveBar } from "@nivo/bar";

import { useTheme } from "@mui/material";

import { usePreferredNivoTheme } from "hooks";

import { format } from "@MeasurementViewer/utils";

import type {
  ChartConfig,
  ParsedMeasurementData,
} from "@MeasurementViewer/types";

type HistogramData = {
  bins: number[];
  xAxis: number[];
  binSize: number;
  min: number;
  max: number;
};

const computeHistogramBins = (
  rawData: number[],
  numBins: number,
): HistogramData | undefined => {
  if (rawData.length === 0) return undefined;

  let min = Infinity;
  let max = -Infinity;

  for (const value of rawData) {
    if (value < min) min = value;
    if (value > max) max = value;
  }

  const valueRange = max - min > 0 ? max - min : min;
  const binSize = valueRange / numBins;
  const bins = new Array(numBins).fill(0);

  for (const value of rawData) {
    const binIndex = Math.min(Math.floor((value - min) / binSize), numBins - 1);
    bins[binIndex]++;
  }

  const xAxis: number[] = [];
  for (let i = 0; i <= numBins; i++) {
    xAxis.push(+format(min + i * binSize, 4));
  }

  return { bins, xAxis, binSize, min, max };
};

type BarDatum = {
  bin: string;
  count: number;
  binStart: number;
  binEnd: number;
};

export const ResponsiveBarHistogram = ({
  chartConfig,
  measurementData,
  entityIds,
}: {
  chartConfig: ChartConfig;
  measurementData: ParsedMeasurementData;
  entityIds: string[];
}) => {
  const theme = usePreferredNivoTheme();
  const muiTheme = useTheme();

  const barData = useMemo<BarDatum[]>(() => {
    const xAxisKey = chartConfig["x-axis"]?.replace("-", "");
    if (!xAxisKey) return [];

    const rawData: number[] = [];
    for (const entityId of entityIds) {
      const entity = measurementData[entityId];
      if (entity?.measurements[xAxisKey] !== undefined) {
        rawData.push(entity.measurements[xAxisKey]);
      }
    }

    const histogram = computeHistogramBins(rawData, chartConfig.numBins ?? 10);
    if (!histogram) return [];

    return histogram.bins.map((count, idx) => {
      const binStart = histogram.xAxis[idx];
      const binEnd = histogram.xAxis[idx + 1];
      return {
        bin: `${format(binStart, 3)} - ${format(binEnd, 3)}`,
        count,
        binStart,
        binEnd,
      };
    });
  }, [chartConfig, measurementData, entityIds]);

  if (!chartConfig["x-axis"]) {
    return null;
  }

  return (
    <ResponsiveBar
      data={barData}
      keys={["count"]}
      indexBy="bin"
      theme={theme}
      colors={{ scheme: chartConfig.colorTheme }}
      margin={{ top: 40, right: 80, bottom: 100, left: 80 }}
      padding={0}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 45,
        legend: chartConfig["x-axis"],
        legendOffset: 80,
        legendPosition: "middle",
        renderTick: (tick) => {
          // The tick.x is centered under each bar
          // Shift left to align labels with bin edges (left side of bars)
          const shiftAmount = -15; // Adjust this value as needed
          const tickSize = 5;
          const tickPadding = 5;
          const tickRotation = 45;

          return (
            <g transform={`translate(${tick.x},0)`}>
              <line
                stroke={muiTheme.palette.text.primary}
                strokeWidth={1}
                y2={tickSize}
              />
              <text
                transform={`translate(${shiftAmount},${tickSize + tickPadding}) rotate(${tickRotation})`}
                textAnchor="start"
                dominantBaseline="central"
                style={{
                  fontSize: 12,
                  fill: muiTheme.palette.text.primary,
                }}
              >
                {tick.value}
              </text>
            </g>
          );
        },
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "Count",
        legendOffset: -50,
        legendPosition: "middle",
      }}
      borderWidth={1}
      borderColor="black"
      enableLabel={!!chartConfig.binLabel}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{
        from: "color",
        modifiers: [["darker", 1.6]],
      }}
      tooltip={({ data, value, color }) => (
        <div
          style={{
            padding: "8px 12px",
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <strong style={{ color }}>Range: {data.bin}</strong>
          <br />
          Count: {value}
        </div>
      )}
      // TODO(human): Implement click handler for bar selection
      // onClick={(datum) => { }}
    />
  );
};
