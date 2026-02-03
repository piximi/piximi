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

// ============================================================================
// ENUMS
// ============================================================================

export enum ChartType {
  Histogram = "Histogram",
  Scatter = "Scatter",
  Swarm = "Swarm",
}

// ============================================================================
// CHART CONFIGURATION
// ============================================================================

export type SplitType = keyof Pick<
  ParsedMeasurementDatum,
  "category" | "partition"
>;

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
  binLabel?: boolean;
  swarmGroup?: SplitType;
  swarmStatistics?: boolean;
};

// ============================================================================
// PLOT MANAGEMENT
// ============================================================================

export type PlotDetail = {
  id: string;
  name: string;
  chartConfig: ChartConfig;
};

export type PlotDetails = {
  selectedPlot: string;
  plots: Record<string, PlotDetail>;
};

// --- Plot View Actions ---

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

// ============================================================================
// CHART DATA TYPES
// ============================================================================

// --- Scatter Plot ---

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

// --- Swarm Plot ---

export type SwarmDatum = {
  id: string;
  index: number;
  group: string;
  value: number;
  z?: number;
};

export type SwarmData = SwarmDatum[];

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

// ============================================================================
// MEASUREMENT GROUPS
// ============================================================================

export type BaseMeasurementGroup = {
  id: string;
  name: string;
  intensityMeasurements: string[];
  splits: {
    category?: string[];
    partition?: string[];
    imageId?: string[];
    timepoint?: string[];
    tracklet?: string[];
  };
  pivotItems?: PivotItem[];
  entityIds: string[];
  plots: Record<string, PlotDetail>;
  selectedPlotId: string | undefined;
};

// --- Image Measurement Groups ---

export type ImageMeasurementGroup = BaseMeasurementGroup & {
  computedMeasurements: (keyof ComputedImageMeasurements)[];
};

export type ImageEntityMeasurementGroup = ImageMeasurementGroup & {
  entities: ImageObject[];
};

// --- Object (Annotation) Measurement Groups ---

export type ObjectMeasurementGroup = BaseMeasurementGroup & {
  kind: string;
  computedMeasurements: (keyof ComputedObjectMeasurements)[];
};

export type ObjectEntityMeasurementGroup = ObjectMeasurementGroup & {
  entities: AnnotationObject[];
};

// ============================================================================
// PARSED & PREPARED DATA
// ============================================================================

export type ParsedMeasurementDatum = {
  id: string;
  kind: string;
  category: string;
  partition: Partition;
  measurements: Record<string, number>;
};

export type ParsedMeasurementData = Record<string, ParsedMeasurementDatum>;

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

export type PreparedEntityChannels = Record<string, number[][]>;

// ============================================================================
// DISPLAY & TABLE TYPES
// ============================================================================

export type DisplayTableRow = {
  split: string;
  partition?: Partition;
  category?: string;
  image?: string;
  track?: string;
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

export type MeasurementDisplayParameters = {
  measurementPlotOptions: ChartValues;
  groupThingIds: string[];
};

export type DimensionValue = {
  id: string;
  label: string;
  parentId: string;
};

// A main dimension (Category, Partition, etc.)
export type Dimension = {
  id: string;
  label: string;
  values: DimensionValue[];
};

// An item in the pivot zone (either a main dimension or a specific value)
export type PivotItem = {
  id: string;
  label: string;
  parentId?: string; // If this is a specific value, this is the parent dimension id
  isMainDimension: boolean;
};

// ============================================================================
// STATE
// ============================================================================

export type MeasurementsState = {
  imageGroups: Record<string, ImageMeasurementGroup>;
  objectGroups: Record<string, ObjectMeasurementGroup>;
  activeGroup: string | undefined;
};
