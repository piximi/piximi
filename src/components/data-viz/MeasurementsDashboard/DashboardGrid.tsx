import { Box, Stack } from "@mui/material";
import React, { useEffect, useState } from "react";

export const DashboardGrid = ({
  numColumns,
  children,
}: {
  numColumns: number;
  children: React.ReactNode[];
}) => {
  const [nodeColumns, setNodeColumns] = useState<React.ReactNode[][]>([]);

  useEffect(() => {
    const columns: React.ReactNode[][] = [];
    for (let i = 0; i < numColumns; i++) {
      columns.push([]);
    }
    let i = 0;
    children.forEach((child) => {
      columns[i].push(child);
      if (++i === numColumns) {
        i = 0;
      }
    });
    setNodeColumns(columns);
  }, [numColumns, children]);
  return (
    <Box display="flex" flexDirection="row" width="100%">
      {nodeColumns.map((column) => {
        return (
          <Stack width={100 / numColumns + "%"}>
            {column.map((child) => {
              return child;
            })}
          </Stack>
        );
      })}
    </Box>
  );
};
