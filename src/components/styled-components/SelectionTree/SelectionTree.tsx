import React from "react";
import {
  SimpleTreeView,
  TreeItem,
  treeItemClasses,
  TreeItemContentProps,
  TreeItemProps,
  useTreeItemState,
} from "@mui/x-tree-view";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckBoxOutlineBlankOutlinedIcon from "@mui/icons-material/CheckBoxOutlineBlankOutlined";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import clsx from "clsx";
import { TreeData } from "utils/measurements/types";
import { Typography } from "@mui/material";

export const SelectionTree = ({
  treeItems,
  selectedItems,
  handleSelect,
  entryPoint,
}: {
  treeItems: TreeData;
  selectedItems: string[];
  handleSelect: (event: React.SyntheticEvent, itemIds: string[]) => void;
  entryPoint?: string;
}) => {
  const [expanded, setExpanded] = React.useState<string[]>([]);

  const renderTree = (items: TreeData, initId?: string) => {
    initId = initId ?? Object.keys(items)[0];
    if (Object.keys(items).length === 0) {
      return <></>;
    }
    return (
      <CustomTreeItem
        key={items[initId].name}
        itemId={initId}
        label={items[initId].name}
        sx={{
          [`& .${treeItemClasses.content}`]: {
            [`& .${treeItemClasses.label}`]: {
              fontSize: "0.875rem",
            },
          },
        }}
      >
        {Array.isArray(items[initId].children)
          ? items[initId].children?.map((itemId) => renderTree(items, itemId))
          : null}
      </CustomTreeItem>
    );
  };

  const handleExpansionToggle = (
    event: React.SyntheticEvent,
    itemIds: string[]
  ) => {
    setExpanded(itemIds);
  };

  return (
    <SimpleTreeView
      aria-label="measurements tree"
      id="meaurements-tree"
      slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
      expandedItems={expanded}
      selectedItems={selectedItems}
      onSelectedItemsChange={handleSelect}
      onExpandedItemsChange={handleExpansionToggle}
      multiSelect
      sx={{
        //height: "100%",
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

const CustomContent = React.forwardRef(function CustomContent(
  props: TreeItemContentProps,
  ref
) {
  const {
    classes,
    className,
    label,
    itemId,
    icon: iconProp,
    expansionIcon,
    displayIcon,
  } = props;

  const {
    disabled,
    expanded,
    selected,
    handleExpansion,
    handleSelection,
    preventSelection,
  } = useTreeItemState(itemId);

  const icon = iconProp || expansionIcon || displayIcon;

  const handleMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    preventSelection(event);
  };

  const handleExpansionClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    handleExpansion(event);
  };

  const handleSelectionClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    handleSelection(event);
  };

  return (
    <div
      className={clsx(className, classes.root, {
        [classes.expanded]: expanded,
        [classes.selected]: false,
        [classes.focused]: false,
        [classes.disabled]: disabled,
      })}
      onMouseDown={handleMouseDown}
      ref={ref as React.Ref<HTMLDivElement>}
    >
      <div onClick={handleExpansionClick} className={classes.iconContainer}>
        {icon}
      </div>
      <div onClick={handleSelectionClick} className={classes.iconContainer}>
        {selected ? (
          <CheckBoxOutlinedIcon fontSize="small" />
        ) : (
          <CheckBoxOutlineBlankOutlinedIcon
            fontSize="small"
            sx={(theme) => ({
              color: disabled ? theme.palette.action.disabled : "",
            })}
          />
        )}
      </div>

      <Typography
        onClick={handleExpansionClick}
        component="div"
        className={classes.label}
      >
        {label}
      </Typography>
    </div>
  );
});

const CustomTreeItem = React.forwardRef(function CustomTreeItem(
  props: TreeItemProps,
  ref: React.Ref<HTMLLIElement>
) {
  return <TreeItem ContentComponent={CustomContent} {...props} ref={ref} />;
});
