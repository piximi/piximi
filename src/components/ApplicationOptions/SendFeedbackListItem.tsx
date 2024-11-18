import React from "react";

import FeedbackIcon from "@mui/icons-material/Feedback";

import { useDialog } from "hooks";

import { SendFeedbackDialog } from "sections/dialogs";
import { CustomListItemButton } from "../CustomListItemButton";

export const SendFeedbackListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <>
      <CustomListItemButton
        primaryText="Send Feedback"
        onClick={onOpen}
        icon={<FeedbackIcon />}
      />

      <SendFeedbackDialog onClose={onClose} open={open} />
    </>
  );
};
