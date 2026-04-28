import React, { useMemo } from "react";

import { Badge, Box, Divider } from "@mui/material";
import {
  Delete as DeleteIcon,
  Deselect as DeselectIcon,
  HighlightAltOutlined as SelectAllEmptyIcon,
  SelectAll as SelectAllIcon,
} from "@mui/icons-material";

import { useDialogHotkey, useHotkeys, useMobileView } from "hooks";

import { TooltipButton, TooltipTitle } from "components/ui/tooltips";
import { ConfirmationDialog } from "components/dialogs";

import { useGridActions } from "@ProjectViewer/hooks";

import { HotkeyContext } from "utils/enums";
import { pluralize } from "utils/stringUtils";

import { ZoomControl } from "./ZoomControl";
import { CategorizeChip } from "./CategorizeChip";
import { actionButtonStyle } from "./utils";

import type { ViewState } from "@ProjectViewer/state/types";

export const GridActions = ({ viewState }: { viewState: ViewState }) => {
  const {
    selectedFilteredItemIds,
    allSelected,
    hasItems,
    activeCategories,
    handleDelete,
    handleCategorize,
    handleSelectAll,
    handleDeselectAll,
  } = useGridActions();

  const {
    onClose: handleCloseDeleteImagesDialog,
    onOpen: onOpenDeleteImagesDialog,
    open: deleteImagesDialogisOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const isMobile = useMobileView();

  const SelectIcon = useMemo(
    () =>
      allSelected && hasItems
        ? DeselectIcon
        : selectedFilteredItemIds.length === 0
          ? SelectAllEmptyIcon
          : SelectAllIcon,
    [allSelected, selectedFilteredItemIds],
  );

  useHotkeys(
    "delete, backspace",
    () => {
      selectedFilteredItemIds.length > 0 && onOpenDeleteImagesDialog();
    },
    HotkeyContext.ProjectView,
    [selectedFilteredItemIds],
  );
  return (
    <Box sx={{ display: "flex", position: "absolute", right: 0 }}>
      {!isMobile && (
        <>
          <TooltipButton
            tooltipTitle={
              allSelected
                ? TooltipTitle(`Deselect`, "esc")
                : TooltipTitle(`Select all`, "control", "a")
            }
            color="inherit"
            onClick={allSelected ? handleDeselectAll : handleSelectAll}
            disabled={!hasItems}
            icon={true}
            data-testid={
              allSelected ? "deselect-all-button" : "select-all-button"
            }
            sx={actionButtonStyle}
          >
            <Badge
              data-testid="select-badge"
              badgeContent={selectedFilteredItemIds.length}
              color="primary"
              sx={(theme) => ({
                "& .MuiBadge-badge": {
                  top: 8,
                  right: "150%",
                  border: `2px solid ${theme.palette.background.paper}`,
                  padding: "0 4px",
                },
              })}
            >
              <SelectIcon />
            </Badge>
          </TooltipButton>
          <CategorizeChip
            selectedFilteredItems={selectedFilteredItemIds}
            activeCategories={activeCategories}
            handleCategorize={handleCategorize}
          />
          <TooltipButton
            tooltipTitle={TooltipTitle(`Delete selected`, "delete")}
            color="inherit"
            disabled={selectedFilteredItemIds.length === 0}
            onClick={onOpenDeleteImagesDialog}
            icon={true}
            sx={actionButtonStyle}
          >
            <DeleteIcon />
          </TooltipButton>
        </>
      )}
      <Divider
        variant="middle"
        orientation="vertical"
        flexItem
        sx={{ mx: 0.5 }}
      />
      <ZoomControl />
      <ConfirmationDialog
        title={`Delete ${pluralize("Object", selectedFilteredItemIds.length)}?`}
        content={`Objects will be deleted from the project. ${
          viewState === "images"
            ? "Associated annotations will also be removed."
            : ""
        } `}
        onConfirm={handleDelete}
        isOpen={deleteImagesDialogisOpen}
        onClose={handleCloseDeleteImagesDialog}
      />
    </Box>
  );
};
