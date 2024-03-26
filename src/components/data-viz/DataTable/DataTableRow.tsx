import React, { ReactElement } from "react";
import { TableCell, TableCellProps, TableRow } from "@mui/material";

export const DataTableRow = ({
  rowId,
  rowData,
}: {
  rowId?: string;
  rowData: Array<string | number | ReactElement>;
}) => {
  return (
    <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
      {rowData.map((cellData, idx) => {
        const props = (
          idx === 0
            ? {
                component: "th",
                scope: "row",
                sx: { textTransform: "capitalize" },
              }
            : { align: "right", sx: { pl: 0 } }
        ) as Partial<TableCellProps>;
        return (
          <TableCell
            {...props}
            key={rowId ? rowId + `-cell-${idx}` : `table-row-cell-${idx}`}
            size="small"
          >
            {cellData}
          </TableCell>
        );
      })}
    </TableRow>
  );
};
