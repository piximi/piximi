import { DataArray } from "store/data/types";
import { Partition } from "utils/models/enums";

export type MeasurementsState = {
  data: MeasurementsData;
  state: MeasurementOptions;
  groups: Record<string, MeasurementGroup>;
};
export interface MeasurementOption {
  id: string;
  name: string;
  children?: string[];
  state: "on" | "off" | "loading";
  parent?: string;
  hasChannels?: boolean;
  thingType?: "Image" | "Object" | "all";
  includeCategories?: boolean;
}

export type MeasurementOptions = Record<string, MeasurementOption>;

export type MeasurementGroup = {
  id: string;
  kind: string;
  name: string;
  measurementStates: MeasurementOptions;
  splitStates: MeasurementOptions;
  thingIds: string[];
  upToDate: boolean;
};

type ThingMeasurementsDatum = {
  channelData: number[][];
  maskData?: DataArray;
  maskShape?: { width: number; height: number };
  measurements: Record<string, number>;
};

export type MeasurementsData = Record<string, ThingMeasurementsDatum>;

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
  measurements: Record<string, MeasurementDisplayTable>;
  thingIds: string[];
};

export type ParsedMeasurementDatum = {
  id: string;
  kind: string;
  category: string;
  partition: Partition;
  measurements: Record<string, number>;
};

export type ParsedMeasurementData = Record<string, ParsedMeasurementDatum>;

export type ThingData = Record<
  string,
  {
    channels: number[][];
    maskData: DataArray | undefined;
    maskShape: { width: number; height: number } | undefined;
  }
>;

export type ThingMeasurements = Record<string, Record<string, number>>;
