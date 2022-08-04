import React from "react";
import { useDispatch } from "react-redux";
import { useHotkeys } from "react-hotkeys-hook";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import { deleteCategory } from "store/slices";

import { Category } from "types";

type DeleteCategoryDialogProps = {
  category: Category;
  onClose: () => void;
  open: boolean;
};

export const DeleteCategoryDialog = ({
  category,
  onClose,
  open,
}: DeleteCategoryDialogProps) => {
  const dispatch = useDispatch();

  const onDelete = () => {
    dispatch(deleteCategory({ id: category.id }));

    onClose();
  };

  useHotkeys(
    "enter",
    () => {
      onDelete();
    },
    { enabled: open },
    [onDelete]
  );

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>Delete "{category.name}" category?</DialogTitle>

      <DialogContent>
        Images categorized as "{category.name}" will not be deleted.
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button onClick={onDelete} color="primary">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
