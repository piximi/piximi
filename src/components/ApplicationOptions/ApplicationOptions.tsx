import React from "react";
import { Divider, List } from "@mui/material";

import { HelpDrawer } from "../HelpDrawer";
import { SettingsListItem } from "./SettingsListItem";
import { SendFeedbackListItem } from "./SendFeedbackListItem";

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
