import type { ReactElement } from "react";

import { Box, Paper, Table, TableBody, TableContainer } from "@mui/material";

import { DataTableRow } from "./DataTableRow";

export const ItemInformationTable = ({
  title,
  data,
}: {
  title: string;
  data: Array<Array<string | number | ReactElement>>;
}) => {
  return (
    <Box maxWidth="100%">
      <TableContainer sx={{ borderRadius: "0 0 4px 4px" }} component={Paper}>
        <Table>
          <TableBody>
            {data.map((row, idx) => {
              return (
                <DataTableRow
                  key={`${title}-info-table-row-${idx}`}
                  rowId={`image-info-table-row-${idx}`}
                  label={row[0]}
                  data={row[1]}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
