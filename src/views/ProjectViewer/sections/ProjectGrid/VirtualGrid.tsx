import { useLayoutEffect, useRef, type RefObject } from "react";

import { FixedSizeGrid as Grid } from "react-window";

import { Container } from "@mui/material";

import { GRID_GAP } from "utils/constants";

import type { GridCellData } from "./gridUtils";

type VirtualGridProps<T> = {
  gridRef: RefObject<HTMLDivElement | null>;
  gridWidth: number;
  gridHeight: number;
  columnWidth: number;
  rowHeight: number;
  numColumns: number;
  numRows: number;
  itemData: GridCellData<T>;
  Cell: React.ComponentType<any>;
  /* Item indices `[start, end)` in or near view, as they change. */
  onItemsRendered?: (range: { start: number; end: number }) => void;
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
  onItemsRendered,
}: VirtualGridProps<T>) => {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const prevGridHeight = useRef(gridHeight);

  // react-window holds scrollTop constant when its height shrinks, which pins the
  // top edge and pushes the last row out of view. Re-pin the bottom instead.
  useLayoutEffect(() => {
    const outer = outerRef.current;
    const prevHeight = prevGridHeight.current;
    prevGridHeight.current = gridHeight;

    if (!outer || gridHeight <= 0 || gridHeight >= prevHeight) return;

    const wasAtBottom = outer.scrollTop >= outer.scrollHeight - prevHeight - 1;

    if (wasAtBottom) {
      outer.scrollTop = outer.scrollHeight - outer.clientHeight;
    }
  }, [gridHeight]);

  return (
    <Container
      sx={{
        paddingBottom: `${GRID_GAP}px`,
        pl: `${GRID_GAP}px`,
        pr: 0,
        height: "100%",
        overflow: "hidden",
      }}
      maxWidth={false}
      ref={gridRef}
    >
      {gridWidth > 0 && gridHeight > 0 && (
        <Grid
          useIsScrolling
          outerRef={outerRef}
          columnWidth={columnWidth}
          columnCount={numColumns}
          height={gridHeight}
          rowCount={numRows}
          rowHeight={rowHeight}
          width={gridWidth}
          itemData={itemData}
          style={{ width: gridWidth }}
          onItemsRendered={
            onItemsRendered &&
            (({ overscanRowStartIndex, overscanRowStopIndex }) =>
              onItemsRendered({
                start: overscanRowStartIndex * numColumns,
                end: (overscanRowStopIndex + 1) * numColumns,
              }))
          }
        >
          {Cell}
        </Grid>
      )}
    </Container>
  );
};
