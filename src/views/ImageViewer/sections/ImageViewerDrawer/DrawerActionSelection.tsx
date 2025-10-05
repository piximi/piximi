import { Divider, IconButton, Stack, useTheme } from "@mui/material";
import {
  DownloadOutlined as DownloadIcon,
  LabelOutlined as LabelIcon,
  ImageOutlined as ImageIcon,
  FormatShapes as FormatShapesIcon,
  AltRoute as AltRouteIcon,
} from "@mui/icons-material";
import React from "react";
import { useSetDrawerView } from "views/ImageViewer/state/DrawerViewContext";
import { ReturnToProjectButton } from "./ReturnToProjectButton";
import { SettingsButton } from "components/layout/app-drawer/application-settings/SettingsButton";
import { SendFeedbackButton } from "components/layout/app-drawer/SendFeedbackButton";
import { HelpButton } from "components/layout/app-drawer/HelpButton";
import { DIMENSIONS } from "utils/constants";
import { useSetShowTracklets } from "views/ImageViewer/state/TrackletContext";

export const DrawerActionSelection = () => {
  const setDrawerView = useSetDrawerView();
  const setShowTracks = useSetShowTracklets();
  const theme = useTheme();
  return (
    <Stack
      sx={(theme) => ({
        bgcolor: theme.palette.background.paper,
        //borderRight: `1px solid ${theme.palette.divider}`,
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
            setShowTracks(false);
            setDrawerView("export");
          }}
          size="small"
        >
          <DownloadIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            setShowTracks(false);
            setDrawerView("images");
          }}
          size="small"
        >
          <ImageIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            setShowTracks(false);
            setDrawerView("categories");
          }}
          size="small"
        >
          <LabelIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            setShowTracks(false);
            setDrawerView("annotations");
          }}
          size="small"
        >
          <FormatShapesIcon />
        </IconButton>
        <Divider />
        <IconButton
          onClick={() => {
            setShowTracks(true);
            setDrawerView("tracking");
          }}
          size="small"
        >
          <AltRouteIcon />
          {/* <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path
              d="M 4 20 Q 8 8, 12 12 T 20 4"
              fill="none"
              stroke={theme.palette.text.primary}
              strokeWidth="2"
              strokeDasharray="2,3"
              strokeLinecap="round"
            />

            <circle cx="4" cy="20" r="4" fill={theme.palette.text.primary} />
            <circle cx="20" cy="4" r="4" fill={theme.palette.text.primary} />
          </svg> */}
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
