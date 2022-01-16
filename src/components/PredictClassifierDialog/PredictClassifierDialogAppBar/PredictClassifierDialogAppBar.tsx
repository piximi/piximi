import * as React from "react";
import { createStyles } from "@mui/styles";
import {
  AppBar,
  IconButton,
  Theme,
  Toolbar,
  Tooltip,
  Box,
} from "@mui/material";
import {
  ArrowBack,
  PlayCircleOutline,
  ReplayRounded,
} from "@mui/icons-material";

export const PredictClassifierDialogAppBar = (props: any) => {
  const { closeDialog, fit } = props;

  return (
    <AppBar
      sx={{
        position: "relative",
        backgroundColor: "transparent",
        boxShadow: "none",
        borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
      }}
    >
      <Toolbar>
        <Tooltip title="Close Dialog" placement="bottom">
          <IconButton
            edge="start"
            color="primary"
            onClick={closeDialog}
            aria-label="Close"
            href={""}
          >
            <ArrowBack />
          </IconButton>
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="Predict the model" placement="bottom">
          <IconButton onClick={fit} href={""}>
            <PlayCircleOutline />
          </IconButton>
        </Tooltip>

        <IconButton disabled onClick={closeDialog} href={""}>
          <ReplayRounded />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};
