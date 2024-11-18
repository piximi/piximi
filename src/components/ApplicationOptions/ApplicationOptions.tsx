import React from "react";
import { Divider, List } from "@mui/material";

import { SettingsListItem } from "./SettingsListItem";
import { SendFeedbackListItem } from "./SendFeedbackListItem";
import { HelpDrawer } from "components/HelpDrawer";

export const ApplicationOptions = () => {
  return (
    <List dense sx={{ mt: "auto" }}>
      <Divider />
      <SettingsListItem />

      <SendFeedbackListItem />

      <HelpDrawer />
    </List>
  );
};
