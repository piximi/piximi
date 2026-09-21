import {
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import { SettingsOutlined as SettingsIcon } from "@mui/icons-material";

import { useDialogHotkey, useHotkeys } from "hooks";

import { DialogTitleBar } from "components/ui/DialogTitleBar";

import { HotkeyContext } from "utils/enums";

import { HelpItem } from "data/help/HelpContent";

import { ProjectSettings } from "./ProjectSettings";
import { UISettings } from "./UISettings";

type SettingsDialogProps = {
  onClose: () => void;
  open: boolean;
};

const SettingsDialog = ({ onClose, open }: SettingsDialogProps) => {
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
      <DialogTitleBar title="Settings" closeDialog={onClose} />

      <DialogContent sx={{ px: 0, pb: 2.5, pt: 1 }}>
        <Stack gap={2}>
          <UISettings />
          <ProjectSettings />
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export const SettingsButton = () => {
  const { onClose, onOpen, open } = useDialogHotkey(
    HotkeyContext.AppSettingsDialog,
  );

  return (
    <>
      <Tooltip title="Settings">
        <IconButton onClick={onOpen} size="small" data-help={HelpItem.Settings}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <SettingsDialog onClose={onClose} open={open} />
    </>
  );
};
