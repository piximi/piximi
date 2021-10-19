import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import React from "react";
import HelpIcon from "@mui/icons-material/Help";

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
