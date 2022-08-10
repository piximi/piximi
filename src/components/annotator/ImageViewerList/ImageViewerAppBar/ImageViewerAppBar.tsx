import React from "react";
import { useNavigate } from "react-router-dom";

import { ArrowBack } from "@mui/icons-material";
import {
  AppBar,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import { useDialog } from "hooks";

import { ExitAnnotatorDialog } from "../ExitAnnotatorDialog";

import { LogoIcon } from "components/Application/Logo";

export const ImageViewerAppBar = () => {
  const {
    onClose: onCloseExitAnnotatorDialog,
    onOpen: onOpenExitAnnotatorDialog,
    open: openExitAnnotatorDialog,
  } = useDialog();

  const navigate = useNavigate();

  const onReturnToMainProject = () => {
    onCloseExitAnnotatorDialog();
    navigate("/");
  };

  return (
    <>
      <AppBar
        color="default"
        sx={{
          backgroundColor: "rgba(0, 0, 0, 0)",
          boxShadow: "none",
          position: "absolute",
        }}
      >
        <Toolbar>
          <Tooltip title="Save and return to project" placement="bottom">
            <IconButton
              edge="start"
              onClick={onOpenExitAnnotatorDialog}
              aria-label="Exit Annotator"
              href={""}
            >
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <LogoIcon width={30} height={30} />
          <Typography variant="h5" color={"#02aec5"}>
            Annotator
          </Typography>
        </Toolbar>
      </AppBar>

      <ExitAnnotatorDialog
        onReturnToProject={onReturnToMainProject}
        onClose={onCloseExitAnnotatorDialog}
        open={openExitAnnotatorDialog}
      />
    </>
  );
};
