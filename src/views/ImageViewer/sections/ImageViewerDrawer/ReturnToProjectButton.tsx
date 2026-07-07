import React from "react";

import { batch, useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { ArrowBack } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { selectHasUnsavedChanges } from "@ImageViewer/state/image-viewer-data/selectors";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/imageViewerDataSlice";
import { ExitAnnotatorDialog } from "@ImageViewer/components/dialogs";

import { HotkeyContext } from "utils/enums";

export const ReturnToProjectButton = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasUnsavedChanged = useSelector(selectHasUnsavedChanges);

  const {
    onClose: onCloseExitAnnotatorDialog,
    onOpen: onOpenExitAnnotatorDialog,
    open: ExitAnnotatorDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleReturnToMainProject = () => {
    if (!hasUnsavedChanged) {
      navigate("/project");
      batch(() => {
        dispatch(imageViewerDataSlice.actions.resetState());
        dispatch(imageViewerSlice.actions.resetImageViewer());
        dispatch(annotatorSlice.actions.resetAnnotator());
      });
      return;
    }
    onOpenExitAnnotatorDialog();
  };

  return (
    <>
      <Tooltip title="Save and return to project" placement="bottom">
        <IconButton
          data-help={HelpItem.NavigateProjectView}
          onClick={() => handleReturnToMainProject()}
          aria-label="Exit Annotator"
        >
          <ArrowBack />
        </IconButton>
      </Tooltip>

      <ExitAnnotatorDialog
        onClose={onCloseExitAnnotatorDialog}
        open={ExitAnnotatorDialogOpen}
      />
    </>
  );
};
