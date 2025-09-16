import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container } from "@mui/material";
import { FixedSizeGrid as Grid } from "react-window";
import memoize from "memoize-one";

import { useSortFunction } from "views/ProjectViewer/hooks";

import { DropBox } from "components/layout";

import { projectSlice } from "store/project";

import { GRID_GAP } from "utils/constants";
import { GeneralizedKindItem } from "store/data/types";
import { useWindowGrid } from "views/ProjectViewer/hooks/useWindowGrid";
import {
  selectActiveFilteredKindItems,
  selectActiveFilteresSelectedKindItemIds,
} from "store/project/reselectors";
import { KindItemGridCell } from "./KindItemGridCell";

const createItemData = memoize(
  (
    items: GeneralizedKindItem[],
    handleSelectItem: (id: string, selected: boolean) => void,
    selectedItems: string[],
    numColumns: number,
  ) => ({
    items,
    handleSelectItem,
    selectedItems,
    numColumns,
  }),
);

export const KindItemGrid = () => {
  const dispatch = useDispatch();
  const activeKindItems = useSelector(selectActiveFilteredKindItems);
  const selectedItems = useSelector(selectActiveFilteresSelectedKindItemIds);
  const sortFunction = useSortFunction();

  const sortedImages = useMemo(
    () => activeKindItems.sort(sortFunction),
    [activeKindItems, sortFunction],
  );

  const {
    gridRef,
    gridWidth,
    gridHeight,
    columnWidth,
    numColumns,
    rowHeight,
    numRows,
  } = useWindowGrid(sortedImages);

  const handleSelectItem = useCallback(
    (id: string, selected: boolean) => {
      if (selected) {
        dispatch(projectSlice.actions.deselectKindItems(id));
      } else {
        dispatch(projectSlice.actions.selectKindItems(id));
      }
    },
    [dispatch],
  );

  return (
    <DropBox>
      <Container
        sx={() => ({
          paddingBottom: `${GRID_GAP}px`,
          pl: `${GRID_GAP}px`,
          pr: 0,
          "@media (min-width: 600px)": {
            pl: `${GRID_GAP}px`,
            pr: 0,
          },
          height: "100%",
        })}
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
            itemData={createItemData(
              sortedImages,
              handleSelectItem,
              selectedItems,
              numColumns,
            )}
            style={{ width: gridWidth }}
          >
            {KindItemGridCell}
          </Grid>
        )}
      </Container>
    </DropBox>
  );
};
