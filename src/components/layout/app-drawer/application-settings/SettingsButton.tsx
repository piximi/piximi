import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  SettingsOutlined as SettingsIcon,
} from "@mui/icons-material";
import { useDialogHotkey, useHotkeys } from "hooks";
import { HotkeyContext } from "utils/enums";
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
        <IconButton onClick={onOpen} size="small">
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <SettingsDialog onClose={onClose} open={open} />
    </>
  );
};
