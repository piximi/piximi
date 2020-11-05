import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import FeedbackIcon from "@material-ui/icons/Feedback";
import React from "react";

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
