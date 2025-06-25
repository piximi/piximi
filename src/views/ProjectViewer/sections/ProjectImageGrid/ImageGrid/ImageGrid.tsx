import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container } from "@mui/material";
import { FixedSizeGrid as Grid } from "react-window";
import memoize from "memoize-one";

import { useSortFunction } from "../../../hooks";

import { DropBox } from "components/layout";

import { projectSlice } from "store/project";
import { selectSelectedImages } from "store/project/selectors";

import { GRID_GAP } from "utils/constants";
import { FullTimepointImage } from "store/data/types";
import { useWindowGrid } from "views/ProjectViewer/hooks/useWindowGrid";
import { ImageGridCell } from "./ProjectGridItem/ImageGridItem";
import { selectFilteredGridImages } from "store/project/reselectors";

const createItemData = memoize(
  (
    images: FullTimepointImage[],
    handleSelectImage: (
      id: string,
      timepoint: number,
      selected: boolean,
    ) => void,
    selectedImages: ReturnType<typeof selectSelectedImages>,
    numColumns: number,
  ) => ({
    images,
    handleSelectImage,
    selectedImages,
    numColumns,
  }),
);

//NOTE: kind is passed as a prop and used internally instead of the kind returned
// by the active kind selector to keep from rerendering the grid items when switching tabs
export const ImageGrid = () => {
  const dispatch = useDispatch();
  const filteredImages = useSelector(selectFilteredGridImages);
  const selectedImages = useSelector(selectSelectedImages);
  const sortFunction = useSortFunction();

  //const [visibleThings, setVisibleThings] = useState<Things>([]);

  const sortedImages = useMemo(
    () => filteredImages.sort(sortFunction) as FullTimepointImage[],
    [filteredImages, sortFunction],
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

  const handleSelectImage = useCallback(
    (id: string, timepoint: number, selected: boolean) => {
      if (selected) {
        dispatch(
          projectSlice.actions.deselectImages({ selection: { id, timepoint } }),
        );
      } else {
        dispatch(
          projectSlice.actions.selectImages({ selection: { id, timepoint } }),
        );
      }
    },
    [dispatch],
  );

  useEffect(() => {
    // console.log(images);
    // console.log(imageCatDict);
  });
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
              handleSelectImage,
              selectedImages,
              numColumns,
            )}
            style={{ width: gridWidth }}
          >
            {ImageGridCell}
          </Grid>
        )}
      </Container>
    </DropBox>
  );
};
