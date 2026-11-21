import type { ComputedDatum } from "@nivo/swarmplot";
import type { ColorSchemeId } from "@nivo/colors";

import type { BBox, ChannelFeature, ObjectFeature } from "core/entities";
import type { Partition } from "core/dl/enums";

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

// ============================================================================
// CHART DATA TYPES
// ============================================================================

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
  };
  pivotItems?: PivotItem[];
  plots: Record<string, PlotDetail>;
  selectedPlotId: string | undefined;
};

// --- Image Measurement Groups ---

export type ImageMeasurementGroup = BaseMeasurementGroup & {
  featureMeasurements: ChannelFeature[];
};

// --- Object (Annotation) Measurement Groups ---

export type ObjectMeasurementGroup = BaseMeasurementGroup & {
  kind: string;
  featureMeasurements: ObjectFeature[];
};

// ============================================================================
// TABLE ROWS
// ============================================================================

/*
 * One entity of the active group's measurement table, as the backend
 * answered it; the value columns are indexed by `index`.
 */
export type MeasurementRow = {
  id: string;
  index: number;
  name: string;
  categoryId: string;
  categoryName: string;
  partition: Partition;
  imageId: string;
  imageName: string;
  timepoint: number;
  /* Objects only. */
  boundingBox?: BBox;
};

/* A selected measurement: the label the group stores and the backend's column key. */
export type MeasurementColumnRef = { label: string; key: string };

// ============================================================================
// PARSED & PREPARED DATA
// ============================================================================

type ParsedMeasurementDatum = {
  id: string;
  kind: string;
  category: string;
  partition: Partition;
  timepoint: number;
  preview: string;
  measurements: Record<string, number>;
};

export type ParsedMeasurementData = Record<string, ParsedMeasurementDatum>;

// ============================================================================
// DISPLAY & TABLE TYPES
// ============================================================================

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
