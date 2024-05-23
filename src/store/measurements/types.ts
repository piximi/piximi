import { DataArray } from "utils/file-io/types";

export interface SelectionTreeItem {
  id: string;
  name: string;
  children?: string[];
  state: "on" | "off" | "loading";
  parent?: string;
}
export interface MeasurementOption extends SelectionTreeItem {
  hasChannels?: boolean;
  thingType?: "Image" | "Object" | "all";
  includeCategories?: boolean;
}

export type SelectionTreeItems = Record<string, SelectionTreeItem>;
export type MeasurementOptions = Record<string, MeasurementOption>;

export type MeasurementTable = {
  id: string;
  kind: string;
  name: string;
  measurementsStatus: SelectionTreeItems;
  splitStatus: SelectionTreeItems;
  thingIds: string[];
};

export type MeasurementsData = Record<
  string,
  {
    channelData: number[][];
    maskData?: DataArray;
    maskShape?: { width: number; height: number };
    measurements: Record<string, number>;
  }
>;

export type MeasurementsState = {
  measurementData: MeasurementsData;
  measurementsStatus: SelectionTreeItems;
  tables: Record<string, MeasurementTable>;
};

export interface DisplayTableColumn {
  id: string;
  label: string;
  minWidth?: number;
  align?: "right";
  format?: (value: number) => string;
}

export type DisplayTableRow = Record<string, string | number>;

export type MeasurementDisplayTable = {
  title: string;
  columns: DisplayTableColumn[];
  rows: DisplayTableRow[];
};

export type GroupedMeasurementDisplayTable = {
  id: string;
  title: string;
  measurements: Record<string, MeasurementDisplayTable>;
};
