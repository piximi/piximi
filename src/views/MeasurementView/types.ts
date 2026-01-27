import { ComputedDatum } from "@nivo/swarmplot";
import type { ColorSchemeId } from "@nivo/colors";
import {
  AnnotationObject,
  ComputedImageMeasurements,
  ComputedObjectMeasurements,
  DataArray,
  ImageMeasurements,
  ImageObject,
  ObjectMeasurements,
} from "store/data/types";
import { Partition } from "utils/models/enums";

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
  "x-axis"?: string;
  "y-axis"?: string;
  size?: string;
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

export type PreparedEntityData = {
  id: string;
  kind: string;
  data: number[][][][];
  encodedMask?: number[];
  decodedMask?: DataArray;
};

export type PreparedAnnotationData = {
  id: string;
  decodedMask?: DataArray;
  encodedMask: number[];
  boundingBox: [number, number, number, number];
  measurements?: ObjectMeasurements;
};

export type BaseMeasurementGroup = {
  id: string;
  name: string;
  intensityMeasurements: string[];
  splits: { category?: string[]; partition?: string[] };
  entityIds: string[];
  plots: Record<string, PlotDetail>;
  selectedPlotId: string | undefined;
};

export type ImageMeasurementGroup = BaseMeasurementGroup & {
  computedMeasurements: (keyof ComputedImageMeasurements)[];
};
export type ImageEntityMeasurementGroup = ImageMeasurementGroup & {
  entities: ImageObject[];
};

export type ObjectMeasurementGroup = BaseMeasurementGroup & {
  kind: string;
  computedMeasurements: (keyof ComputedObjectMeasurements)[];
};
export type ObjectEntityMeasurementGroup = ObjectMeasurementGroup & {
  entities: AnnotationObject[];
};

export type DisplayTableRow = {
  split: string;
  partition?: Partition;
  category?: string;
  mean: string | number;
  median: string | number;
  std: string | number;
};

export type MeasurementDisplayTable = {
  tableId: string;
  measurementId: string;
  splits: DisplayTableRow[];
};

export type GroupedMeasurementDisplayTable = {
  id: string;
  title: string;
  kind: string;
  measurements: ImageMeasurements | ObjectMeasurements;
  entitiyIds: string[];
};

export type ParsedMeasurementDatum = {
  id: string;
  kind: string;
  category: string;
  partition: Partition;
  measurements: Record<string, number>;
};

export type ParsedMeasurementData = Record<string, ParsedMeasurementDatum>;

export type PreparedEntityChannels = Record<string, number[][]>;

export type MeasurementsState = {
  imageGroups: Record<string, ImageMeasurementGroup>;
  objectGroups: Record<string, ObjectMeasurementGroup>;
  activeGroup: string | undefined;
};
