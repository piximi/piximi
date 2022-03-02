import React from "react";
import { SettingsListItem } from "../SettingsListItem";
import { ClassifierHelpDrawer } from "components/common/Help";
import { List } from "@mui/material";
import { SendFeedbackListItem } from "components/common/SendFeedbackListItem";

export const ApplicationList = () => {
  return (
    <List dense>
      <SettingsListItem />

      <SendFeedbackListItem />

      <ClassifierHelpDrawer />
    </List>
  );
};
