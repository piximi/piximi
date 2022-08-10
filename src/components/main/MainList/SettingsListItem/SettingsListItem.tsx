import React from "react";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";

import { useDialog } from "hooks";

import { SettingsDialog } from "components/main/dialogs/SettingsDialog";

export const SettingsListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <SettingsIcon />
        </ListItemIcon>

        <ListItemText primary="Settings" />
      </ListItem>

      <SettingsDialog onClose={onClose} open={open} />
    </>
  );
};
