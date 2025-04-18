import { useEffect, useMemo, useState } from "react";
import range from "lodash/range";
import { ResponsiveLine } from "@nivo/line";

import { Container, Typography, useMediaQuery, useTheme } from "@mui/material";

import { usePreferredNivoTheme } from "hooks";

import { APPLICATION_COLORS } from "utils/common/constants";
import { Point } from "views/ImageViewer/utils/types";

type TwoDataPlotProps = {
  title: string;
  xLabel: string;
  yLabel: string;
  yData1: { x: number; y: number }[];
  yData2: { x: number; y: number }[];
  id1: string;
  id2: string;
  dynamicYRange?: boolean;
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
  } = props;
  const theme = useTheme();
  const nivoTheme = usePreferredNivoTheme();
  const matchesBP = useMediaQuery(theme.breakpoints.down("md"));

  const [data, setData] = useState<
    {
      id: string;
      color: string;
      data: { x: number; y: number }[];
    }[]
  >([]);

  const stepSize = Math.ceil(yData1.length / 30);
  const xRange = range(0, yData1.length + 1, stepSize);
  const pointSizeAdjustment = Math.floor(yData1.length / 20);

  const min = useMemo(() => {
    if (!dynamicYRange) return 0;
    const y1Min = yData1.reduce((min: number, val: Point) => {
      return val.y < min ? val.y : min;
    }, Infinity);
    const y2Min = yData2.reduce((min: number, val: Point) => {
      return val.y < min ? val.y : min;
    }, Infinity);
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

  useEffect(() => {
    const data1 = {
      id: id1,
      color: "#DC3220",
      data: yData1,
    };

    const data2 = {
      id: id2,
      color: "#005AB5",
      data: yData2,
    };

    setData([data1, data2]);
  }, [id1, id2, yData1, yData2]);

  return (
    <Container sx={{ height: 350, mb: 5 }}>
      <Typography align={"center"} variant="body1">
        {title}
      </Typography>
      <ResponsiveLine
        data={data}
        theme={{
          ...nivoTheme,
          background: "transparent",
          grid: { line: { strokeWidth: "0.5px" } },
        }}
        lineWidth={3}
        margin={{ top: 10, right: matchesBP ? 10 : 170, bottom: 80, left: 70 }}
        xScale={{ type: "linear" }}
        yScale={{
          type: "linear",
          min: min,
          max: max,
        }}
        enableGridX={false}
        enableGridY
        //gridXValues={xRange}
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
          legendOffset: 35,
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
        legends={[
          {
            anchor: matchesBP ? "bottom" : "right",
            direction: matchesBP ? "row" : "column",
            justify: false,
            translateX: matchesBP ? 0 : 100,
            translateY: matchesBP ? 70 : 0,
            itemsSpacing: matchesBP ? 70 : 0,
            itemDirection: "left-to-right",
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: "circle",
            symbolBorderColor: "rgba(0, 0, 0, .5)",
            effects: [
              {
                on: "hover",
                style: {
                  itemBackground: APPLICATION_COLORS.highlightColor,
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
      />
    </Container>
  );
};
