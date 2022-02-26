import React from "react";
import { SettingsListItem } from "../SettingsListItem";
import { HelpListItem } from "../HelpListItem";
import { List } from "@mui/material";
import { SendFeedbackListItem } from "components/common/SendFeedbackListItem";

export const ApplicationList = () => {
  return (
    <List dense>
      <SettingsListItem />

      <SendFeedbackListItem />

      <HelpListItem />
    </List>
  );
};
