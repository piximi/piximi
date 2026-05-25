import { useCallback, useMemo, useState } from "react";

import range from "lodash/range";
import { ResponsiveLine } from "@nivo/line";

import type { Theme } from "@mui/material";
import { Container, Typography, useTheme } from "@mui/material";

import { usePreferredNivoTheme } from "hooks";

import type { Point } from "utils/types";

import type { RunDrift } from "@ProjectViewer/contexts/ClassifierHistoryProvider";

type TwoDataPlotProps = {
  title: string;
  xLabel: string;
  yLabel: string;
  yData1: { x: number; y: number }[];
  yData2: { x: number; y: number }[];
  id1: string;
  id2: string;
  dynamicYRange?: boolean;
  runDrifts: RunDrift[];
};

const DRIFT_TEXT_HEIGHT = 16;
const DRIFT_TEXT_PADDING = 4;
const DRIFT_TEXT_X_OFFSET = 6;
const DRIFT_TEXT_Y_OFFSET = 16;
const DRIFT_TEXT_FONT_SIZE = 12;
const OPT_ALGO_DRIFT_TEXT = "Opt. Algo.: ";
const LEARN_RTE_DRIFT_TEXT = "Learning Rate: ";

const DriftMarkers = ({
  xScale,
  innerHeight,
  theme,
  runDrifts,
}: {
  xScale: (x: number) => number;
  innerHeight: number;
  theme: Theme;
  runDrifts: RunDrift[];
}) => {
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);
  return (
    <>
      {runDrifts.map((d) => {
        const x = xScale(d.epoch);
        const optChange = d.drift.optimizationAlgorithm
          ? `${d.drift.optimizationAlgorithm[0]} --> ${d.drift.optimizationAlgorithm[1]}`
          : undefined;

        const lrteChange = d.drift.learningRate
          ? `${d.drift.learningRate[0]} --> ${d.drift.learningRate[1]}`
          : undefined;

        const getMaxTextWidth = () => {
          if (!optChange && !lrteChange) return 0;
          let textWidth: number;
          if (!lrteChange)
            textWidth = (OPT_ALGO_DRIFT_TEXT + optChange!).length;
          else if (!optChange)
            textWidth = (LEARN_RTE_DRIFT_TEXT + lrteChange).length;
          else
            textWidth = Math.max(
              (OPT_ALGO_DRIFT_TEXT + optChange!).length,
              (LEARN_RTE_DRIFT_TEXT + lrteChange).length,
            );
          return textWidth * 6;
        };

        const getMaxTextHeight = () => {
          if (!optChange && !lrteChange) return 0;
          if (!!optChange !== !!lrteChange) return DRIFT_TEXT_HEIGHT;
          return 2 * DRIFT_TEXT_HEIGHT + DRIFT_TEXT_PADDING;
        };

        return (
          <g key={`run-drift-${d.epoch}`}>
            {/* Actual dashed line */}
            <line
              x1={x}
              x2={x}
              y1={0}
              y2={innerHeight}
              stroke={theme.palette.text.primary}
              strokeWidth={1}
              strokeDasharray="5 5"
              pointerEvents="none"
            />

            {/* Invisible wide hit area for hover */}
            <line
              x1={x}
              x2={x}
              y1={0}
              y2={innerHeight}
              stroke="transparent"
              strokeWidth={12}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredMarker(d.epoch)}
              onMouseLeave={() => setHoveredMarker(null)}
            />

            {/* Conditional label */}
            {hoveredMarker === d.epoch && (
              <g>
                <rect
                  x={x + DRIFT_TEXT_X_OFFSET}
                  y={DRIFT_TEXT_Y_OFFSET - DRIFT_TEXT_PADDING}
                  width={getMaxTextWidth() + DRIFT_TEXT_PADDING * 2}
                  height={getMaxTextHeight() + DRIFT_TEXT_PADDING * 2}
                  fill={theme.palette.background.default}
                  stroke={theme.palette.text.primary}
                  strokeWidth={1}
                  rx={3}
                />
                {optChange && (
                  <text
                    x={x + DRIFT_TEXT_X_OFFSET + DRIFT_TEXT_PADDING * 2}
                    y={
                      DRIFT_TEXT_Y_OFFSET +
                      DRIFT_TEXT_HEIGHT -
                      DRIFT_TEXT_PADDING
                    }
                    fontSize={DRIFT_TEXT_FONT_SIZE}
                    fill={theme.palette.text.primary}
                  >
                    <tspan fontWeight="bold">{OPT_ALGO_DRIFT_TEXT}</tspan>
                    {optChange}
                  </text>
                )}
                {lrteChange && (
                  <text
                    x={x + DRIFT_TEXT_X_OFFSET + DRIFT_TEXT_PADDING * 2}
                    y={DRIFT_TEXT_Y_OFFSET * 2 + DRIFT_TEXT_HEIGHT}
                    fontSize={DRIFT_TEXT_FONT_SIZE}
                    fill={theme.palette.text.primary}
                  >
                    <tspan fontWeight="bold">{LEARN_RTE_DRIFT_TEXT}</tspan>
                    {lrteChange}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}
    </>
  );
};
export const TwoDataPlot = (props: TwoDataPlotProps) => {
  const {
    title,
    xLabel,
    yLabel,
    yData1,
    yData2,
    id1,
    id2,
    dynamicYRange = false,
    runDrifts,
  } = props;
  const theme = useTheme();
  const nivoTheme = usePreferredNivoTheme();

  const data = useMemo(
    () =>
      [
        {
          id: id1,
          color: "#DC3220",
          data: yData1,
        },
        {
          id: id2,
          color: "#005AB5",
          data: yData2,
        },
      ].filter((series) => series.data.length > 0),
    [id1, id2, yData1, yData2],
  );

  const stepSize = Math.max(1, Math.ceil(yData1.length / 30));
  const xRange = range(0, yData1.length + 1, stepSize);
  const pointSizeAdjustment = Math.floor(yData1.length / 20);

  const min = useMemo(() => {
    if (!dynamicYRange) return 0;
    const y1Min =
      yData1.length > 0
        ? yData1.reduce((min: number, val: Point) => {
            return val.y < min ? val.y : min;
          }, Infinity)
        : 0;
    const y2Min =
      yData2.length > 0
        ? yData2.reduce((min: number, val: Point) => {
            return val.y < min ? val.y : min;
          }, Infinity)
        : 0;
    if (y1Min === 0 && y2Min === 0) return 0;
    return Math.min(y1Min, y2Min) - 0.1;
  }, [dynamicYRange, yData1, yData2]);

  const max = useMemo(() => {
    if (!dynamicYRange) return 1;
    const y1Max = yData1.reduce((max: number, val: Point) => {
      return val.y > max ? val.y : max;
    }, 0);
    const y2Max = yData2.reduce((max: number, val: Point) => {
      return val.y > max ? val.y : max;
    }, 0);
    return Math.max(y1Max, y2Max) + 0.1;
  }, [dynamicYRange, yData1, yData2]);

  const driftMarkersLayer = useCallback(
    (props) => <DriftMarkers {...props} runDrifts={runDrifts} theme={theme} />,
    [runDrifts, theme],
  );

  const plotTheme = useMemo(
    () => ({
      ...nivoTheme,
      background: "transparent",
      grid: { line: { strokeWidth: "0.5px" } },
      markers: {
        lineColor: theme.palette.text.primary,
      },
      axis: {
        ...nivoTheme.axis,
        legend: {
          ...nivoTheme?.axis?.legend,
          text: {
            ...nivoTheme?.axis?.legend?.text,
            fontSize: 16,
          },
        },
      },
    }),
    [nivoTheme, theme],
  );

  return (
    <Container sx={{ height: 350, mb: 5 }}>
      <Typography align={"center"} variant="body1">
        {title}
      </Typography>
      <ResponsiveLine
        data={data}
        theme={plotTheme}
        lineWidth={3}
        margin={{
          top: 10,
          right: 10,
          bottom: 80,
          left: 70,
        }}
        xScale={{ type: "linear", min: 0, max: Math.max(1, yData1.length) }}
        yScale={{
          type: "linear",
          min: min,
          max: max,
        }}
        enableGridX={false}
        enableGridY
        gridXValues={xRange}
        yFormat=">-.3f"
        enableSlices={"x"}
        sliceTooltip={({ slice }) => {
          return (
            <div
              style={{
                background: "#ffffffdd",
                borderRadius: "10px",
                padding: "5px 7px",
              }}
            >
              {slice.points.map((point) => (
                <div
                  key={point.id}
                  style={{
                    color: point.serieColor,
                    padding: "3px 0",
                  }}
                >
                  <strong>{point.serieId}</strong> {point.data.yFormatted}
                </div>
              ))}
            </div>
          );
        }}
        axisBottom={{
          tickSize: 5,
          tickValues: xRange,
          tickPadding: 5,
          tickRotation: 0,
          legend: xLabel,
          legendOffset: 40,
          legendPosition: "middle",
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: yLabel,
          legendOffset: -50,
          legendPosition: "middle",
        }}
        colors={{ datum: "color" }}
        pointSize={8 - pointSizeAdjustment}
        pointColor={{ from: "color" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointLabelYOffset={-12}
        useMesh={true}
        layers={[
          "grid",
          "axes",
          "areas",
          "crosshair",
          "lines",
          "points",
          "slices",
          "mesh",
          "legends",
          driftMarkersLayer, // replaces markers prop
        ]}
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            justify: false,
            translateX: 0,
            translateY: 75,
            itemsSpacing: 70,
            itemDirection: "left-to-right",
            itemWidth: 80,
            itemHeight: 20,
            symbolSize: 12,
            symbolShape: "circle",
            symbolBorderColor: "rgba(0, 0, 0, .5)",
          },
        ]}
      />
    </Container>
  );
};
