import React, { useEffect, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import { IconButton, Tooltip, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { LogoLoader } from "components/ui";
import { CustomAppBar } from "components/layout";
import { ExitAnnotatorDialog } from "../../components/dialogs";

import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import {
  selectActiveImageId,
  selectHasUnsavedChanges,
} from "views/ImageViewer/state/imageViewer/selectors";

import { HotkeyContext } from "utils/common/enums";

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
          annotatorSlice.actions.setSelectedAnnotationIds({
            annotationIds: [],
            workingAnnotationId: undefined,
          })
        );
        dispatch(
          annotatorSlice.actions.setWorkingAnnotation({
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
      <CustomAppBar>
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
      </CustomAppBar>

      <ExitAnnotatorDialog
        returnToProject={() => setReturnToProject(true)}
        onClose={onCloseExitAnnotatorDialog}
        open={ExitAnnotatorDialogOpen}
      />
    </>
  );
};
