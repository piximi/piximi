import React from "react";
import { Dialog, DialogContent, IconButton, DialogTitle } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

import { useHotkeys } from "hooks";

import { UISettings } from "./UISettings";

import { HotkeyContext } from "utils/enums";

type SettingsDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const SettingsDialog = ({ onClose, open }: SettingsDialogProps) => {
  useHotkeys(
    "enter",
    () => {
      onClose();
    },
    HotkeyContext.AppSettingsDialog,
    { enableOnTags: ["INPUT"], enabled: open },
    [onClose],
  );

  return (
    <Dialog onClose={onClose} open={open} fullWidth maxWidth="xs">
      <DialogTitle sx={{ m: 0, p: 2 }}>Settings</DialogTitle>

      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={(theme) => ({
          position: "absolute",
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ px: 0, pb: 2.5, pt: 1 }}>
        <UISettings />
      </DialogContent>
    </Dialog>
  );
};
