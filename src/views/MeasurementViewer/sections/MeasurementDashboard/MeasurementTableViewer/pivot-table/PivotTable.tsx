import { useMemo } from "react";

import { useSelector } from "react-redux";

import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import { HelpItem } from "help/HelpContent";

import { selectActivePivotItems } from "@MeasurementViewer/state/selectors";
import { useMeasurementTable } from "@MeasurementViewer/contexts/MeasurementTableProvider";

import {
  generatePivotColumns,
  generatePivotRows,
  generateUniqueCompositeKeys,
} from "./pivotUtils";

import type { GridColumnGroup } from "@mui/x-data-grid";
import type { GridApiCommunity } from "@mui/x-data-grid/internals";

import type { MeasurementGetter } from "./pivotUtils";

export const PivotTable = ({
  gridApiRef,
}: {
  gridApiRef: React.MutableRefObject<GridApiCommunity | null>;
}) => {
  const { rows, columns, table } = useMeasurementTable();
  const pivotItems = useSelector(selectActivePivotItems);

  // Generate composite keys based on pivot configuration
  const compositeKeys = useMemo(
    () => generateUniqueCompositeKeys(rows, pivotItems),
    [rows, pivotItems],
  );

  // Generate columns and column grouping model
  const { columns: gridColumns, columnGroupingModel } = useMemo(() => {
    return generatePivotColumns(pivotItems, compositeKeys);
  }, [pivotItems, compositeKeys]);

  // One line per selected measurement, read from the table's columns
  const gridRows = useMemo(() => {
    if (!table) return [];
    const getters: MeasurementGetter[] = columns.map(({ key, label }) => ({
      key,
      label,
      getValue: (index) => table.values[key]?.[index],
    }));
    return generatePivotRows(rows, pivotItems, getters);
  }, [table, columns, rows, pivotItems]);

  return (
    <Box
      data-id="pivotTable"
      data-doc="data-grid"
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <DataGrid
        apiRef={gridApiRef}
        data-help={HelpItem.MeasurementDataTable}
        rowSpacingType="border"
        autosizeOnMount
        autosizeOptions={{ expand: true, includeHeaders: true }}
        columns={gridColumns}
        rows={gridRows}
        columnGroupingModel={columnGroupingModel as GridColumnGroup[]}
        density="compact"
        sx={(theme) => ({
          bgcolor: theme.palette.background.paper,
          height: "100%",
          maxHeight: "100%",
          minHeight: 0,
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: "bold",
          },
          "& .MuiDataGrid-columnHeader--filledGroup": {
            backgroundColor: theme.palette.action.hover,
          },
        })}
      />
    </Box>
  );
};
