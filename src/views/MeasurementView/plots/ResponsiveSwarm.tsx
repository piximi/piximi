import React, { useEffect, useMemo, useState } from "react";
import { alpha, darken } from "@mui/material";
import {
  ResponsiveSwarmPlot,
  SwarmPlotCustomLayerProps,
} from "@nivo/swarmplot";
import { ScaleLinear } from "@nivo/scales";

import { usePreferredNivoTheme } from "hooks";

import { getMean, getStatistics } from "utils/measurements/helpers";

import { ParsedMeasurementData } from "store/measurements/types";
import { ChartConfig, NodeGroupRecord, SwarmData, SwarmDatum } from "../types";

const StatLayer = ({
  nodes,
}: SwarmPlotCustomLayerProps<SwarmDatum, ScaleLinear<number>>) => {
  const [nodesByGroup, setNodesByGroup] = useState<NodeGroupRecord>();

  useEffect(() => {
    type NewType = NodeGroupRecord;

    const nodesByGroup = nodes.reduce<NewType>((acc, node) => {
      if (node.group in acc) {
        acc[node.group].nodes.push(node);
      } else {
        acc[node.group] = { nodes: [node], color: node.color };
      }
      return acc;
    }, {});

    Object.keys(nodesByGroup).forEach((group) => {
      const groupNodes = nodesByGroup[group].nodes;
      const xVals = groupNodes.map((node) => node.x);
      const yVals = groupNodes.map((node) => node.y as number);
      const groupStats = getStatistics(yVals);
      const groupMeanX = getMean(xVals);
      const { minX, maxX } = xVals.reduce<{ minX: number; maxX: number }>(
        (acc, x) => {
          acc.minX = x < acc.minX ? x : acc.minX;
          acc.maxX = x > acc.maxX ? x : acc.maxX;

          return acc;
        },
        { minX: Infinity, maxX: 0 },
      );
      const width =
        Math.max(Math.abs(groupMeanX - minX), Math.abs(groupMeanX - maxX)) + 15;
      nodesByGroup[group].width = width;
      nodesByGroup[group].stats = groupStats;
      nodesByGroup[group].x = groupMeanX;
    });

    setNodesByGroup(nodesByGroup);
  }, [nodes]);
  return !nodesByGroup ? (
    <></>
  ) : (
    <>
      {Object.values(nodesByGroup).map((group) => (
        <>
          <line
            x1={group.x! - group.width! + 15}
            y1={group.stats!.min} // using chart coords, so data max -> chart min
            x2={group.x! + group.width! - 15}
            y2={group.stats!.min}
            stroke={darken(group.color!, 0.1)}
          />
          <line
            x1={group.x!}
            y1={group.stats!.median}
            x2={group.x!}
            y2={group.stats!.min}
            stroke={darken(group.color!, 0.1)}
          />
          <line
            x1={group.x! - group.width!}
            y1={group.stats!.median}
            x2={group.x! + group.width!}
            y2={group.stats!.median}
            stroke={darken(group.color!, 0.1)}
          />
          <rect
            x={group.x! - group.width!}
            y={group.stats!.lowerQuartile} // chart coords, upper / lower reversed
            width={2 * group.width!}
            height={group.stats!.upperQuartile - group.stats!.lowerQuartile}
            fill={alpha(group.color!, 0.2)}
            stroke={darken(group.color!, 0.1)}
            rx={8}
          />

          <line
            x1={group.x! - group.width! + 15}
            y1={group.stats!.max}
            x2={group.x! + group.width! - 15}
            y2={group.stats!.max}
            stroke={darken(group.color!, 0.1)}
          />
          <line
            x1={group.x!}
            y1={group.stats!.median}
            x2={group.x!}
            y2={group.stats!.max}
            stroke={darken(group.color!, 0.1)}
          />
        </>
      ))}
    </>
  );
};

export const ResponsiveSwarm = ({
  chartConfig,
  measurementData,
  thingIds,
}: {
  chartConfig: ChartConfig;
  measurementData: ParsedMeasurementData;
  thingIds: string[];
}) => {
  const [groupNames, setGroupNames] = useState<string[]>([]);
  const [minSize, setMinSize] = useState<number>();
  const [maxSize, setMaxSize] = useState<number>();
  const theme = usePreferredNivoTheme();
  const [formattedData, setFormattedData] = useState<SwarmData>([]);

  useEffect(() => {
    const { "y-axis": yAxis, size } = chartConfig;
    const swarmGroup = chartConfig.swarmGroup;
    if (!yAxis || !swarmGroup) return;
    const formattedData: SwarmData = [];
    const rawData: number[] = [];
    const groupNames = new Set<string>();
    let minSize = Infinity;
    let maxSize = 0;
    thingIds
      .map((thingId) => measurementData[thingId])
      .forEach((thing, idx) => {
        const data = thing.measurements[yAxis.measurementType];
        const group = thing[swarmGroup];
        groupNames.add(group);

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
        rawData.push(data);
        formattedData.push({
          id: "" + idx,
          index: idx,
          group,
          value: data,
          z: nodeSize,
        });
      });

    setMinSize(minSize);
    setMaxSize(maxSize);
    setGroupNames([...groupNames]);
    setFormattedData(formattedData);
  }, [chartConfig, measurementData, thingIds]);

  const swarmLayers = useMemo(() => {
    return chartConfig.swarmStatistics
      ? ["grid", "axes", "circles", StatLayer, "annotations"]
      : ["grid", "axes", "circles", "annotations"];
  }, [chartConfig]);

  return chartConfig.swarmGroup && chartConfig["y-axis"] ? (
    <ResponsiveSwarmPlot
      data={formattedData}
      theme={theme}
      colors={{ scheme: chartConfig.colorTheme }}
      groups={groupNames}
      id="id"
      value="value"
      // @ts-ignore: TODO not sure why ts complains
      layers={swarmLayers}
      size={
        chartConfig.size
          ? {
              key: "z",
              values: [minSize!, maxSize!],
              sizes: [6, 20],
            }
          : undefined
      }
      forceStrength={4}
      simulationIterations={100}
      borderColor={{
        from: "color",
        modifiers: [
          ["darker", 0.6],
          ["opacity", 0.5],
        ],
      }}
      margin={{ top: 80, right: 100, bottom: 80, left: 100 }}
      axisRight={{
        tickSize: 10,
        tickPadding: 5,
        tickRotation: 0,
        legend: chartConfig["y-axis"]!.measurementType,
        legendPosition: "middle",
        legendOffset: 76,
        truncateTickAt: 0,
      }}
      axisBottom={{
        tickSize: 10,
        tickPadding: 5,
        tickRotation: 0,
        legendPosition: "middle",
        legendOffset: 65,
        truncateTickAt: 0,
      }}
      axisLeft={{
        tickSize: 10,
        tickPadding: 5,
        tickRotation: 0,
        legend: chartConfig["y-axis"]!.measurementType,
        legendPosition: "middle",
        legendOffset: -76,
        truncateTickAt: 0,
      }}
    />
  ) : (
    <></>
  );
};
