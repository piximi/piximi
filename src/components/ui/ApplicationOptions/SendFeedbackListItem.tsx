import React from "react";

import { Feedback as FeedbackIcon } from "@mui/icons-material";

import { useDialog } from "hooks";

import { SendFeedbackDialog } from "components/dialogs";
import { CustomListItemButton } from "../CustomListItemButton";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const SendFeedbackListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <>
      <CustomListItemButton
        data-help={HelpItem.SendFeedback}
        primaryText="Send Feedback"
        onClick={onOpen}
        icon={<FeedbackIcon />}
      />

      <SendFeedbackDialog onClose={onClose} open={open} />
    </>
  );
};
