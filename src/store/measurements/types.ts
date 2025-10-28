import { DataArray } from "store/data/types";
import { Partition } from "utils/models/enums";
import { IMAGE_KIND } from "store/data/constants";
import { Point } from "utils/types";

export type MeasurementsState = {
  data: MeasurementsData;
  state: MeasurementOptions;
  groups: Record<string, MeasurementGroup>;
};

export type MeasurementDataState = {
  annotationMeasurements: Record<string, AnnotationMeasurements>;
  imageMeasurements: Record<string, ImageMeasurements>;
};
export interface MeasurementOption {
  id: string;
  name: string;
  children?: string[];
  state: "on" | "off" | "loading";
  parent?: string;
  hasChannels?: boolean;
  thingType?: typeof IMAGE_KIND | "Object" | "all";
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

export type AnnotationIntensityMeasurements = {
  "intensity-total"?: Record<string, number>;
  "intensity-mean"?: Record<string, number>;
  "intensity-std"?: Record<string, number>;
  "intensity-MAD"?: Record<string, number>;
  "intensity-min"?: Record<string, number>;
  "intensity-max"?: Record<string, number>;
  "intensity-lower-quartile"?: Record<string, number>;
  "intensity-upper-quartile"?: Record<string, number>;
};
export type AnnotationObjectMeasurements = {
  "object-geometry-area"?: number;
  "object-geometry-perimeter"?: number;
  "object-geometry-extent"?: number;
  "object-geometry-bbox-area"?: number;
  "object-geometry-eqpc"?: number;
  "object-geometry-ped"?: number;
  "object-geometry-sphericity"?: number;
  "object-geometry-compactness"?: number;
  "object-geometry-com"?: Point;
};
export type AnnotationMeasurements = AnnotationIntensityMeasurements &
  AnnotationObjectMeasurements;

export type ImageMeasurements = {
  "intensity-total"?: Record<string, number>;
  "intensity-mean"?: Record<string, number>;
  "intensity-std"?: Record<string, number>;
  "intensity-MAD"?: Record<string, number>;
  "intensity-min"?: Record<string, number>;
  "intensity-max"?: Record<string, number>;
  "intensity-lower-quartile"?: Record<string, number>;
  "intensity-upper-quartile"?: Record<string, number>;
};
