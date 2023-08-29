import React from "react";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

import FeedbackIcon from "@mui/icons-material/Feedback";

import { useDialog } from "hooks";

import { SendFeedbackDialog } from "../../../dialogs";

export const SendFeedbackListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <FeedbackIcon />
        </ListItemIcon>

        <ListItemText primary="Send feedback" />
      </ListItem>

      <SendFeedbackDialog onClose={onClose} open={open} />
    </>
  );
};
