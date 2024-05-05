import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { DisplayTableColumn, DisplayTableRow } from "store/measurements/types";

export const SplitTable = ({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: DisplayTableColumn[];
  rows: DisplayTableRow[];
}) => {
  return (
    <Box sx={{ margin: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Split</TableCell>
            <TableCell align="right">Mean</TableCell>
            <TableCell align="right">Standard Deviation</TableCell>
            <TableCell align="right">Median</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            return (
              <TableRow hover tabIndex={-1} key={`${title}-${row.split}`}>
                <TableCell component="th" scope="row">
                  {row.split}
                </TableCell>
                <TableCell align="right">{format(row.mean)}</TableCell>
                <TableCell align="right">{format(row.std)}</TableCell>
                <TableCell align="right">{format(row.median)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
};

const format = (value: string | number) => {
  if (typeof value === "number") {
    return value.toFixed(2);
  } else {
    return value;
  }
};
