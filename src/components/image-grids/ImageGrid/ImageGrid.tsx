import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container } from "@mui/material";
import {
  areEqual,
  FixedSizeGrid as Grid,
  GridChildComponentProps,
} from "react-window";
import memoize from "memoize-one";

import { projectSlice } from "store/project";
import { selectThingsOfKind } from "store/data";
import { ProjectGridItem } from "../ProjectGridItem";
import { useSortFunction } from "hooks";
import { DropBox } from "components/styled-components/DropBox/DropBox";
import { selectThingFilters } from "store/project/selectors";
import { isFiltered } from "utils/common/helpers";
import { selectActiveSelectedThingIds } from "store/project/reselectors";
import { selectTileSize } from "store/applicationSettings/selectors";

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
      <div style={style}>
        <ProjectGridItem
          key={thing.id}
          thing={thing}
          handleClick={data.handleSelectThing}
          selected={data.selectedThingIds.includes(thing.id)}
          placeHolder={isScrolling}
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
        const numVisible = visibleThings.length;

        const _gridContainerWidth = gridRef.current.offsetWidth;
        const _gridContainerHeight = gridRef.current.offsetHeight;

        const _columnWidth = 220 * scaleFactor + 18;
        const _rowHeight = _columnWidth;
        const _maxNumColumns = Math.floor(_gridContainerWidth / _columnWidth);
        const _gridWidth = _maxNumColumns * _columnWidth;
        const _numColumns =
          numVisible > _maxNumColumns ? _maxNumColumns : numVisible;
        const _numVirtualRows = Math.ceil(numVisible / _numColumns);
        const _gridHeight = _gridContainerHeight;

        setGridWidth(_gridWidth);
        setGridHeight(_gridHeight);
        setColumnWidth(_columnWidth);
        setRowHeight(_rowHeight);
        setNumColumns(_numColumns);
        setNumRows(_numVirtualRows);
      }
    };
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [scaleFactor, visibleThings.length]);

  //const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();

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
      <>
        <Container
          sx={(theme) => ({
            paddingBottom: theme.spacing(8),
            height: "100%",
            overflowY: "scroll",
          })}
          maxWidth={false}
          ref={gridRef}
        >
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
        </Container>
      </>
    </DropBox>
  );
};
