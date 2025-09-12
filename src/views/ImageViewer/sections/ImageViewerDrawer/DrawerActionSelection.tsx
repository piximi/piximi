import { IconButton, Stack } from "@mui/material";
import {
  DownloadOutlined as DownloadIcon,
  LabelOutlined as LabelIcon,
  ImageOutlined as ImageIcon,
  FormatShapes as FormatShapesIcon,
} from "@mui/icons-material";
import React from "react";
import { useSetDrawerView } from "views/ImageViewer/state/DrawerViewContext";
import { ReturnToProjectButton } from "./ReturnToProjectButton";
import { SettingsButton } from "components/layout/app-drawer/application-settings/SettingsButton";
import { SendFeedbackButton } from "components/layout/app-drawer/SendFeedbackButton";
import { HelpButton } from "components/layout/app-drawer/HelpButton";
import { DIMENSIONS } from "utils/constants";

export const DrawerActionSelection = () => {
  const setDrawerView = useSetDrawerView();
  return (
    <Stack
      sx={(theme) => ({
        bgcolor: theme.palette.background.paper,
        //borderRight: `1px solid ${theme.palette.divider}`,
        height: "100%",
        justifyContent: "space-between",
        gridArea: "drawer-action-selection",
      })}
    >
      <Stack sx={{ width: DIMENSIONS.toolDrawerWidth + "px" }}>
        <ReturnToProjectButton />
        <IconButton onClick={() => setDrawerView("export")}>
          <DownloadIcon />
        </IconButton>
        <IconButton onClick={() => setDrawerView("images")}>
          <ImageIcon />
        </IconButton>
        <IconButton onClick={() => setDrawerView("categories")}>
          <LabelIcon />
        </IconButton>
        <IconButton onClick={() => setDrawerView("annotations")}>
          <FormatShapesIcon />
        </IconButton>
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
