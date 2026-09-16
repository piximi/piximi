import { Divider, Stack } from "@mui/material";
import {
  ImageOutlined as ImageIcon,
  FormatShapes as FormatShapesIcon,
} from "@mui/icons-material";

import { SettingsButton } from "components/app-drawer/application-settings/SettingsButton";
import { SendFeedbackButton } from "components/app-drawer/SendFeedbackButton";
import { HelpButton } from "components/app-drawer/HelpButton";
import { ToolButton } from "components/inputs";

import { DIMENSIONS } from "utils/constants";

import { useSetDrawerView } from "@ImageViewer/contexts/DrawerActionProvider";

import { ReturnToProjectButton } from "./ReturnToProjectButton";

export const DrawerActionTabSection = () => {
  const setDrawerView = useSetDrawerView();

  return (
    <Stack
      sx={(theme) => ({
        bgcolor: theme.palette.background.paper,
        height: "100%",
        justifyContent: "space-between",
        gridArea: "drawer-action-selection",
        borderRight: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Stack sx={{ width: DIMENSIONS.toolDrawerWidth + "px" }}>
        <ReturnToProjectButton />
        <ToolButton
          name="Images | Channels"
          onClick={() => {
            setDrawerView("images");
          }}
          icon={<ImageIcon />}
        />

        <ToolButton
          name="Annotations"
          onClick={() => {
            setDrawerView("annotations");
          }}
          icon={<FormatShapesIcon />}
        />

        <Divider />
      </Stack>

      <Stack
        sx={{ position: "relative", bottom: 0 }}
        direction="column"
        justifyContent="space-evenly"
      >
        <SettingsButton />

        <SendFeedbackButton />

        <HelpButton />
      </Stack>
    </Stack>
  );
};
