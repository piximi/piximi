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
import { HotkeyView } from "utils/common/enums";
import { ReactElement } from "react";

type DialogWithActionProps = Omit<
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
  confirmDisabled,
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
    HotkeyView.DialogWithAction,
    { enableOnTags: ["INPUT"], enabled: isOpen },
    [handleConfirm]
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

      {content && <DialogContent sx={{ py: 0 }}>{content}</DialogContent>}

      <DialogActions>
        <Button
          onClick={handleConfirm}
          color="primary"
          disabled={confirmDisabled}
        >
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
