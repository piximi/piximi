import React from "react";

import { List } from "@mui/material";

import { SettingsListItem } from "components/main/MainList/SettingsListItem";

import { ClassifierHelpDrawer } from "components/common/Help";
import { SendFeedbackListItem } from "components/common/SendFeedbackListItem";

export const MainList = () => {
  return (
    <List dense>
      <SettingsListItem />

      <SendFeedbackListItem />

      <ClassifierHelpDrawer />
    </List>
  );
};
