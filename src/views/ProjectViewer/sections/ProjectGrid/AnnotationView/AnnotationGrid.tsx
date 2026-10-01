import { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box, Typography } from "@mui/material";

import { usePreloadSrcs } from "hooks";

import { useParameterizedSelector } from "store/hooks";

import { useAnnotationSort } from "@ProjectViewer/hooks";
import { projectSlice } from "@ProjectViewer/state";
import { selectVisibleAnnotationsByKind } from "@ProjectViewer/state/reselectors";
import {
  selectFilterSelectedImages,
  selectSelectedImageIds,
} from "@ProjectViewer/state/selectors";

import { AnnotationGridItem } from "./AnnotationGridItem";
import { createGridCell, createItemData } from "../gridUtils";
import { useGridLayout } from "../useGridLayout";
import { VirtualGrid } from "../VirtualGrid";

import type { KindState } from "@ProjectViewer/state/types";

const Cell = createGridCell(AnnotationGridItem);

//NOTE: kind is passed as a prop and used internally instead of the kind returned
// by the active kind selector to keep from rerendering the grid items when switching tabs
export const AnnotationGrid = ({ kindState }: { kindState: KindState }) => {
  const dispatch = useDispatch();
  const visibleAnnotations = useParameterizedSelector(
    selectVisibleAnnotationsByKind,
    kindState.id,
  );
  const onlySelectedImages = useSelector(selectFilterSelectedImages);
  const selectedImageIds = useSelector(selectSelectedImageIds);
  const sortFunction = useAnnotationSort(kindState.sortType);

  const visibleAnns = useMemo(
    () => [...visibleAnnotations].sort(sortFunction),
    [visibleAnnotations, sortFunction],
  );

  // An empty image selection filters everything out, which would otherwise
  // render as a blank panel.
  const awaitingImageSelection =
    onlySelectedImages && selectedImageIds.length === 0;
  const {
    gridRef,
    gridWidth,
    gridHeight,
    columnWidth,
    rowHeight,
    numColumns,
    numRows,
  } = useGridLayout(visibleAnns.length);

  const windowCount = useMemo(() => {
    if (!rowHeight || !columnWidth) return 0;
    return (
      Math.round(gridHeight / rowHeight) * Math.round(gridWidth / columnWidth)
    );
  }, [gridHeight, rowHeight, gridWidth, columnWidth]);
  usePreloadSrcs(visibleAnns, windowCount);

  const handleSelectAnnotation = useCallback(
    (id: string, selected: boolean) => {
      if (!selected) {
        dispatch(
          projectSlice.actions.addSelectedAnnotations({
            kindId: kindState.id,
            ids: [id],
          }),
        );
      } else {
        dispatch(
          projectSlice.actions.removeSelectedAnnotations({
            kindId: kindState.id,
            ids: [id],
          }),
        );
      }
    },
    [dispatch],
  );

  if (awaitingImageSelection) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 4,
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          Select images in the image grid to see their annotations.
        </Typography>
      </Box>
    );
  }

  return (
    <VirtualGrid
      gridRef={gridRef}
      gridWidth={gridWidth}
      gridHeight={gridHeight}
      columnWidth={columnWidth}
      rowHeight={rowHeight}
      numColumns={numColumns}
      numRows={numRows}
      itemData={createItemData(
        visibleAnns,
        handleSelectAnnotation,
        kindState.selectedIds,
        numColumns,
      )}
      Cell={Cell}
    />
  );
};
