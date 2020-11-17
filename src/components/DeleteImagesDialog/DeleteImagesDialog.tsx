import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
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
