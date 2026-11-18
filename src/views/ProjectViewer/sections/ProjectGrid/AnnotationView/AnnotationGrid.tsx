import { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box, Typography } from "@mui/material";

import { useBackend } from "core/backend";
import { useQueryWindow } from "core/backend/query";

import { usePreloadSrcs } from "hooks";

import { useAnnotationGridQuery, useDataRevision } from "@ProjectViewer/hooks";
import { projectSlice } from "@ProjectViewer/state";
import {
  selectFilterSelectedImages,
  selectSelectedImageIds,
} from "@ProjectViewer/state/selectors";

import { AnnotationGridItem } from "./AnnotationGridItem";
import { extendAnnotation } from "../gridItems";
import { createGridCell } from "../gridUtils";
import { useGridItems } from "../useGridItems";
import { useGridLayout } from "../useGridLayout";
import { VirtualGrid } from "../VirtualGrid";

import type { AnnotationRecord, PageRequest } from "core/backend";

import type { KindState } from "@ProjectViewer/state/types";

import type { GridCellData } from "../gridUtils";

const Cell = createGridCell(
  AnnotationGridItem,
  (record: AnnotationRecord) => record.annotation.id,
);

//NOTE: kind is passed as a prop and used internally instead of the kind returned
// by the active kind selector to keep from rerendering the grid items when switching tabs
export const AnnotationGrid = ({ kindState }: { kindState: KindState }) => {
  const dispatch = useDispatch();
  const backend = useBackend();
  const revision = useDataRevision();
  const { query, sort, key } = useAnnotationGridQuery(kindState);
  const onlySelectedImages = useSelector(selectFilterSelectedImages);
  const selectedImageIds = useSelector(selectSelectedImageIds);

  const source = useMemo(
    () => ({
      key,
      fetch: (page: PageRequest) =>
        backend.query.annotations(query, page, sort),
    }),
    [backend, key, query, sort],
  );
  const window = useQueryWindow(source, revision);

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
  } = useGridLayout(window.total);

  const { annotationLookups } = useGridItems();
  const inView = useMemo(
    () =>
      window.loaded.flatMap(
        (record) => extendAnnotation(record, annotationLookups) ?? [],
      ),
    [window.loaded, annotationLookups],
  );
  usePreloadSrcs(inView);

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
    [dispatch, kindState.id],
  );

  const itemData = useMemo(
    (): GridCellData<AnnotationRecord> => ({
      count: window.total,
      getItem: window.get,
      handleSelect: handleSelectAnnotation,
      selectedIds: new Set(kindState.selectedIds),
      numColumns,
    }),
    [
      window.total,
      window.get,
      handleSelectAnnotation,
      kindState.selectedIds,
      numColumns,
    ],
  );
  const { setRange } = window;
  const handleItemsRendered = useCallback(
    ({ start, end }: { start: number; end: number }) => setRange(start, end),
    [setRange],
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
        <Typography
          variant="body2"
          align="center"
          sx={{
            color: "text.secondary",
          }}
        >
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
      itemData={itemData}
      Cell={Cell}
      onItemsRendered={handleItemsRendered}
    />
  );
};
