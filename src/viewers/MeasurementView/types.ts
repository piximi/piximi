import { ParsedMeasurementDatum } from "store/measurements/types";
import type { ColorSchemeId } from "@nivo/colors";
import { ComputedDatum } from "@nivo/swarmplot";

export type MeasurementDisplayParameters = {
  measurementPlotOptions: ChartValues;

  groupThingIds: string[];
};

export type PlotDetail = {
  id: string;
  name: string;
  chartConfig: ChartConfig;
};

export type PlotDetails = {
  selectedPlot: string;
  plots: Record<string, PlotDetail>;
};

export type AddActionProps = { type: "add" };
export type EditActionProps = { type: "edit"; id: string; name: string };
export type UpdateActionProps = {
  type: "update";
  id: string;
  chartConfig: ChartConfig;
};
export type RemoveOrSelectActionProps = {
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
  action: PlotViewActionProps
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

export type HistDatum = { value: string; count: number };
export type HistData = Array<HistDatum>;

export type SwarmDatum = {
  id: string;
  index: number;
  group: string;
  value: number;
  z?: number;
};

export type StatData = {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  lowerQuartile: number;
  upperQuartile: number;
};

export type NodeGroup = {
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
