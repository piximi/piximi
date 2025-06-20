import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container } from "@mui/material";
import { FixedSizeGrid as Grid } from "react-window";
import memoize from "memoize-one";

import { useSortFunction } from "../../../hooks";

import { DropBox } from "components/layout";

import { projectSlice } from "store/project";
import { selectSelectedAnnotations } from "store/project/selectors";
import {
  selectActiveSelectedThingIds,
  selectFilteredAnnotationsByKind,
} from "store/project/reselectors";
import { GRID_GAP } from "utils/constants";
import { TSAnnotationObject } from "store/data/types";
import { AnnotationGridCell } from "./ProjectGridItem/AnnotationGridItem";
import { useWindowGrid } from "views/ProjectViewer/hooks/useWindowGrid";

const createItemData = memoize(
  (
    annotations: TSAnnotationObject[],
    handleSelectAnnotation: (id: string, selected: boolean) => void,
    selectedAnnotationIds: ReturnType<typeof selectActiveSelectedThingIds>,
    numColumns: number,
  ) => ({
    annotations,
    handleSelectAnnotation,
    selectedAnnotationIds,
    numColumns,
  }),
);

//NOTE: kind is passed as a prop and used internally instead of the kind returned
// by the active kind selector to keep from rerendering the grid items when switching tabs
export const AnnotationGrid = ({ kind }: { kind: string }) => {
  const dispatch = useDispatch();
  const filteredAnnotations = useSelector(selectFilteredAnnotationsByKind)(
    kind,
  );
  const selectedAnnotationIds = useSelector(selectSelectedAnnotations);
  const sortFunction = useSortFunction();

  //const [visibleThings, setVisibleThings] = useState<Things>([]);

  const sortedAnnotations = useMemo(
    () => filteredAnnotations.sort(sortFunction),
    [filteredAnnotations, sortFunction],
  );

  const {
    gridRef,
    gridWidth,
    gridHeight,
    columnWidth,
    numColumns,
    rowHeight,
    numRows,
  } = useWindowGrid(sortedAnnotations);

  const handleSelectAnnotation = useCallback(
    (id: string, selected: boolean) => {
      if (selected) {
        dispatch(projectSlice.actions.deselectAnnotations({ ids: id }));
      } else {
        dispatch(projectSlice.actions.selectAnnotations({ ids: id }));
      }
    },
    [dispatch],
  );

  useEffect(() => {
    //console.log(imageCatDict);
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
              sortedAnnotations,
              handleSelectAnnotation,
              selectedAnnotationIds,
              numColumns,
            )}
            style={{ width: gridWidth }}
          >
            {AnnotationGridCell}
          </Grid>
        )}
      </Container>
    </DropBox>
  );
};
