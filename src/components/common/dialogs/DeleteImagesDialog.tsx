import { useDispatch } from "react-redux";
import { useHotkeys } from "hooks";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import { dataSlice } from "store/data";
import { projectSlice } from "store/project";
import { HotkeyView } from "types";

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
    dispatch(
      dataSlice.actions.deleteImages({
        imageIds: imageIds,
        disposeColorTensors: true,
      })
    );
    dispatch(projectSlice.actions.clearSelectedImages());
    onClose();
  };

  useHotkeys(
    "enter",
    () => {
      onDelete();
    },
    HotkeyView.DeleteImagesDialog,
    { enableOnTags: ["INPUT"] },
    [onDelete]
  );

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
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
