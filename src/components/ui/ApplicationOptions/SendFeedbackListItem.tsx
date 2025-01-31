import React from "react";

import { Feedback as FeedbackIcon } from "@mui/icons-material";

import { useDialog } from "hooks";

import { SendFeedbackDialog } from "components/dialogs";
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
