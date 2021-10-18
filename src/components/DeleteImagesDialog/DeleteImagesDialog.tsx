import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import React from "react";
import { useDispatch } from "react-redux";
import { applicationSlice, projectSlice } from "../../store/slices";

type DeleteImagesDialogProps = {
  imageIds: Array<string>;
  onClose: () => void;
  open: boolean;
};

export const DeleteImagesDialog = ({
  imageIds,
  onClose,
  open,
}: DeleteImagesDialogProps) => {
  const dispatch = useDispatch();

  const onDelete = () => {
    dispatch(projectSlice.actions.deleteImages({ ids: imageIds }));
    dispatch(applicationSlice.actions.clearSelectedImages());
    onClose();
  };

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>
        Delete {imageIds.length} image{imageIds.length > 1 && "s"}?
      </DialogTitle>

      <DialogContent>Images will be deleted from the project.</DialogContent>

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
