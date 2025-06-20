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
import { dataSlice } from "store/data";
import { ConfirmationDialog } from "components/dialogs";
import { pluralize } from "utils/stringUtils";
import { selectActiveKindId } from "store/project/selectors";
import {
  selectActiveFilteredGridAnnotations,
  selectActiveSelectedGridAnnotations,
  selectFilteredGridImages,
  selectSelectedGridImages,
} from "store/project/reselectors";
import { projectSlice } from "store/project";

export const ItemSelection = () => {
  const dispatch = useDispatch();
  const activeKind = useSelector(selectActiveKindId);
  const filteredAnnotations = useSelector(selectActiveFilteredGridAnnotations);
  const activeSelectedAnnotations = useSelector(
    selectActiveSelectedGridAnnotations,
  );
  const filteredImages = useSelector(selectFilteredGridImages);
  const selectedImages = useSelector(selectSelectedGridImages);

  const selectedItems = useMemo(() => {
    console.log(selectedImages);
    return activeKind === "Image" ? selectedImages : activeSelectedAnnotations;
  }, [activeKind, selectedImages, activeSelectedAnnotations]);

  const filteredItems = useMemo(() => {
    return activeKind === "Image" ? filteredImages : filteredAnnotations;
  }, [activeKind, filteredImages, filteredAnnotations]);

  const allSelected = useMemo(() => {
    return (
      selectedItems.length > 0 && selectedItems.length === filteredItems.length
    );
  }, [filteredItems, selectedItems]);

  const {
    onClose: handleCloseDeleteImagesDialog,
    onOpen: onOpenDeleteImagesDialog,
    open: deleteImagesDialogisOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleSelectAll = () => {
    if (activeKind === "Image") {
      dispatch(
        projectSlice.actions.selectImages({
          selection: filteredImages.map((image) => ({
            id: image.id,
            timepoint: image.timepoint,
          })),
        }),
      );
    } else {
      dispatch(
        projectSlice.actions.selectAnnotations({
          ids: filteredAnnotations.map((ann) => ann.id),
        }),
      );
    }
  };
  const handleDeselectAll = () => {
    if (activeKind === "Image") {
      dispatch(projectSlice.actions.resetImageSelection());
    } else {
      dispatch(projectSlice.actions.resetAnnotationSelection());
    }
  };
  const handleDeleteSelected = () => {
    if (activeKind === "Image") {
      dispatch(dataSlice.actions.deleteImages({ images: selectedItems }));
    } else {
      dispatch(
        dataSlice.actions.deleteAnnotations({
          ids: selectedItems.map((item) => item.id),
        }),
      );
    }
  };

  useHotkeys(
    "esc",
    () => {
      selectedItems.length > 0 && handleDeselectAll();
    },
    HotkeyContext.ProjectView,
    [handleDeselectAll, selectedItems],
  );
  useHotkeys(
    "delete, backspace",
    () => {
      selectedItems.length > 0 && onOpenDeleteImagesDialog();
    },
    HotkeyContext.ProjectView,
    [selectedItems],
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
          badgeContent={selectedItems.length}
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
        disabled={selectedItems.length === 0}
        icon={true}
      >
        <DeselectIcon />
      </TooltipButton>

      <TooltipButton
        tooltipTitle={TooltipTitle(`Delete selected`, "delete")}
        color="inherit"
        disabled={selectedItems.length === 0}
        onClick={onOpenDeleteImagesDialog}
        icon={true}
      >
        <DeleteIcon />
      </TooltipButton>
      <ConfirmationDialog
        title={`Delete ${pluralize("Object", selectedItems.length)}?`}
        content={`Objects will be deleted from the project. ${
          activeKind === "Image"
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
