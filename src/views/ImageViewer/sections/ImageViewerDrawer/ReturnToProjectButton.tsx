import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { ConfirmImageViewerChangesDialog } from "../../components/dialogs";

import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { annotatorSlice } from "views/ImageViewer/state/annotator";

import { HotkeyContext } from "utils/enums";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { selectHasUnsavedChanges } from "views/ImageViewer/state/image-viewer-data/selectors";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import { useSavedDataState } from "views/ImageViewer/state/DataContext";

export const ReturnToProjectButton = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { savedData } = useSavedDataState();
  const hasUnsavedChanged = useSelector(selectHasUnsavedChanges);

  const {
    onClose: onCloseExitAnnotatorDialog,
    onOpen: onOpenExitAnnotatorDialog,
    open: ExitAnnotatorDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleReturnToMainProject = () => {
    if (!hasUnsavedChanged) {
      if (savedData) {
        console.log(savedData);
        Object.values(savedData.images.entities).forEach((image) =>
          image.data.dispose(),
        );
        Object.values(savedData.annotations.entities).forEach((annotation) =>
          annotation.data.dispose(),
        );
      }
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

      <ConfirmImageViewerChangesDialog
        onClose={onCloseExitAnnotatorDialog}
        open={ExitAnnotatorDialogOpen}
      />
    </>
  );
};
