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
import { HotkeyContext } from "utils/common/enums";
import { ReactElement } from "react";

type ConfirmationDialogProps = Omit<
  DialogProps,
  "children" | "open" | "content"
> & {
  title: string;
  content?: ReactElement | string;
  onConfirm: () => void;
  onClose: () => void;
  isOpen: boolean;
  onReject?: () => void;
  confirmText?: string;
  rejectText?: string;
  confirmDisabled?: boolean;
  disableHotkeyOnInput?: boolean;
};

export const ConfirmationDialog = ({
  title,
  content,
  onConfirm,
  onClose: handleClose,
  onReject,
  confirmText = "Confirm",
  rejectText = "Reject",
  isOpen,
  confirmDisabled,
  disableHotkeyOnInput,
  ...rest
}: ConfirmationDialogProps) => {
  const handleConfirm = () => {
    handleClose();
    onConfirm();
  };

  const handleReject = () => {
    onReject && onReject();
    handleClose();
  };

  useHotkeys(
    "enter",
    () => {
      !confirmDisabled && handleConfirm();
    },
    HotkeyContext.ConfirmationDialog,
    { enableOnTags: disableHotkeyOnInput ? [] : ["INPUT"], enabled: isOpen },
    [handleConfirm, confirmDisabled, handleReject]
  );

  return (
    <Dialog fullWidth onClose={handleClose} open={isOpen} {...rest}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        px={1}
        pb={1.5}
        pt={1}
      >
        <DialogTitle sx={{ p: 1 }}>{title}</DialogTitle>
        <IconButton
          onClick={handleClose}
          sx={(theme) => ({
            maxHeight: "40px",
          })}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {content && <DialogContent>{content}</DialogContent>}

      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>

        {onReject && (
          <Button onClick={handleReject} color="primary">
            {rejectText}
          </Button>
        )}
        <Button
          onClick={handleConfirm}
          color="primary"
          variant="contained"
          disabled={confirmDisabled}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
