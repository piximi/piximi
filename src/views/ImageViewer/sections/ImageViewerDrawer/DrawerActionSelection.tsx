import { useDispatch } from "react-redux";
import { Divider, IconButton, Stack } from "@mui/material";
import {
  DownloadOutlined as DownloadIcon,
  LabelOutlined as LabelIcon,
  ImageOutlined as ImageIcon,
  FormatShapes as FormatShapesIcon,
  AltRoute as AltRouteIcon,
} from "@mui/icons-material";

import { SettingsButton } from "components/layout/app-drawer/application-settings/SettingsButton";
import { SendFeedbackButton } from "components/layout/app-drawer/SendFeedbackButton";
import { HelpButton } from "components/layout/app-drawer/HelpButton";

import { DIMENSIONS } from "utils/constants";

import { ReturnToProjectButton } from "./ReturnToProjectButton";
import { useSetDrawerView } from "views/ImageViewer/state/DrawerViewContext";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";

export const DrawerActionSelection = () => {
  const dispatch = useDispatch();
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
            dispatch(imageViewerSlice.actions.setTrackletView(false));
            setDrawerView("export");
          }}
          size="small"
        >
          <DownloadIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            dispatch(imageViewerSlice.actions.setTrackletView(false));
            setDrawerView("images");
          }}
          size="small"
        >
          <ImageIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            dispatch(imageViewerSlice.actions.setTrackletView(false));
            setDrawerView("categories");
          }}
          size="small"
        >
          <LabelIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            dispatch(imageViewerSlice.actions.setTrackletView(false));
            setDrawerView("annotations");
          }}
          size="small"
        >
          <FormatShapesIcon />
        </IconButton>
        <Divider />
        <IconButton
          onClick={() => {
            dispatch(imageViewerSlice.actions.setTrackletView(true));
            setDrawerView("tracking");
          }}
          size="small"
        >
          <AltRouteIcon />
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
