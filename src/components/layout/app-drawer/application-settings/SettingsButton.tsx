import { IconButton, Tooltip } from "@mui/material";
import { SettingsOutlined as SettingsIcon } from "@mui/icons-material";
import { useDialogHotkey } from "hooks";
import { HotkeyContext } from "utils/enums";
import { SettingsDialog } from "components/dialogs";

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
