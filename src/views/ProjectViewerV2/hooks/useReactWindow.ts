import { useEffect, useLayoutEffect, useState } from "react";
import { DEFAULT_GRID_ITEM_WIDTH, GRID_GAP } from "utils/constants";

export const useReactWindow = (
  numItems: number,
  gridRef: React.MutableRefObject<HTMLDivElement | null>,
  scaleFactor: number,
) => {
  const [gridLayout, setGridLayout] = useState({
    gridWidth: 0,
    gridHeight: 0,
    columnWidth: 0,
    numColumns: 0,
    rowHeight: 0,
    numRows: 0,
  });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setGridLayout((prev) => ({
        ...prev,
        gridWidth: width,
        gridHeight: height,
      }));
    });

    if (gridRef.current) observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    let calculatedColumnWidth =
      DEFAULT_GRID_ITEM_WIDTH * scaleFactor + GRID_GAP;
    if (calculatedColumnWidth > gridLayout.gridWidth) {
      calculatedColumnWidth = gridLayout.gridWidth;
    }

    const maxNumColumns = Math.floor(
      gridLayout.gridWidth / calculatedColumnWidth,
    );

    const numColumns = numItems > maxNumColumns ? maxNumColumns : numItems;

    const columnWidth = numColumns > 0 ? gridLayout.gridWidth / numColumns : 0;

    const rowHeight = numColumns > 0 ? calculatedColumnWidth : 0;

    const numVirtualRows =
      numColumns > 0 ? Math.ceil(numItems / numColumns) : 0;
    gridRef.current &&
      gridRef.current?.style.setProperty(
        "--item-size",
        `${DEFAULT_GRID_ITEM_WIDTH * scaleFactor}px`,
      );
    setGridLayout((prev) => ({
      ...prev,
      columnWidth,
      rowHeight,
      numColumns,
      numRows: numVirtualRows,
    }));
  }, [gridLayout.gridWidth, scaleFactor, numItems]);
  return gridLayout;
};
