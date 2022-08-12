import React from "react";
import { List } from "@mui/material";

import { SettingsListItem } from "../SettingsListItem";
import { HelpDrawer } from "../Help";
import { SendFeedbackListItem } from "../SendFeedbackListItem";

export const ApplicationOptionsList = () => {
  return (
    <List dense>
      <SettingsListItem />

      <SendFeedbackListItem />

      <HelpDrawer />
    </List>
  );
};
