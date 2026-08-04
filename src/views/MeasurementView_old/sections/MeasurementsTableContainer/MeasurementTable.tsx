import { useMemo } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import {
  DisplayTableRow,
  MeasurementDisplayTable,
} from "store/measurements/types";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

type ExtendedDisplayTableRow = {
  id: number;
  measurement: string;
} & DisplayTableRow;

const format = (value: string | number) => {
  if (typeof value === "number") {
    return value.toFixed(2);
  } else {
    return value;
  }
};
const columns: GridColDef[] = [
  {
    field: "measurement",
    headerName: "Measurement",
    headerAlign: "center",
    minWidth: 150,
    editable: false,
    flex: 1,
  },
  {
    field: "split",
    headerName: "Split",
    headerAlign: "center",
    minWidth: 200,
    editable: false,
    flex: 1,
  },
  {
    field: "mean",
    headerName: "Mean",
    headerAlign: "center",
    minWidth: 100,
    align: "right",
    editable: false,
    valueFormatter: format,
    flex: 1,
  },
  {
    field: "median",
    headerName: "Median",
    headerAlign: "center",
    minWidth: 100,
    align: "right",
    editable: false,
    valueFormatter: format,
    flex: 1,
  },
  {
    field: "std",
    headerName: "Standard Deviation",
    headerAlign: "center",
    minWidth: 160,
    align: "right",
    editable: false,
    valueFormatter: format,
    flex: 1,
  },
];

export const MeasurementTable = ({
  tableMeasurements,
}: {
  tableMeasurements: Record<string, MeasurementDisplayTable>;
}) => {
  const measurementRows = useMemo(() => {
    return Object.entries(tableMeasurements).reduce(
      (measurementRows: ExtendedDisplayTableRow[], measurementType, idx) => {
        const type = measurementType[0].split(" ");
        const typeSplitString = type.join(" ");
        const idx1 = idx;
        measurementType[1].splits.forEach((row, idx) => {
          measurementRows.push({
            id: +`${idx1}${idx}`,
            measurement: typeSplitString,
            ...row,
          });
        });
        return measurementRows;
      },
      [],
    );
  }, [tableMeasurements]);

  return (
    <DataGrid
      data-help={HelpItem.MeasurementDataTable}
      rowSpacingType="border"
      autosizeOnMount
      autosizeOptions={{ expand: true, includeHeaders: true }}
      columns={columns}
      rows={measurementRows}
      density="compact"
      sx={{ m: 1, height: "calc(100% - 16px)" }}
    />
  );
};
