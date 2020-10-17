import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import SettingsIcon from "@material-ui/icons/Settings";
import ListItemText from "@material-ui/core/ListItemText";
import FeedbackIcon from "@material-ui/icons/Feedback";
import HelpIcon from "@material-ui/icons/Help";
import React from "react";
import { SettingsDialog } from "./SettingsDialog";

export const ApplicationList = () => {
  const [openSettingsDialog, setOpenSettingsDialog] = React.useState(false);

  const onOpenSettingsDialog = () => {
    setOpenSettingsDialog(true);
  };

  const onCloseSettingsDialog = () => {
    setOpenSettingsDialog(false);
  };

  return (
    <React.Fragment>
      <List dense>
        <ListItem button onClick={onOpenSettingsDialog}>
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

      <SettingsDialog
        onClose={onCloseSettingsDialog}
        open={openSettingsDialog}
      />
    </React.Fragment>
  );
};
