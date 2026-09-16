import { useMemo } from "react";

import { Badge, Box, Divider } from "@mui/material";
import {
  Delete as DeleteIcon,
  Deselect as DeselectIcon,
  HighlightAltOutlined as SelectAllEmptyIcon,
  SelectAll as SelectAllIcon,
} from "@mui/icons-material";

import { useDialogHotkey, useHotkeys, useMobileView } from "hooks";

import { ConfirmationDialog } from "components/dialogs";
import { ToolButton } from "components/inputs";

import { HotkeyContext } from "utils/enums";
import { pluralize } from "utils/stringUtils";

import { useGridActions } from "@ProjectViewer/hooks";

import { ZoomControl } from "./ZoomControl";
import { CategorizeChip } from "./CategorizeChip";
import { SortFilter } from "./SortFilter";

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
      selectedFilteredItemIds.length === 0 ? SelectAllEmptyIcon : SelectAllIcon,
    [selectedFilteredItemIds],
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
          <SortFilter />
          <ToolButton
            name="Select all"
            onClick={handleSelectAll}
            disabled={!hasItems || allSelected}
            icon={
              <Badge
                data-testid="select-badge"
                badgeContent={selectedFilteredItemIds.length}
                color="primary"
                sx={(theme) => ({
                  "& .MuiBadge-badge": {
                    top: 8,
                    right: "100%",
                    border: `2px solid ${theme.palette.background.paper}`,
                    padding: "0 4px",
                  },
                })}
              >
                <SelectIcon />
              </Badge>
            }
            data-testid={"select-all-button"}
            hotkey={["ctrl", "a"]}
          />
          <ToolButton
            name="Deselect all"
            onClick={handleDeselectAll}
            disabled={!hasItems}
            icon={<DeselectIcon />}
            hotkey={["esc"]}
          />

          <CategorizeChip
            selectedFilteredItems={selectedFilteredItemIds}
            activeCategories={activeCategories}
            handleCategorize={handleCategorize}
          />
          <ToolButton
            name="Delete selected"
            disabled={selectedFilteredItemIds.length === 0}
            onClick={onOpenDeleteImagesDialog}
            icon={<DeleteIcon />}
            hotkey={["del"]}
          />
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
