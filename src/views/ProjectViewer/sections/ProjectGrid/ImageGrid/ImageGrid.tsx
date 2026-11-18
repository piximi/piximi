import { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useBackend } from "core/backend";
import { useQueryWindow } from "core/backend/query";

import { usePreloadSrcs } from "hooks";

import { useDataRevision, useImageGridQuery } from "@ProjectViewer/hooks";
import { projectSlice } from "@ProjectViewer/state";
import { selectSelectedImageIds } from "@ProjectViewer/state/selectors";

import { ImageGridItem } from "./ImageGridItem";
import { extendImage } from "../gridItems";
import { createGridCell } from "../gridUtils";
import { useGridItems } from "../useGridItems";
import { useGridLayout } from "../useGridLayout";
import { VirtualGrid } from "../VirtualGrid";

import type { ImageRecord, PageRequest } from "core/backend";

import type { GridCellData } from "../gridUtils";

const Cell = createGridCell(
  ImageGridItem,
  (record: ImageRecord) => record.image.id,
);

export const ImageGrid = () => {
  const dispatch = useDispatch();
  const backend = useBackend();
  const revision = useDataRevision();
  const { query, sort, key } = useImageGridQuery();
  const selectedImageIds = useSelector(selectSelectedImageIds);

  const source = useMemo(
    () => ({
      key,
      fetch: (page: PageRequest) => backend.query.images(query, page, sort),
    }),
    [backend, key, query, sort],
  );
  const window = useQueryWindow(source, revision);
  const {
    gridRef,
    gridWidth,
    gridHeight,
    columnWidth,
    rowHeight,
    numColumns,
    numRows,
  } = useGridLayout(window.total);

  const handleSelectImage = useCallback(
    (id: string, selected: boolean) => {
      if (!selected) {
        dispatch(projectSlice.actions.addSelectedImages([id]));
      } else {
        dispatch(projectSlice.actions.removeSelectedImages([id]));
      }
    },
    [dispatch],
  );

  const { lookups } = useGridItems();
  const inView = useMemo(
    () => window.loaded.flatMap((record) => extendImage(record, lookups) ?? []),
    [window.loaded, lookups],
  );
  usePreloadSrcs(inView);

  const itemData = useMemo(
    (): GridCellData<ImageRecord> => ({
      count: window.total,
      getItem: window.get,
      handleSelect: handleSelectImage,
      selectedIds: new Set(selectedImageIds),
      numColumns,
    }),
    [window.total, window.get, handleSelectImage, selectedImageIds, numColumns],
  );
  const { setRange } = window;
  const handleItemsRendered = useCallback(
    ({ start, end }: { start: number; end: number }) => setRange(start, end),
    [setRange],
  );

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
