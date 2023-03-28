import React from "react";
import { batch, useDispatch } from "react-redux";

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { AnnotatorSlice } from "store/annotator";

import { UNKNOWN_ANNOTATION_CATEGORY_ID } from "types";

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
    console.log("pressed");
    batch(() => {
      dispatch(
        AnnotatorSlice.actions.setSelectedAnnotationIds({
          workingAnnotationId: undefined,
          selectedAnnotationIds: [],
        })
      );
      dispatch(
        AnnotatorSlice.actions.setSelectedCategoryId({
          selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
          execSaga: true,
        })
      );
    });

    onClose();
  };

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>Delete all annotations?</DialogTitle>

      <DialogContent>
        All annotations across all images will be permanently deleted.
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
