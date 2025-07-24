import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container } from "@mui/material";
import {
  areEqual,
  FixedSizeGrid as Grid,
  GridChildComponentProps,
} from "react-window";
import memoize from "memoize-one";

import { useSortFunction } from "../../../hooks";

import { DropBox } from "components/layout";
import { ProjectGridItem } from "./ProjectGridItem";

import { projectSlice } from "store/project";
import { selectThingsOfKind } from "store/data";
import { selectThingFilters } from "store/project/selectors";
import { selectActiveSelectedThingIds } from "store/project/reselectors";
import { selectTileSize } from "store/applicationSettings/selectors";

import { getInnerElementWidth } from "utils/domUtils";
import { isFiltered } from "utils/arrayUtils";
import { DEFAULT_GRID_ITEM_WIDTH, GRID_GAP } from "utils/constants";

type Things = ReturnType<ReturnType<typeof selectThingsOfKind>>;
type SelectHandler = (id: string, selected: boolean) => void;
type SelectedThingIds = ReturnType<typeof selectActiveSelectedThingIds>;
type CellData = {
  things: Things;
  handleSelectThing: SelectHandler;
  selectedThingIds: SelectedThingIds;
  numColumns: number;
};

const createItemData = memoize(
  (
    things: Things,
    handleSelectThing: SelectHandler,
    selectedThingIds: SelectedThingIds,
    numColumns: number
  ) => ({
    things,
    handleSelectThing,
    selectedThingIds,
    numColumns,
  })
);

const Cell = memo(
  ({
    columnIndex,
    rowIndex,
    style,
    isScrolling,
    data,
  }: GridChildComponentProps<CellData>) => {
    const thingIdx = rowIndex * data.numColumns + columnIndex;
    // grid is fixed number of rows x number of columns
    // so there will always be numRows x numCols cells in the grid
    // unless things.length is exactly numRows x numCols
    // there will be empty cells in the grid
    if (thingIdx >= data.things.length) return <></>;

    const thing = data.things[thingIdx];

    return (
      <div style={style} data-testid={`grid-image-${thing.id}`}>
        <ProjectGridItem
          key={thing.id}
          thing={thing}
          handleClick={data.handleSelectThing}
          selected={data.selectedThingIds.includes(thing.id)}
          isScrolling={isScrolling}
        />
      </div>
    );
  },
  areEqual
);

//NOTE: kind is passed as a prop and used internally instead of the kind returned
// by the active kind selector to keep from rerendering the grid items when switching tabs
export const ImageGrid = ({ kind }: { kind: string }) => {
  const dispatch = useDispatch();
  const things = useSelector(selectThingsOfKind)(kind);
  const thingFilters = useSelector(selectThingFilters)[kind];
  const selectedThingIds = useSelector(selectActiveSelectedThingIds);
  const sortFunction = useSortFunction();
  const scaleFactor = useSelector(selectTileSize);

  const gridRef = useRef<HTMLDivElement | null>(null);

  //const [visibleThings, setVisibleThings] = useState<Things>([]);

  const [gridWidth, setGridWidth] = useState(0);
  const [gridHeight, setGridHeight] = useState(0);
  const [columnWidth, setColumnWidth] = useState(0);
  const [numColumns, setNumColumns] = useState(0);
  const [rowHeight, setRowHeight] = useState(0);
  const [numRows, setNumRows] = useState(0);

  const visibleThings = useMemo(
    () =>
      things
        .filter((thing) => !isFiltered(thing, thingFilters ?? {}))
        .sort(sortFunction),
    [things, thingFilters, sortFunction]
  );

  useEffect(() => {
    const handleResize = () => {
      if (gridRef && gridRef.current) {
        const gridContainerWidth = getInnerElementWidth(gridRef.current);
        const gridContainerHeight = gridRef.current.offsetHeight;

        setGridWidth(gridContainerWidth);
        setGridHeight(gridContainerHeight);
      }
    };
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const numVisible = visibleThings.length;

    let calculatedColumnWidth =
      DEFAULT_GRID_ITEM_WIDTH * scaleFactor + GRID_GAP;
    if (calculatedColumnWidth > gridWidth) {
      calculatedColumnWidth = gridWidth;
    }

    const maxNumColumns = Math.floor(gridWidth / calculatedColumnWidth);

    const numColumns = numVisible > maxNumColumns ? maxNumColumns : numVisible;

    const columnWidth = numColumns > 0 ? gridWidth / numColumns : 0;

    const rowHeight = numColumns > 0 ? calculatedColumnWidth : 0;

    const numVirtualRows =
      numColumns > 0 ? Math.ceil(numVisible / numColumns) : 0;

    setColumnWidth(columnWidth);
    setRowHeight(rowHeight);
    setNumColumns(numColumns);
    setNumRows(numVirtualRows);
  }, [gridWidth, gridHeight, scaleFactor, visibleThings.length]);

  const handleSelectThing = useCallback(
    (id: string, selected: boolean) => {
      if (selected) {
        dispatch(projectSlice.actions.deselectThings({ ids: id }));
      } else {
        dispatch(projectSlice.actions.selectThings({ ids: id }));
      }
    },
    [dispatch]
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
              visibleThings,
              handleSelectThing,
              selectedThingIds,
              numColumns
            )}
            style={{ width: gridWidth }}
          >
            {Cell}
          </Grid>
        )}
      </Container>
    </DropBox>
  );
};
