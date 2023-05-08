import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { useHotkeys } from "hooks";

import { HotkeyView } from "types";

type DialogWithActionProps = {
  title: string;
  content: string;
  handleConfirmCallback: () => void;
  onClose: () => void;
  open: boolean;
};

export const DialogWithAction = ({
  title,
  content,
  handleConfirmCallback,
  onClose,
  open,
}: DialogWithActionProps) => {
  const handleConfirm = () => {
    handleConfirmCallback();

    onClose();
  };

  useHotkeys(
    "enter",
    () => {
      handleConfirm();
    },
    HotkeyView.DeleteCategoryDialog,
    { enableOnTags: ["INPUT"] },
    [handleConfirm]
  );

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>{content}</DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button onClick={handleConfirm} color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};
