import { ComputedDatum } from "@nivo/swarmplot";
import type { ColorSchemeId } from "@nivo/colors";

import { ParsedMeasurementDatum } from "store/measurements/types";

export type MeasurementDisplayParameters = {
  measurementPlotOptions: ChartValues;

  groupThingIds: string[];
};

type PlotDetail = {
  id: string;
  name: string;
  chartConfig: ChartConfig;
};

export type PlotDetails = {
  selectedPlot: string;
  plots: Record<string, PlotDetail>;
};

type AddActionProps = { type: "add" };
type EditActionProps = { type: "edit"; id: string; name: string };
type UpdateActionProps = {
  type: "update";
  id: string;
  chartConfig: ChartConfig;
};
type RemoveOrSelectActionProps = {
  type: "remove" | "select";
  id: string;
  newId?: string;
};
export type PlotViewActionProps =
  | AddActionProps
  | EditActionProps
  | UpdateActionProps
  | RemoveOrSelectActionProps;

export type ViewReducer = (
  prevState: PlotDetails,
  action: PlotViewActionProps,
) => PlotDetails;

export type SplitType = keyof Pick<
  ParsedMeasurementDatum,
  "category" | "partition"
>;
export enum ChartType {
  Histogram = "Histogram",
  Scatter = "Scatter",
  Swarm = "Swarm",
}

export type ChartItem = {
  measurementType: string;
};
export type ChartValues = Record<string, ChartItem>;

export type ChartConfig = {
  chart: ChartType;
  colorTheme: ColorSchemeId;
  "x-axis"?: ChartItem;
  "y-axis"?: ChartItem;
  size?: ChartItem;
  color?: SplitType;
  numBins?: number;
  swarmGroup?: SplitType;
  swarmStatistics?: boolean;
};

export type SwarmDatum = {
  id: string;
  index: number;
  group: string;
  value: number;
  z?: number;
};

type StatData = {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  lowerQuartile: number;
  upperQuartile: number;
};

type NodeGroup = {
  nodes: ComputedDatum<SwarmDatum>[];
  stats?: StatData;
  x?: number;
  color?: string;
  width?: number;
};

export type NodeGroupRecord = Record<string, NodeGroup>;

export type SwarmData = SwarmDatum[];

export type ScatterPoint = {
  id: number;
  x: number;
  y: number;
  z?: number;
};

export type ScatterGroup = {
  id: string;
  data: ScatterPoint[];
};

export type ScatterData = ScatterGroup[];
