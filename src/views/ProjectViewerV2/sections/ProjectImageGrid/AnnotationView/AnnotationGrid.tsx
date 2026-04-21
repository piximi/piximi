import { memo, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container } from "@mui/material";
import {
  areEqual,
  FixedSizeGrid as Grid,
  GridChildComponentProps,
} from "react-window";
import memoize from "memoize-one";

import { useAnnotationSort, useReactWindow } from "@ProjectViewer/hooks";

import { AnnotationGridItem } from "./AnnotationGridItem";

import { projectSlice } from "@ProjectViewer/state";
import { selectSelectedImageIds } from "@ProjectViewer/state/selectors";
import { selectTileSize } from "store/applicationSettings/selectors";

import { isFiltered } from "utils/arrayUtils";
import { GRID_GAP } from "utils/constants";
import { selectGridAnnotationsByKindId } from "store/dataV2/selectors";
import { ExtendedAnnotationObject } from "store/dataV2/types";
import { KindState } from "@ProjectViewer/state/types";
import { useParameterizedSelector } from "store/hooks";

type SelectHandler = (id: string, selected: boolean) => void;
type SelectedImageIds = string[];
type CellData = {
  annotations: ExtendedAnnotationObject[];
  handleSelectImage: SelectHandler;
  selectedImageIds: SelectedImageIds;
  numColumns: number;
};

const createItemData = memoize(
  (
    annotations: ExtendedAnnotationObject[],
    handleSelectImage: SelectHandler,
    selectedImageIds,
    numColumns: number,
  ) => ({
    annotations,
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
    const annotationIdx = rowIndex * data.numColumns + columnIndex;
    // grid is fixed number of rows x number of columns
    // so there will always be numRows x numCols cells in the grid
    // unless images.length is exactly numRows x numCols
    // there will be empty cells in the grid
    if (annotationIdx >= data.annotations.length) return <></>;

    const annotation = data.annotations[annotationIdx];
    const selected = data.selectedImageIds.includes(annotation.id);

    return (
      <div
        style={{
          ...style,
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
        data-testid={`grid-image-${annotation.id}`}
      >
        <AnnotationGridItem
          key={annotation.id}
          annotation={annotation}
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
export const AnnotationGrid = ({ kindState }: { kindState: KindState }) => {
  const dispatch = useDispatch();
  const annotations = useParameterizedSelector(
    selectGridAnnotationsByKindId,
    kindState.id,
  );
  const selectedImageIds = useSelector(selectSelectedImageIds);
  const sortFunction = useAnnotationSort(kindState.sortType);
  const scaleFactor = useSelector(selectTileSize);

  const gridRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    gridRef.current?.style.setProperty("--item-size", `${220 * scaleFactor}px`);
  }, [scaleFactor]);

  const visibleAnns = useMemo(
    () =>
      annotations
        .filter((ann) => !isFiltered(ann, kindState.filters ?? {}))
        .sort(sortFunction),
    [annotations, kindState.filters, sortFunction],
  );
  const { gridWidth, gridHeight, columnWidth, rowHeight, numColumns, numRows } =
    useReactWindow(visibleAnns.length, gridRef, scaleFactor);

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
            visibleAnns,
            handleSelectAnnotation,
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
