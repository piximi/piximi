import React from "react";

import { List } from "@mui/material";

import { SettingsListItem } from "../SettingsListItem";
import { ClassifierHelpDrawer } from "../Help";
import { SendFeedbackListItem } from "../SendFeedbackListItem";

export const ApplicationOptionsList = () => {
  return (
    <List dense>
      <SettingsListItem />

      <SendFeedbackListItem />

      <ClassifierHelpDrawer />
    </List>
  );
};
