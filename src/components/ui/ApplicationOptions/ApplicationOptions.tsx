import React from "react";
import { Divider, List } from "@mui/material";
import { Help as HelpIcon, Close as CloseIcon } from "@mui/icons-material";
import { HelpDrawer } from "../../layout";
import { SettingsListItem } from "./SettingsListItem";
import { SendFeedbackListItem } from "./SendFeedbackListItem";
import { CustomListItemButton } from "../CustomListItemButton";
import { useHelp } from "contexts";

export const ApplicationOptions = () => {
  const { helpMode: _helpMode, setHelpMode } = useHelp()!;
  return (
    <List dense sx={{ mt: "auto" }}>
      <Divider />
      <SettingsListItem />

      <SendFeedbackListItem />

      <CustomListItemButton
        primaryText="Help"
        onClick={() => setHelpMode((helpMode) => !helpMode)}
        icon={<HelpIcon />}
      />
    </List>
  );
};
