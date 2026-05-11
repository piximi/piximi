import { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useImageSort } from "@ProjectViewer/hooks";
import { projectSlice } from "@ProjectViewer/state";
import {
  selectImageSortType,
  selectSelectedImageIds,
} from "@ProjectViewer/state/selectors";
import { selectVisibleItems } from "@ProjectViewer/state/reselectors";
import type { ExtendedImageObject } from "store/dataV2/types";

import { ImageGridItem } from "./ImageGridItem";
import { createGridCell, createItemData } from "../gridUtils";
import { useGridLayout } from "../useGridLayout";
import { VirtualGrid } from "../VirtualGrid";

const Cell = createGridCell(ImageGridItem);

export const ImageGrid = () => {
  const dispatch = useDispatch();
  const visibleImages = useSelector(
    selectVisibleItems,
  ) as ExtendedImageObject[];
  const selectedImageIds = useSelector(selectSelectedImageIds);
  const sortType = useSelector(selectImageSortType);
  const sortFunction = useImageSort(sortType);

  const sortedImages = useMemo(
    () => [...visibleImages].sort(sortFunction),
    [visibleImages, sortFunction],
  );
  const {
    gridRef,
    gridWidth,
    gridHeight,
    columnWidth,
    rowHeight,
    numColumns,
    numRows,
  } = useGridLayout(sortedImages.length);

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
        sortedImages,
        handleSelectImage,
        selectedImageIds,
        numColumns,
      )}
      Cell={Cell}
    />
  );
};
