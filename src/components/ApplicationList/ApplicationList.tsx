import React from "react";

import { List } from "@mui/material";

import { SettingsListItem } from "components/SettingsListItem";

import { ClassifierHelpDrawer } from "components/common/Help";
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
