import List from "@material-ui/core/List";
import React from "react";
import { SettingsListItem } from "../SettingsListItem";
import { HelpListItem } from "../HelpListItem";
import { SendFeedbackListItem } from "../SendFeedbackListItem";

export const ApplicationList = () => {
  return (
    <List dense>
      <SettingsListItem />

      <SendFeedbackListItem />

      <HelpListItem />
    </List>
  );
};
