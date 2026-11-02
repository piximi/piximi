import { useEffect, useMemo, useState } from "react";

import { DEFAULT_GRID_ITEM_WIDTH, GRID_GAP } from "utils/constants";

const computeGridLayout = (
  gridWidth: number,
  numItems: number,
  scaleFactor: number,
) => {
  let calculatedColumnWidth = DEFAULT_GRID_ITEM_WIDTH * scaleFactor + GRID_GAP;
  if (calculatedColumnWidth > gridWidth) {
    calculatedColumnWidth = gridWidth;
  }

  const maxNumColumns = Math.floor(gridWidth / calculatedColumnWidth);

  const numColumns = numItems > maxNumColumns ? maxNumColumns : numItems;

  const columnWidth = numColumns > 0 ? gridWidth / numColumns : 0;

  const rowHeight = numColumns > 0 ? calculatedColumnWidth : 0;

  const numVirtualRows = numColumns > 0 ? Math.ceil(numItems / numColumns) : 0;

  return {
    columnWidth,
    rowHeight,
    numColumns,
    numRows: numVirtualRows,
  };
};
export const useReactWindow = (
  numItems: number,
  gridRef: React.MutableRefObject<HTMLDivElement | null>,
  scaleFactor: number,
) => {
  const [size, setSize] = useState({ gridWidth: 0, gridHeight: 0 });

  useEffect(() => {
    const node = gridRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        gridWidth: entry.contentRect.width,
        gridHeight: entry.contentRect.height,
      }),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [gridRef]);

  const layout = useMemo(
    () => computeGridLayout(size.gridWidth, numItems, scaleFactor),
    [size.gridWidth, numItems, scaleFactor],
  );
  return { ...size, ...layout };
};
