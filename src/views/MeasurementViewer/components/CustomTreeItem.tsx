import * as React from "react";

import Tooltip from "@mui/material/Tooltip";
import type { TreeItemProps } from "@mui/x-tree-view/TreeItem";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import type { TreeViewDefaultItemModelProperties } from "@mui/x-tree-view";

export type CustomTreeViewBaseItem = TreeViewDefaultItemModelProperties & {
  displayName?: string;
};
/**
 * Custom TreeItem component that wraps the standard TreeItem with an MUI Tooltip.
 * This allows displaying additional information (like the item ID) on hover.
 */
export const getCustomTreeItem = (displayLookUp: Record<string, string>) => {
  const CustomTreeItem = React.forwardRef(function CustomTreeItem(
    props: TreeItemProps,
    ref: React.Ref<HTMLLIElement>,
  ) {
    const { itemId, label, children, ...other } = props;
    const isParent = Array.isArray(children) && children.length > 0;
    return isParent ? (
      <TreeItem itemId={itemId} label={label} ref={ref} {...other}>
        {children}
      </TreeItem>
    ) : (
      <Tooltip
        title={displayLookUp[itemId]}
        placement="right"
        arrow
        enterDelay={100}
      >
        <span>
          <TreeItem itemId={itemId} label={label} ref={ref} {...other} />
        </span>
      </Tooltip>
    );
  });
  return CustomTreeItem;
};
