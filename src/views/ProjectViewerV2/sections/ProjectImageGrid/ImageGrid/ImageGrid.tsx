import { memo, useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Box, Container } from "@mui/material";
import {
  areEqual,
  FixedSizeGrid as Grid,
  GridChildComponentProps,
} from "react-window";
import memoize from "memoize-one";

import { useImageSort, useReactWindow } from "@ProjectViewer/hooks";

import { DropBox } from "components/layout";
import { ImageGridItem } from "./ProjectGridItem";

import { projectSlice } from "@ProjectViewer/state";
import {
  selectImageFilters,
  selectSelectedImageIds,
} from "@ProjectViewer/state/selectors";
import { selectTileSize } from "store/applicationSettings/selectors";

import { isFiltered } from "utils/arrayUtils";
import { DEFAULT_GRID_ITEM_WIDTH, GRID_GAP } from "utils/constants";
import { selectAllImages } from "store/dataV2/selectors";
import { ImageObject } from "store/dataV2/types";
import { UNKNOWN_IMAGE_CATEGORY_ID } from "store/data/constants";
import { Partition } from "utils/models/enums";

type MockImageObject = {
  id: string;
  name: string;
  fileName: string;
  categoryId: string;
  partition: Partition;
};
type SelectHandler = (id: string, selected: boolean) => void;
type SelectedImageIds = string[];
type CellData = {
  images: MockImageObject[];
  handleSelectImage: SelectHandler;
  selectedImageIds: SelectedImageIds;
  numColumns: number;
  scale: number;
};

const createItemData = memoize(
  (
    images: MockImageObject[],
    handleSelectImage: SelectHandler,
    selectedImageIds,
    numColumns: number,
    scale: number,
  ) => ({
    images,
    handleSelectImage,
    selectedImageIds,
    numColumns,
    scale,
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
          justifyContent: "center",
          alignItems: "center",
        }}
        data-testid={`grid-image-${image.id}`}
      >
        <Box
          sx={{
            width: DEFAULT_GRID_ITEM_WIDTH * data.scale + "px",
            height: DEFAULT_GRID_ITEM_WIDTH * data.scale + "px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            border: `solid 2px ${selected ? "red" : "transparent"}`,
            bgcolor: "blue",
          }}
          onClick={(e) => {
            e.stopPropagation();
            data.handleSelectImage(image.id, selected);
          }}
        >
          {image.id}
        </Box>
        {/* <ProjectGridItem
          key={image.id}
          image={image}
          handleClick={data.handleSelectThing}
          selected={data.selectedThingIds.includes(image.id)}
          isScrolling={isScrolling}
        /> */}
      </div>
    );
  },
  areEqual,
);

//NOTE: kind is passed as a prop and used internally instead of the kind returned
// by the active kind selector to keep from rerendering the grid items when switching tabs
export const ImageGrid = () => {
  const dispatch = useDispatch();
  const images = useMemo(
    () =>
      Array.from(
        { length: 100 },
        (_, idx) =>
          ({
            id: "" + idx,
            categoryId: UNKNOWN_IMAGE_CATEGORY_ID,
            name: `Mock Image ${idx}`,
            fileName: `mock-image-${idx}.png`,
            partition: Partition.Unassigned,
          }) as MockImageObject,
      ),
    [],
  );
  const imageFilters = useSelector(selectImageFilters);
  const selectedImageIds = useSelector(selectSelectedImageIds);
  const sortFunction = useImageSort();
  const scaleFactor = useSelector(selectTileSize);

  const gridRef = useRef<HTMLDivElement | null>(null);

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
        bgcolor: "white",
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
            scaleFactor,
          )}
          style={{ width: gridWidth }}
        >
          {Cell}
        </Grid>
      )}
    </Container>
  );
};
