import React, { useEffect, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { LogoLoader } from "components/ui";
import { ExitAnnotatorDialog } from "../../components/dialogs";

import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import {
  selectActiveImageId,
  selectHasUnsavedChanges,
} from "views/ImageViewer/state/imageViewer/selectors";

import { HotkeyContext } from "utils/enums";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const ImageViewerLogo = () => {
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
          imageViewerSlice.actions.setActiveImageSeriesId({
            imageId: undefined,
            prevImageId: activeImageId,
          }),
        );
        dispatch(imageViewerSlice.actions.setImageStack({ images: {} }));
        dispatch(
          annotatorSlice.actions.setSelectedAnnotationIds({
            annotationIds: [],
            workingAnnotationId: undefined,
          }),
        );
        dispatch(
          annotatorSlice.actions.setWorkingAnnotation({
            annotation: undefined,
          }),
        );
      });
      navigate("/project");
    }
  };

  useEffect(() => {
    //NOTE: Wait until ExitAnnotatorDialogOpen is finished updating. Otherwise unmounted component access warning
    if (returnToProject && !ExitAnnotatorDialogOpen) navigate("/project");
  }, [returnToProject, ExitAnnotatorDialogOpen, navigate]);

  return (
    <>
      <Stack
        direction="row"
        justifyContent="flex-start"
        alignItems="center"
        pl={2}
      >
        <Tooltip title="Save and return to project" placement="bottom">
          <IconButton
            data-help={HelpItem.NavigateProjectView}
            edge="start"
            onClick={() => handleReturnToMainProject()}
            aria-label="Exit Annotator"
            href={""}
          >
            <ArrowBack />
          </IconButton>
        </Tooltip>
        <LogoLoader width={30} height={20} loadPercent={1} fullLogo={false} />
        <Typography variant="h6" color={"#02aec5"}>
          Image Viewer
        </Typography>
      </Stack>

      <ExitAnnotatorDialog
        returnToProject={() => setReturnToProject(true)}
        onClose={onCloseExitAnnotatorDialog}
        open={ExitAnnotatorDialogOpen}
      />
    </>
  );
};
