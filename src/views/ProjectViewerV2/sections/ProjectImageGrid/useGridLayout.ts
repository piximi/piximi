import { useLayoutEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { selectTileSize } from "store/applicationSettings/selectors";
import { useReactWindow } from "@ProjectViewer/hooks";

export function useGridLayout(itemCount: number) {
  const scaleFactor = useSelector(selectTileSize);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    gridRef.current?.style.setProperty("--item-size", `${220 * scaleFactor}px`);
  }, [scaleFactor]);

  const layout = useReactWindow(itemCount, gridRef, scaleFactor);
  return { gridRef, scaleFactor, ...layout };
}
