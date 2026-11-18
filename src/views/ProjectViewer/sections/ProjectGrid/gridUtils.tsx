import { memo } from "react";

import { areEqual } from "react-window";

import { GridPlaceholder } from "./GridPlaceholder";

import type { GridChildComponentProps } from "react-window";

type SelectHandler = (id: string, selected: boolean) => void;

/* What every cell of a grid reads: records by index, from a query window. */
export type GridCellData<T> = {
  count: number;
  getItem: (index: number) => T | undefined;
  handleSelect: SelectHandler;
  selectedIds: ReadonlySet<string>;
  numColumns: number;
};

export function createGridCell<T>(
  ItemComponent: React.ComponentType<{
    item: T;
    handleClick: SelectHandler;
    selected: boolean;
    isScrolling?: boolean;
  }>,
  idOf: (item: T) => string,
) {
  return memo(
    ({
      columnIndex,
      rowIndex,
      style,
      isScrolling,
      data,
    }: GridChildComponentProps<GridCellData<T>>) => {
      const idx = rowIndex * data.numColumns + columnIndex;
      if (idx >= data.count) return <></>;
      const item = data.getItem(idx);
      const id = item === undefined ? undefined : idOf(item);
      return (
        <div
          style={{
            ...style,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
          data-testid={
            id === undefined ? "grid-item-pending" : `grid-item-${id}`
          }
        >
          {item === undefined ? (
            <GridPlaceholder />
          ) : (
            <ItemComponent
              item={item}
              handleClick={data.handleSelect}
              selected={data.selectedIds.has(id!)}
              isScrolling={isScrolling}
            />
          )}
        </div>
      );
    },
    areEqual,
  );
}
