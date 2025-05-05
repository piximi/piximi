import React from "react";
import { SimpleTreeView, TreeItem, treeItemClasses } from "@mui/x-tree-view";

import { TreeData } from "utils/measurements/types";

export const SelectionTree = ({
  treeItems,
  selectedItems,
  handleSelect,
  checkboxSize = "medium",
}: {
  treeItems: TreeData;
  selectedItems: string[];
  handleSelect: (event: React.SyntheticEvent, itemIds: string[]) => void;
  checkboxSize?: "small" | "medium";
}) => {
  const renderTree = (items: TreeData, initId?: string) => {
    initId = initId ?? Object.keys(items)[0];
    if (Object.keys(items).length === 0) {
      return <></>;
    }
    return (
      <TreeItem
        key={items[initId].name}
        itemId={initId}
        label={items[initId].name}
        sx={{
          [`& .${treeItemClasses.content}`]: {
            [`& .${treeItemClasses.label}`]: {
              fontSize: "0.875rem",
            },
            [`& .${treeItemClasses.checkbox}`]: checkboxSize === "small" && {
              fontSize: "1.25rem",
              "& .MuiSvgIcon-root": {
                fontSize: "1.25rem",
              },
            },
          },
        }}
      >
        {Array.isArray(items[initId].children)
          ? items[initId].children?.map((itemId) => renderTree(items, itemId))
          : null}
      </TreeItem>
    );
  };

  return (
    <SimpleTreeView
      aria-label="measurements tree"
      id="meaurements-tree"
      selectedItems={selectedItems}
      onSelectedItemsChange={handleSelect}
      multiSelect
      checkboxSelection
      sx={{
        flexGrow: 1,
        maxWidth: "100%",
        overflowY: "auto",
      }}
    >
      {Object.entries(treeItems).reduce((items: any, [item, details]) => {
        if (!details.parent) {
          items.push(renderTree(treeItems, item));
        }
        return items;
      }, [])}
    </SimpleTreeView>
  );
};
