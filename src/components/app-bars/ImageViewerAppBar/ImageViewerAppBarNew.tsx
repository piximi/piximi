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

import { ExitAnnotatorDialogNew } from "components/dialogs";

import { LogoLoader } from "components/styled-components";

export const ImageViewerAppBarNew = () => {
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
          <LogoLoader width={30} height={30} loadPercent={1} fullLogo={false} />
          <Typography variant="h5" color={"#02aec5"}>
            Annotator
          </Typography>
        </Toolbar>
      </AppBar>

      <ExitAnnotatorDialogNew
        onReturnToProject={onReturnToMainProject}
        onClose={onCloseExitAnnotatorDialog}
        open={openExitAnnotatorDialog}
      />
    </>
  );
};
