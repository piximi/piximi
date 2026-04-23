import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";

import { useAnnotationSort } from "@ProjectViewer/hooks";

import { AnnotationGridItem } from "./AnnotationGridItem";

import { projectSlice } from "@ProjectViewer/state";

import { isFiltered } from "utils/arrayUtils";

import { selectExtendedAnnotationsByKindId } from "store/dataV2/selectors";

import { KindState } from "@ProjectViewer/state/types";
import { useParameterizedSelector } from "store/hooks";
import { createGridCell, createItemData } from "../gridUtils";
import { useGridLayout } from "../useGridLayout";
import { VirtualGrid } from "../VirtualGrid";

const Cell = createGridCell(AnnotationGridItem);

//NOTE: kind is passed as a prop and used internally instead of the kind returned
// by the active kind selector to keep from rerendering the grid items when switching tabs
export const AnnotationGrid = ({ kindState }: { kindState: KindState }) => {
  const dispatch = useDispatch();
  const annotations = useParameterizedSelector(
    selectExtendedAnnotationsByKindId,
    kindState.id,
  );
  const sortFunction = useAnnotationSort(kindState.sortType);

  const visibleAnns = useMemo(
    () =>
      annotations
        .filter((ann) => !isFiltered(ann, kindState.filters ?? {}))
        .sort(sortFunction),
    [annotations, kindState.filters, sortFunction],
  );
  const {
    gridRef,
    gridWidth,
    gridHeight,
    columnWidth,
    rowHeight,
    numColumns,
    numRows,
  } = useGridLayout(visibleAnns.length);

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
    <VirtualGrid
      gridRef={gridRef}
      gridWidth={gridWidth}
      gridHeight={gridHeight}
      columnWidth={columnWidth}
      rowHeight={rowHeight}
      numColumns={numColumns}
      numRows={numRows}
      itemData={createItemData(
        visibleAnns,
        handleSelectAnnotation,
        kindState.selectedIds,
        numColumns,
      )}
      Cell={Cell}
    />
  );
};
