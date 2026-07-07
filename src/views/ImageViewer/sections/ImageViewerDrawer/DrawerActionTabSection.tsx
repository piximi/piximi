import { Divider, IconButton, Stack } from "@mui/material";
import {
  ImageOutlined as ImageIcon,
  FormatShapes as FormatShapesIcon,
} from "@mui/icons-material";

import { SettingsButton } from "components/layout/app-drawer/application-settings/SettingsButton";
import { SendFeedbackButton } from "components/layout/app-drawer/SendFeedbackButton";
import { HelpButton } from "components/layout/app-drawer/HelpButton";

import { useSetDrawerView } from "@ImageViewer/contexts/DrawerActionProvider";

import { DIMENSIONS } from "utils/constants";

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

        <IconButton
          onClick={() => {
            setDrawerView("images");
          }}
          size="small"
        >
          <ImageIcon />
        </IconButton>

        <IconButton
          onClick={() => {
            setDrawerView("annotations");
          }}
          size="small"
        >
          <FormatShapesIcon />
        </IconButton>
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
