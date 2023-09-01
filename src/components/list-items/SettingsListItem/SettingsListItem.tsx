import React from "react";

import SettingsIcon from "@mui/icons-material/Settings";

import { useDialog } from "hooks";

import { SettingsDialog } from "components/dialogs";
import { CustomListItemButton } from "../CustomListItemButton";

export const SettingsListItem = () => {
  const { onClose, onOpen, open } = useDialog();

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
