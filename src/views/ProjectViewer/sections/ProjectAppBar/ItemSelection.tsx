import React, { useMemo } from "react";
import { Badge } from "@mui/material";
import {
  Delete as DeleteIcon,
  Deselect as DeselectIcon,
  SelectAll as SelectAllIcon,
} from "@mui/icons-material";

import { TooltipButton, TooltipTitle } from "components/ui/tooltips";
import { useDialogHotkey, useHotkeys } from "hooks";
import { HotkeyContext } from "utils/enums";
import { useDispatch, useSelector } from "react-redux";
import { ConfirmationDialog } from "components/dialogs";
import { pluralize } from "utils/stringUtils";
import { selectActiveKindId } from "store/project/selectors";
import {
  selectActiveFilteredKindItems,
  selectActiveFilteresSelectedKindItemIds,
} from "store/project/reselectors";
import { projectSlice } from "store/project";
import { useKindOperations } from "contexts/KindItemsProvider";
import { IMAGE_KIND } from "store/data/constants";

export const ItemSelection = () => {
  const dispatch = useDispatch();
  const activeKind = useSelector(selectActiveKindId);
  const filteredItems = useSelector(selectActiveFilteredKindItems);
  const selectedItemIds = useSelector(selectActiveFilteresSelectedKindItemIds);
  const { deleteSelectedItems } = useKindOperations();

  const allSelected = useMemo(() => {
    return (
      selectedItemIds.length > 0 &&
      selectedItemIds.length === filteredItems.length
    );
  }, [filteredItems, selectedItemIds]);

  const {
    onClose: handleCloseDeleteImagesDialog,
    onOpen: onOpenDeleteImagesDialog,
    open: deleteImagesDialogisOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleSelectAll = () => {
    dispatch(
      projectSlice.actions.selectKindItems(
        filteredItems.map((item) => item.id),
      ),
    );
  };
  const handleDeselectAll = () => {
    dispatch(
      projectSlice.actions.deselectKindItems(
        filteredItems.map((item) => item.id),
      ),
    );
  };
  const handleDeleteSelected = () => {
    deleteSelectedItems(selectedItemIds);
  };

  useHotkeys(
    "esc",
    () => {
      selectedItemIds.length > 0 && handleDeselectAll();
    },
    HotkeyContext.ProjectView,
    [handleDeselectAll, selectedItemIds],
  );
  useHotkeys(
    "delete, backspace",
    () => {
      selectedItemIds.length > 0 && onOpenDeleteImagesDialog();
    },
    HotkeyContext.ProjectView,
    [selectedItemIds],
  );
  useHotkeys(
    "control+a",
    () => !allSelected && handleSelectAll(),
    HotkeyContext.ProjectView,
    [handleSelectAll, allSelected],
  );
  return (
    <>
      <TooltipButton
        tooltipTitle={TooltipTitle(`Select all`, "control", "a")}
        color="inherit"
        onClick={handleSelectAll}
        disabled={allSelected}
        icon={true}
      >
        <Badge
          badgeContent={selectedItemIds.length}
          color="primary"
          sx={(theme) => ({
            "& .MuiBadge-badge": {
              top: 8,
              right: -1,
              border: `2px solid ${theme.palette.background.paper}`,
              padding: "0 4px",
            },
          })}
        >
          <SelectAllIcon />
        </Badge>
      </TooltipButton>

      <TooltipButton
        tooltipTitle={TooltipTitle(`Deselect`, "esc")}
        color="inherit"
        onClick={handleDeselectAll}
        disabled={selectedItemIds.length === 0}
        icon={true}
      >
        <DeselectIcon />
      </TooltipButton>

      <TooltipButton
        tooltipTitle={TooltipTitle(`Delete selected`, "delete")}
        color="inherit"
        disabled={selectedItemIds.length === 0}
        onClick={onOpenDeleteImagesDialog}
        icon={true}
      >
        <DeleteIcon />
      </TooltipButton>
      <ConfirmationDialog
        title={`Delete ${pluralize("Object", selectedItemIds.length)}?`}
        content={`Objects will be deleted from the project. ${
          activeKind === IMAGE_KIND
            ? "Associated annotations will also be removed."
            : ""
        } `}
        onConfirm={handleDeleteSelected}
        isOpen={deleteImagesDialogisOpen}
        onClose={handleCloseDeleteImagesDialog}
      />
    </>
  );
};
