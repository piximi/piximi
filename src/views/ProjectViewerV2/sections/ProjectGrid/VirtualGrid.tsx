import type { RefObject } from "react";

import { FixedSizeGrid as Grid } from "react-window";

import { Container } from "@mui/material";

import { GRID_GAP } from "utils/constants";

import type { GridCellData } from "./gridUtils";

type VirtualGridProps<T> = {
  gridRef: RefObject<HTMLDivElement>;
  gridWidth: number;
  gridHeight: number;
  columnWidth: number;
  rowHeight: number;
  numColumns: number;
  numRows: number;
  itemData: GridCellData<T>;
  Cell: React.ComponentType<any>;
};

export const VirtualGrid = <T,>({
  gridRef,
  gridWidth,
  gridHeight,
  columnWidth,
  rowHeight,
  numColumns,
  numRows,
  itemData,
  Cell,
}: VirtualGridProps<T>) => (
  <Container
    sx={{
      paddingBottom: `${GRID_GAP}px`,
      pl: `${GRID_GAP}px`,
      pr: 0,
      height: "100%",
    }}
    maxWidth={false}
    ref={gridRef}
  >
    {gridWidth > 0 && gridHeight > 0 && (
      <Grid
        useIsScrolling
        columnWidth={columnWidth}
        columnCount={numColumns}
        height={gridHeight}
        rowCount={numRows}
        rowHeight={rowHeight}
        width={gridWidth}
        itemData={itemData}
        style={{ width: gridWidth }}
      >
        {Cell}
      </Grid>
    )}
  </Container>
);
