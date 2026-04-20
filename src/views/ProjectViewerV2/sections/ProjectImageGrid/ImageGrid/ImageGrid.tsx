import { memo, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container } from "@mui/material";
import {
  areEqual,
  FixedSizeGrid as Grid,
  GridChildComponentProps,
} from "react-window";
import memoize from "memoize-one";

import { useImageSort, useReactWindow } from "@ProjectViewer/hooks";

import { ImageGridItem } from "./ProjectGridItem";

import { projectSlice } from "@ProjectViewer/state";
import {
  selectImageFilters,
  selectSelectedImageIds,
} from "@ProjectViewer/state/selectors";
import { selectTileSize } from "store/applicationSettings/selectors";

import { isFiltered } from "utils/arrayUtils";
import { GRID_GAP } from "utils/constants";
import { selectRepresentativeImages } from "store/dataV2/selectors";
import { ExtendedImageObject } from "store/dataV2/types";

type SelectHandler = (id: string, selected: boolean) => void;
type SelectedImageIds = string[];
type CellData = {
  images: ExtendedImageObject[];
  handleSelectImage: SelectHandler;
  selectedImageIds: SelectedImageIds;
  numColumns: number;
};

const createItemData = memoize(
  (
    images: ExtendedImageObject[],
    handleSelectImage: SelectHandler,
    selectedImageIds,
    numColumns: number,
  ) => ({
    images,
    handleSelectImage,
    selectedImageIds,
    numColumns,
  }),
);

const Cell = memo(
  ({
    columnIndex,
    rowIndex,
    style,
    isScrolling,
    data,
  }: GridChildComponentProps<CellData>) => {
    const imageIdx = rowIndex * data.numColumns + columnIndex;
    // grid is fixed number of rows x number of columns
    // so there will always be numRows x numCols cells in the grid
    // unless images.length is exactly numRows x numCols
    // there will be empty cells in the grid
    if (imageIdx >= data.images.length) return <></>;

    const image = data.images[imageIdx];
    const selected = data.selectedImageIds.includes(image.id);

    return (
      <div
        style={{
          ...style,
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
        data-testid={`grid-image-${image.id}`}
      >
        <ImageGridItem
          key={image.id}
          image={image}
          handleClick={data.handleSelectImage}
          selected={selected}
          isScrolling={isScrolling}
        />
      </div>
    );
  },
  areEqual,
);

//NOTE: kind is passed as a prop and used internally instead of the kind returned
// by the active kind selector to keep from rerendering the grid items when switching tabs
export const ImageGrid = () => {
  const dispatch = useDispatch();
  const images = useSelector(selectRepresentativeImages);
  const imageFilters = useSelector(selectImageFilters);
  const selectedImageIds = useSelector(selectSelectedImageIds);
  const sortFunction = useImageSort();
  const scaleFactor = useSelector(selectTileSize);

  const gridRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    gridRef.current?.style.setProperty("--item-size", `${220 * scaleFactor}px`);
  }, [scaleFactor]);

  const visibleThings = useMemo(
    () =>
      images
        .filter((image) => !isFiltered(image, imageFilters ?? {}))
        .sort(sortFunction),
    [images, imageFilters, sortFunction],
  );
  const { gridWidth, gridHeight, columnWidth, rowHeight, numColumns, numRows } =
    useReactWindow(visibleThings.length, gridRef, scaleFactor);

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
    <Container
      sx={() => ({
        paddingBottom: `${GRID_GAP}px`,
        pl: `${GRID_GAP}px`,
        pr: 0,
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
            visibleThings,
            handleSelectImage,
            selectedImageIds,
            numColumns,
          )}
          style={{ width: gridWidth }}
        >
          {Cell}
        </Grid>
      )}
    </Container>
  );
};
