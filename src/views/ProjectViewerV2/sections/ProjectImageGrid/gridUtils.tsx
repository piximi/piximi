import { memo } from "react";
import memoize from "memoize-one";
import { areEqual, GridChildComponentProps } from "react-window";

type SelectHandler = (id: string, selected: boolean) => void;

export type GridCellData<T> = {
  items: T[];
  handleSelect: SelectHandler;
  selectedIds: string[];
  numColumns: number;
};

export const createItemData = memoize(
  <T,>(
    items: T[],
    handleSelect: SelectHandler,
    selectedIds: string[],
    numColumns: number,
  ): GridCellData<T> => ({ items, handleSelect, selectedIds, numColumns }),
);

export function createGridCell<T extends { id: string }>(
  ItemComponent: React.ComponentType<{
    item: T;
    handleClick: SelectHandler;
    selected: boolean;
    isScrolling?: boolean;
  }>,
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
      if (idx >= data.items.length) return <></>;
      const item = data.items[idx];
      return (
        <div
          style={{
            ...style,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
          data-testid={`grid-item-${item.id}`}
        >
          <ItemComponent
            item={item}
            handleClick={data.handleSelect}
            selected={data.selectedIds.includes(item.id)}
            isScrolling={isScrolling}
          />
        </div>
      );
    },
    areEqual,
  );
}
