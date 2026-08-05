import { useEffect, useRef, useState } from "react";

import { ResponsiveScatterPlot } from "@nivo/scatterplot";

import { usePreferredNivoTheme } from "hooks";

import type {
  ChartConfig,
  ParsedMeasurementData,
} from "@MeasurementViewer/types";
import { formatString } from "utils/stringUtils";
import { useTheme } from "@mui/material";

type ScatterPoint = {
  id: number;
  x: number;
  y: number;
  z?: number;
  preview: string;
  category: string;
  timepoint: number;
};

type ScatterGroup = {
  id: string;
  data: ScatterPoint[];
};

type ScatterData = ScatterGroup[];

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
  const containerRef = useRef<HTMLDivElement>(null);
  const muiTheme = useTheme();
  const activeSerieRef = useRef<string | number | null>(null);
  const updateOpacities = () => {
    const circles = containerRef.current?.querySelectorAll(
      "circle[data-serie-id]",
    );
    if (!circles) return;
    circles.forEach((circle) => {
      const el = circle as SVGCircleElement;
      const serieId = el.getAttribute("data-serie-id");
      el.style.opacity =
        activeSerieRef.current && serieId !== String(activeSerieRef.current)
          ? "0.15"
          : "1";
    });
  };

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
        const xData =
          xAxis === "timepoint" ? thing.timepoint : thing.measurements[xAxis];
        const yData = thing.measurements[yAxis];

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
            nodeSize = Math.round(thing.measurements[size]);

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
            category: thing.category,
            timepoint: thing.timepoint,
            preview: thing.preview,
          });
        }
      });
    setMinSize(minSize);
    setMaxSize(maxSize);
    setFormattedData(Object.values(scatterGroups));
  }, [chartConfig, measurementData, thingIds]);

  return chartConfig["x-axis"] && chartConfig["y-axis"] ? (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <ResponsiveScatterPlot<ScatterPoint>
        theme={theme}
        colors={{ scheme: chartConfig.colorTheme }}
        data={formattedData}
        onMouseMove={(node) => {
          if (activeSerieRef.current !== node.serieId) {
            activeSerieRef.current = node.serieId;
            updateOpacities();
          }
          updateOpacities();
        }}
        onMouseLeave={() => {
          activeSerieRef.current = null;
          updateOpacities();
        }}
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
          legend: formatString(chartConfig["x-axis"]!, undefined, "first-word"),
          legendPosition: "middle",
          legendOffset: 50,
          truncateTickAt: 0,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: formatString(chartConfig["y-axis"]!, undefined, "first-word"),
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
        nodeComponent={({ node, blendMode }) => (
          <circle
            data-serie-id={node.serieId}
            cx={node.x}
            cy={node.y}
            r={node.size / 2}
            fill={node.color}
            style={{
              mixBlendMode: blendMode,

              transition: "opacity 0.2s ease",
            }}
          />
        )}
        useMesh={true}
        tooltip={(point) => {
          return (
            <div
              style={{
                display: "flex",
                background: muiTheme.palette.background.default,
                borderRadius: muiTheme.shape.borderRadius,
                padding: "9px 12px",
                border: "1px solid #ccc",
                gap: "1rem",
                zIndex: 999999,
                fontSize: muiTheme.typography.body2.fontSize,
              }}
            >
              <img src={point.node.data.preview} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div>
                  {formatString(
                    chartConfig["x-axis"]!,
                    undefined,
                    "first-word",
                  )}
                  : {point.node.data.x}
                </div>
                <div>
                  {formatString(
                    chartConfig["y-axis"]!,
                    undefined,
                    "first-word",
                  )}
                  : {point.node.data.y}
                </div>

                <div>Category: {point.node.data.category}</div>
              </div>
            </div>
          );
        }}
      />
    </div>
  ) : (
    <></>
  );
};
