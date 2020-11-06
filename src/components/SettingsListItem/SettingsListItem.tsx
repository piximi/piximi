import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import SettingsIcon from "@material-ui/icons/Settings";
import ListItemText from "@material-ui/core/ListItemText";
import React from "react";
import { SettingsDialog } from "../SettingsDialog";
import { useDialog } from "../../hooks";

export const SettingsListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <React.Fragment>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <SettingsIcon />
        </ListItemIcon>

        <ListItemText primary="Settings" />
      </ListItem>

      <SettingsDialog onClose={onClose} open={open} />
    </React.Fragment>
  );
};
