import type { ReactElement } from "react";

import { TableCell, TableRow } from "@mui/material";

export const DataTableRow = ({
  rowId,
  label,
  data,
}: {
  rowId?: string;
  label: string | number | ReactElement;
  data: string | number | ReactElement;
}) => {
  return (
    <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
      <TableCell
        component="th"
        scope="row"
        sx={{ textTransform: "capitalize" }}
        key={rowId ? `${rowId}-th` : "table-row-cell-th"}
        size="small"
      >
        {label}
      </TableCell>
      <TableCell
        align="right"
        sx={{ pl: 0 }}
        key={rowId ? `${rowId}-td` : "table-row-cell-td"}
        size="small"
      >
        {data}
      </TableCell>
    </TableRow>
  );
};
