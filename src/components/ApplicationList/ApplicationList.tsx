import React from "react";
import { SettingsListItem } from "../SettingsListItem";
import { HelpListItem } from "../HelpListItem";
import { SendFeedbackListItem } from "../SendFeedbackListItem";
import { List } from "@mui/material";

export const ApplicationList = () => {
  return (
    <List dense>
      <SettingsListItem />

      <SendFeedbackListItem />

      <HelpListItem />
    </List>
  );
};
