import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import SettingsIcon from "@material-ui/icons/Settings";
import ListItemText from "@material-ui/core/ListItemText";
import FeedbackIcon from "@material-ui/icons/Feedback";
import HelpIcon from "@material-ui/icons/Help";
import React from "react";
import { SettingsDialog } from "../SettingsDialog";
import { useDialog } from "../../../../hooks";

export const ApplicationList = () => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <React.Fragment>
      <List dense>
        <ListItem button onClick={onOpen}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>

          <ListItemText primary="Settings" />
        </ListItem>

        <ListItem button disabled>
          <ListItemIcon>
            <FeedbackIcon />
          </ListItemIcon>

          <ListItemText primary="Send feedback" />
        </ListItem>

        <ListItem button disabled>
          <ListItemIcon>
            <HelpIcon />
          </ListItemIcon>

          <ListItemText primary="Help" />
        </ListItem>
      </List>

      <SettingsDialog onClose={onClose} open={open} />
    </React.Fragment>
  );
};
