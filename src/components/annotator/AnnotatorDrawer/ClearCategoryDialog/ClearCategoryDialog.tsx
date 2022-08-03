import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

import { selectedCategorySelector } from "store/selectors";

import { imageViewerSlice } from "store/slices";

type ClearCategoryDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ClearCategoryDialog = ({
  onClose,
  open,
}: ClearCategoryDialogProps) => {
  const dispatch = useDispatch();

  const category = useSelector(selectedCategorySelector);

  const onClear = () => {
    dispatch(
      imageViewerSlice.actions.clearCategoryAnnotations({ category: category })
    );

    onClose();
  };

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>Clear "{category.name}" annotations?</DialogTitle>

      <DialogContent>
        Annotations categorized as "{category.name}" will be deleted".
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button onClick={onClear} color="primary">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
