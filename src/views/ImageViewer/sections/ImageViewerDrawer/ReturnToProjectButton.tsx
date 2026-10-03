import { batch, useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { ArrowBack } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { HelpItem } from "help/HelpContent";

import { HotkeyContext } from "utils/enums";

import { selectHasUnsavedChanges } from "views/ImageViewer/state/imageViewerData/selectors";
import { imageViewerDataSlice } from "views/ImageViewer/state/imageViewerData";

import { annotatorSlice } from "@ImageViewer/state/annotator";

import { ExitAnnotatorDialog } from "./ExitAnnotatorDialog";

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
