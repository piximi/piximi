import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectTileSize } from "store/applicationSettings/selectors";
import { DEFAULT_GRID_ITEM_WIDTH, GRID_GAP } from "utils/constants";
import { getInnerElementWidth } from "utils/domUtils";

export const useWindowGrid = (items: Array<any>) => {
  const [gridWidth, setGridWidth] = useState(0);
  const [gridHeight, setGridHeight] = useState(0);
  const [columnWidth, setColumnWidth] = useState(0);
  const [numColumns, setNumColumns] = useState(0);
  const [rowHeight, setRowHeight] = useState(0);
  const [numRows, setNumRows] = useState(0);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const scaleFactor = useSelector(selectTileSize);

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
    const numVisible = items.length;

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
  }, [gridWidth, gridHeight, scaleFactor, items.length]);

  return {
    gridRef,
    gridWidth,
    gridHeight,
    columnWidth,
    numColumns,
    rowHeight,
    numRows,
  };
};
