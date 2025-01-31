import React from "react";

import { Settings as SettingsIcon } from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { SettingsDialog } from "components/dialogs";
import { CustomListItemButton } from "../CustomListItemButton";

import { HotkeyContext } from "utils/common/enums";

export const SettingsListItem = () => {
  const { onClose, onOpen, open } = useDialogHotkey(
    HotkeyContext.AppSettingsDialog,
  );

  return (
    <>
      <CustomListItemButton
        primaryText="Settings"
        onClick={onOpen}
        icon={<SettingsIcon />}
      />

      <SettingsDialog onClose={onClose} open={open} />
    </>
  );
};
