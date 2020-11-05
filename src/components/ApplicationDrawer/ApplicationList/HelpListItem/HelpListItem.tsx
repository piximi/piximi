import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import HelpIcon from "@material-ui/icons/Help";
import React from "react";

export const HelpListItem = () => {
  return (
    <ListItem button disabled>
      <ListItemIcon>
        <HelpIcon />
      </ListItemIcon>

      <ListItemText primary="Help" />
    </ListItem>
  );
};
