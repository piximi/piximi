import { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useImageSort } from "@ProjectViewer/hooks";
import { projectSlice } from "@ProjectViewer/state";
import {
  selectImageFilters,
  selectSelectedImageIds,
} from "@ProjectViewer/state/selectors";
import { selectRepresentativeImages } from "store/dataV2/selectors";

import { isFiltered } from "utils/arrayUtils";

import { ImageGridItem } from "./ImageGridItem";
import { createGridCell, createItemData } from "../gridUtils";
import { useGridLayout } from "../useGridLayout";
import { VirtualGrid } from "../VirtualGrid";

const Cell = createGridCell(ImageGridItem);

export const ImageGrid = () => {
  const dispatch = useDispatch();
  const images = useSelector(selectRepresentativeImages);
  const imageFilters = useSelector(selectImageFilters);
  const selectedImageIds = useSelector(selectSelectedImageIds);
  const sortFunction = useImageSort();

  const visibleImages = useMemo(
    () =>
      images
        .filter((image) => !isFiltered(image, imageFilters ?? {}))
        .sort(sortFunction),
    [images, imageFilters, sortFunction],
  );
  const {
    gridRef,
    gridWidth,
    gridHeight,
    columnWidth,
    rowHeight,
    numColumns,
    numRows,
  } = useGridLayout(visibleImages.length);

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
        visibleImages,
        handleSelectImage,
        selectedImageIds,
        numColumns,
      )}
      Cell={Cell}
    />
  );
};
