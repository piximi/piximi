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

import { ExitAnnotatorDialog } from "sections/dialogs";

import { LogoLoader } from "components/LogoLoader";
import { HotkeyContext } from "utils/common/enums";
import { batch, useDispatch, useSelector } from "react-redux";
import { imageViewerSlice } from "store/imageViewer";
import { selectActiveImageId } from "store/imageViewer/selectors";
import { selectHasUnsavedChanges } from "store/project/selectors";

export const ImageViewerAppBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [returnToProject, setReturnToProject] = useState(false);
  const activeImageId = useSelector(selectActiveImageId);
  const hasUnsavedChanges = useSelector(selectHasUnsavedChanges);
  const {
    onClose: onCloseExitAnnotatorDialog,
    onOpen: onOpenExitAnnotatorDialog,
    open: ExitAnnotatorDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleReturnToMainProject = () => {
    if (hasUnsavedChanges) {
      onOpenExitAnnotatorDialog();
    } else {
      batch(() => {
        dispatch(
          imageViewerSlice.actions.setActiveImageId({
            imageId: undefined,
            prevImageId: activeImageId,
          })
        );
        dispatch(imageViewerSlice.actions.setImageStack({ imageIds: [] }));
        dispatch(
          imageViewerSlice.actions.setWorkingAnnotation({
            annotation: undefined,
          })
        );
      });
      navigate("/");
    }
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
              onClick={() => handleReturnToMainProject()}
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
        returnToProject={() => setReturnToProject(true)}
        onClose={onCloseExitAnnotatorDialog}
        open={ExitAnnotatorDialogOpen}
      />
    </>
  );
};
