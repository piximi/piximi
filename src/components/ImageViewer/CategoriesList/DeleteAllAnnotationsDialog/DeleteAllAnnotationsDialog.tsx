import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { batch, useDispatch } from "react-redux";
import { imageViewerSlice } from "../../../../store/slices";
import { UNKNOWN_CATEGORY_ID } from "../../../../types/Category";

type DeleteAllAnnotationsDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const DeleteAllAnnotationsDialog = ({
  onClose,
  open,
}: DeleteAllAnnotationsDialogProps) => {
  const dispatch = useDispatch();

  const onDelete = () => {
    batch(() => {
      dispatch(imageViewerSlice.actions.deleteAllInstances({ id: "" }));
      dispatch(
        imageViewerSlice.actions.setSelectedCategory({
          selectedCategory: UNKNOWN_CATEGORY_ID,
        })
      );
    });

    onClose();
  };

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>Delete all annotations?</DialogTitle>

      <DialogContent>
        All annotations across all images will be permanently deleted."
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
