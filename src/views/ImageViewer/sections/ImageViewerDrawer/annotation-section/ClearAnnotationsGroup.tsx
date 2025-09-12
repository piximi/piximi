import { useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { List } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

import { useDialogHotkey, useTranslation } from "hooks";

import { ConfirmationDialog } from "components/dialogs";
import { CustomListItemButton } from "components/ui";

import { annotatorSlice } from "views/ImageViewer/state/annotator";

import { HotkeyContext } from "utils/enums";
import {
  selectActiveAnnotationIds,
  selectSelectedActiveAnnotationIds,
} from "views/ImageViewer/state/image-viewer-data/reselectors";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import { dataSlice } from "store/data";

type DeleteType = "ALL" | "SELECTED";
export const ClearAnnotationsGroup = () => {
  const dispatch = useDispatch();
  const activeSelectedAnnotationIds = useSelector(
    selectSelectedActiveAnnotationIds,
  );
  const activeAnnotationIds = useSelector(selectActiveAnnotationIds);
  const [deleteOp, setDeleteOp] = useState<DeleteType>();

  const {
    onClose: handleCloseDeleteAnnotationsDialog,
    onOpen: handleOpenDeleteAnnotationsDialog,
    open: isDeleteAnnotationsDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleOpenAndTrack = (deleteType: DeleteType) => {
    setDeleteOp(deleteType);
    handleOpenDeleteAnnotationsDialog();
  };

  const handleDeleteAnnotations = () => {
    batch(() => {
      if (deleteOp === "ALL") {
        dispatch(imageViewerDataSlice.actions.setSelectedAnnotationIds([]));
        dispatch(
          imageViewerDataSlice.actions.removeActiveAnnotationIds(
            activeAnnotationIds,
          ),
        );
        dispatch(dataSlice.actions.batchDeleteAnnotations(activeAnnotationIds));
      } else {
        dispatch(
          imageViewerDataSlice.actions.removeActiveAnnotationIds(
            activeSelectedAnnotationIds,
          ),
        );
        dispatch(imageViewerDataSlice.actions.setSelectedAnnotationIds([]));
        dispatch(
          dataSlice.actions.batchDeleteAnnotations(activeSelectedAnnotationIds),
        );
      }
      dispatch(
        annotatorSlice.actions.setWorkingAnnotation({
          annotation: undefined,
        }),
      );
    });
  };

  const t = useTranslation();

  return (
    <List dense>
      <CustomListItemButton
        primaryText={t("Clear all annotations")}
        onClick={() => handleOpenAndTrack("ALL")}
        disabled={activeAnnotationIds.length === 0}
        icon={<DeleteIcon color="disabled" />}
      />

      <ConfirmationDialog
        title={`Delete ${deleteOp}  annotations`}
        content={`${
          deleteOp === "ALL"
            ? activeAnnotationIds.length
            : activeSelectedAnnotationIds.length
        } annotations will be deleted`}
        onConfirm={handleDeleteAnnotations}
        onClose={handleCloseDeleteAnnotationsDialog}
        isOpen={isDeleteAnnotationsDialogOpen}
      />

      <CustomListItemButton
        primaryText={t("Clear selected annotations")}
        onClick={() => handleOpenAndTrack("SELECTED")}
        disabled={activeSelectedAnnotationIds.length === 0}
        icon={<DeleteIcon color="disabled" />}
      />
    </List>
  );
};
