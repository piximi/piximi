import React from "react";
import { List } from "@mui/material";

import { HelpDrawer } from "components/drawers";
import { SendFeedbackListItem, SettingsListItem } from "components/list-items";

export const ApplicationOptionsList = () => {
  return (
    <List dense sx={{ mt: "auto" }}>
      <SettingsListItem />

      <SendFeedbackListItem />

      <HelpDrawer />
    </List>
  );
};
