import React from "react";
import { List } from "@mui/material";

import { SettingsListItem } from "../list-items/SettingsListItem";
import { HelpDrawer } from "../../help";
import { SendFeedbackListItem } from "../list-items/SendFeedbackListItem";

export const ApplicationOptionsList = () => {
  return (
    <List dense>
      <SettingsListItem />

      <SendFeedbackListItem />

      <HelpDrawer />
    </List>
  );
};
