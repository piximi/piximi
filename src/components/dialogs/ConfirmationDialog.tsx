import { Button, Dialog, DialogContent, DialogActions } from "@mui/material";

import { useHotkeys } from "hooks";

import { DialogTitleBar } from "components/ui/DialogTitleBar";

import { HotkeyContext } from "utils/enums";

import type { ReactElement } from "react";

import type { DialogProps } from "@mui/material";

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
    (keyboardEvent) => {
      keyboardEvent.preventDefault();
      !confirmDisabled && handleConfirm();
    },
    HotkeyContext.ConfirmationDialog,
    {
      enableOnTags: disableHotkeyOnInput ? [] : ["INPUT"],
      enabled: isOpen,
      filterPreventDefault: false,
    },
    [handleConfirm, confirmDisabled],
  );

  return (
    <Dialog fullWidth onClose={handleClose} open={isOpen} {...rest}>
      <DialogTitleBar title={title} closeDialog={handleClose} />

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
