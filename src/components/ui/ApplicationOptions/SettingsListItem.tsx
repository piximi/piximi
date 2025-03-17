import React from "react";

import { Settings as SettingsIcon } from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { SettingsDialog } from "components/dialogs";
import { CustomListItemButton } from "../CustomListItemButton";

import { HotkeyContext } from "utils/common/enums";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const SettingsListItem = () => {
  const { onClose, onOpen, open } = useDialogHotkey(
    HotkeyContext.AppSettingsDialog
  );

  return (
    <>
      <CustomListItemButton
        data-help={HelpItem.Settings}
        primaryText="Settings"
        onClick={onOpen}
        icon={<SettingsIcon />}
      />

      <SettingsDialog onClose={onClose} open={open} />
    </>
  );
};
