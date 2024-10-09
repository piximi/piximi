import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { useEffect, useState } from "react";
import { ParsedMeasurementData } from "store/measurements/types";
import { ChartConfig, ScatterData, ScatterGroup, ScatterPoint } from "../types";
import { usePreferredNivoTheme } from "hooks";

export const ResponsiveScatter = ({
  chartConfig,
  measurementData,
  thingIds,
}: {
  chartConfig: ChartConfig;
  measurementData: ParsedMeasurementData;
  thingIds: string[];
}) => {
  const [formattedData, setFormattedData] = useState<ScatterData>([]);
  const [minSize, setMinSize] = useState<number>();
  const [maxSize, setMaxSize] = useState<number>();
  const theme = usePreferredNivoTheme();
  useEffect(() => {
    const { "x-axis": xAxis, "y-axis": yAxis, size, color } = chartConfig;
    if (!xAxis || !yAxis) return;
    const scatterGroups: Record<string, ScatterGroup> = {};
    let minSize = Infinity;
    let maxSize = 0;

    thingIds
      .map((thingId) => measurementData[thingId])
      .forEach((thing) => {
        const xData = thing.measurements[xAxis.measurementType];
        const yData = thing.measurements[yAxis.measurementType];

        if (xData && yData) {
          const groupName = color ? thing[color] : "measurements";
          if (!(groupName in scatterGroups)) {
            scatterGroups[groupName] = {
              id: groupName,
              data: [],
            };
          }
          let nodeSize: number | undefined = undefined;
          if (size) {
            nodeSize = Math.round(thing.measurements[size.measurementType]);

            if (nodeSize < minSize) {
              minSize = nodeSize;
            }
            if (nodeSize > maxSize) {
              maxSize = nodeSize;
            }
          }
          scatterGroups[groupName].data.push({
            id: scatterGroups[groupName].data.length,
            x: xData,
            y: yData,
            z: nodeSize,
          });
        }
      });
    setMinSize(minSize);
    setMaxSize(maxSize);
    setFormattedData(Object.values(scatterGroups));
  }, [chartConfig, measurementData, thingIds]);

  return chartConfig["x-axis"] && chartConfig["y-axis"] ? (
    <ResponsiveScatterPlot<ScatterPoint>
      theme={theme}
      colors={{ scheme: chartConfig.colorTheme }}
      data={formattedData}
      margin={{ top: 60, right: 140, bottom: 70, left: 90 }}
      xScale={{ type: "linear", min: 0, max: "auto" }}
      xFormat=">-.2f"
      yScale={{ type: "linear", min: 0, max: "auto" }}
      yFormat=">-.2f"
      blendMode="normal"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: chartConfig["x-axis"]!.measurementType,
        legendPosition: "middle",
        legendOffset: 50,
        truncateTickAt: 0,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: chartConfig["y-axis"]!.measurementType,
        legendPosition: "middle",
        legendOffset: -60,
        truncateTickAt: 0,
      }}
      legends={[
        {
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 130,
          translateY: 0,
          itemWidth: 120,
          itemHeight: 12,
          itemsSpacing: 5,
          itemDirection: "left-to-right",
          symbolSize: 12,
          symbolShape: "circle",
          effects: [
            {
              on: "hover",
              style: {
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
      nodeSize={
        chartConfig.size
          ? { key: "data.z", values: [minSize!, maxSize!], sizes: [9, 32] }
          : undefined
      }
      tooltip={(point) => {
        return (
          <div
            style={{
              background: "white",
              padding: "9px 12px",
              border: "1px solid #ccc",
            }}
          >
            <div>x: {point.node.data.x}</div>
            <div>y: {point.node.data.y}</div>
            <div>size: {point.node.size}</div>
          </div>
        );
      }}
    />
  ) : (
    <></>
  );
};
