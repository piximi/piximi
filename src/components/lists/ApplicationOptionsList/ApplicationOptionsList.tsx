import React from "react";
import { List } from "@mui/material";

import { SettingsListItem } from "../../list-items/SettingsListItem";
import { HelpDrawer } from "components/drawers";
import { SendFeedbackListItem } from "../../list-items/SendFeedbackListItem";

export const ApplicationOptionsList = () => {
  return (
    <List dense sx={{ mt: "auto" }}>
      <SettingsListItem />

      <SendFeedbackListItem />

      <HelpDrawer />
    </List>
  );
};
