import React from "react";
import { Badge, Box, Divider } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useDialogHotkey, useHotkeys, useMobileView } from "hooks";
import { TooltipButton, TooltipTitle } from "components/ui/tooltips";
import { ConfirmationDialog } from "components/dialogs";
import { ViewState } from "@ProjectViewer/state/types";
import { HotkeyContext } from "utils/enums";
import { pluralize } from "utils/stringUtils";
import { ZoomControl } from "./ZoomControl";
import { CategorizeChip } from "./CategorizeChip";
import { useGridActions } from "./useGridActions";
import { actionButtonStyle } from "./utils";

export const GridActions = ({ viewState }: { viewState: ViewState }) => {
  const {
    selectedFilteredItems,
    activeCategories,
    handleDelete,
    handleCategorize,
    selectProps,
  } = useGridActions(viewState);

  const {
    onClose: handleCloseDeleteImagesDialog,
    onOpen: onOpenDeleteImagesDialog,
    open: deleteImagesDialogisOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const isMobile = useMobileView();

  const SelectIcon = selectProps.icon;

  useHotkeys(
    "delete, backspace",
    () => {
      selectedFilteredItems.length > 0 && onOpenDeleteImagesDialog();
    },
    HotkeyContext.ProjectView,
    [selectedFilteredItems],
  );
  return (
    <Box sx={{ display: "flex", position: "absolute", right: 0 }}>
      {!isMobile && (
        <>
          <TooltipButton
            tooltipTitle={selectProps.tooltipTitle}
            color="inherit"
            onClick={selectProps.onClick}
            disabled={selectProps.disabled}
            icon={true}
            data-testid={selectProps.dataTestId}
            sx={actionButtonStyle}
          >
            <Badge
              data-testid="select-badge"
              badgeContent={selectedFilteredItems.length}
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
            selectedFilteredItems={selectedFilteredItems}
            activeCategories={activeCategories}
            handleCategorize={handleCategorize}
          />
          <TooltipButton
            tooltipTitle={TooltipTitle(`Delete selected`, "delete")}
            color="inherit"
            disabled={selectedFilteredItems.length === 0}
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
        title={`Delete ${pluralize("Object", selectedFilteredItems.length)}?`}
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
