import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useDispatch } from "react-redux";
import { Category } from "../../types/Category";
import { deleteCategory } from "../../store/slices";

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
