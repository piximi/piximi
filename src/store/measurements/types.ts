import { Tensor2D } from "@tensorflow/tfjs";
export interface SelectionTreeItem {
  id: string;
  name: string;
  children?: string[];
  state: "on" | "off" | "loading";
  parent?: string;
}

export type SelectionTreeItems = Record<string, SelectionTreeItem>;

export type MeasurementTable = {
  id: string;
  kind: string;
  name: string;
  measurementsStatus: SelectionTreeItems;
  splitStatus: SelectionTreeItems;
};

export type MeasurementsData = Record<
  string,
  { channelData: Tensor2D; measurements: Record<string, number> }
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
