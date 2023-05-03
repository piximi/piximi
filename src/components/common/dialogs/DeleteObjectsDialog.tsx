import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { useHotkeys } from "hooks";

import { HotkeyView } from "types";

type DeleteObjectsDialogProps = {
  title: string;
  content: string;
  deleteObjectCallback: () => void;
  onClose: () => void;
  open: boolean;
};

export const DeleteObjectsDialog = ({
  title,
  content,
  deleteObjectCallback,
  onClose,
  open,
}: DeleteObjectsDialogProps) => {
  const handleDeleteCategory = () => {
    deleteObjectCallback();

    onClose();
  };

  useHotkeys(
    "enter",
    () => {
      handleDeleteCategory();
    },
    HotkeyView.DeleteCategoryDialog,
    { enableOnTags: ["INPUT"] },
    [handleDeleteCategory]
  );

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>{content}</DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button onClick={handleDeleteCategory} color="primary">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
