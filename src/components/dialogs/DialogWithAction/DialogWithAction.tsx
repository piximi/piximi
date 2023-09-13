import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  DialogProps,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useHotkeys } from "hooks";
import { HotkeyView } from "types";

type DialogWithActionProps = Omit<DialogProps, "children" | "open"> & {
  title: string;
  content?: any;
  onConfirm: () => void;
  onClose: () => void;
  isOpen: boolean;
  onReject?: () => void;
  confirmText?: string;
  rejectText?: string;
};

export const DialogWithAction = ({
  title,
  content,
  onConfirm,
  onClose: handleClose,
  onReject: handleReject,
  confirmText = "Confirm",
  rejectText = "Reject",
  isOpen,
  ...rest
}: DialogWithActionProps) => {
  const handleConfirm = () => {
    onConfirm();

    handleClose();
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
    <Dialog fullWidth onClose={handleClose} open={isOpen} {...rest}>
      <Box display="flex" justifyContent="space-between" px={1} py={1.5}>
        <DialogTitle sx={{ p: 1 }}>{title}</DialogTitle>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {content && <DialogContent>{content}</DialogContent>}

      <DialogActions>
        <Button onClick={handleConfirm} color="primary">
          {confirmText}
        </Button>
        {handleReject ? (
          <Button onClick={handleReject} color="primary">
            {rejectText}
          </Button>
        ) : (
          <></>
        )}
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
