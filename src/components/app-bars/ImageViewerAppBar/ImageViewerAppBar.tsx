import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ArrowBack } from "@mui/icons-material";
import {
  AppBar,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import { useDialogHotkey } from "hooks";

import { ExitAnnotatorDialog } from "components/dialogs";

import { LogoLoader } from "components/styled-components";
import { HotkeyContext } from "utils/common/enums";

export const ImageViewerAppBar = () => {
  const [returnToProject, setReturnToProject] = useState(false);
  const {
    onClose: onCloseExitAnnotatorDialog,
    onOpen: onOpenExitAnnotatorDialog,
    open: ExitAnnotatorDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const navigate = useNavigate();

  const onReturnToMainProject = () => {
    setReturnToProject(true);
  };

  useEffect(() => {
    //NOTE: Wait until ExitAnnotatorDialogOpen is finished updating. Otherwise unmounted component access warning
    if (returnToProject && !ExitAnnotatorDialogOpen) navigate("/");
  }, [returnToProject, ExitAnnotatorDialogOpen, navigate]);

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

      <ExitAnnotatorDialog
        returnToProject={onReturnToMainProject}
        onClose={onCloseExitAnnotatorDialog}
        open={ExitAnnotatorDialogOpen}
      />
    </>
  );
};
