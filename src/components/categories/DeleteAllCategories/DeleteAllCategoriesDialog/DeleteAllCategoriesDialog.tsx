import React from "react";
import { batch, useDispatch } from "react-redux";
import { useHotkeys } from "react-hotkeys-hook";

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { imageViewerSlice } from "store/image-viewer";
import { projectSlice } from "store/project";

import { CategoryType, UNKNOWN_ANNOTATION_CATEGORY_ID } from "types";

type DeleteAllCategoriesDialogProps = {
  categoryType: CategoryType;
  onClose: () => void;
  open: boolean;
};

export const DeleteAllCategoriesDialog = ({
  categoryType,
  onClose,
  open,
}: DeleteAllCategoriesDialogProps) => {
  const dispatch = useDispatch();

  const onDeleteAllCategories = () => {
    if (categoryType === CategoryType.ClassifierCategory) {
      deleteAllClassifierCategories();
    } else {
      deleteAllAnnotationCategories();
    }
  };

  const deleteAllClassifierCategories = () => {
    dispatch(projectSlice.actions.deleteAllCategories({}));
  };

  const deleteAllAnnotationCategories = () => {
    batch(() => {
      dispatch(
        imageViewerSlice.actions.setSelectedCategoryId({
          selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
          execSaga: true,
        })
      );

      dispatch(imageViewerSlice.actions.deleteAllAnnotationCategories({}));

      dispatch(projectSlice.actions.deleteAllAnnotationCategories({}));
    });
  };

  useHotkeys(
    "enter",
    () => {
      onDeleteAllCategories();
    },
    { enabled: open },
    [onDeleteAllCategories]
  );

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>Delete all categories?</DialogTitle>

      <DialogContent>
        {categoryType === CategoryType.ClassifierCategory
          ? "Images"
          : "Annotations"}{" "}
        will not be deleted and instead will be labeled as "Unknown".
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button onClick={onDeleteAllCategories} color="primary">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
