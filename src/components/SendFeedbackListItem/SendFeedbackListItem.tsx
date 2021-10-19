import React from "react";
import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import FeedbackIcon from "@mui/icons-material/Feedback";

export const SendFeedbackListItem = () => {
  return (
    <ListItem button disabled>
      <ListItemIcon>
        <FeedbackIcon />
      </ListItemIcon>

      <ListItemText primary="Send feedback" />
    </ListItem>
  );
};
