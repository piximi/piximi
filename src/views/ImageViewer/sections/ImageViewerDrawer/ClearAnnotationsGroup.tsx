import { useMemo, useState } from "react";
import { intersection } from "lodash";
import { batch, useDispatch, useSelector } from "react-redux";
import { List } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

import { useDialogHotkey, useTranslation } from "hooks";

import { ConfirmationDialog } from "components/dialogs";
import { CustomListItemButton } from "components/ui";

import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectSelectedAnnotationIds } from "views/ImageViewer/state/annotator/selectors";
import {
  selectUpdatedActiveAnnotations,
  selectSelectedActiveAnnotations,
} from "views/ImageViewer/state/annotator/reselectors";

import { HotkeyContext } from "utils/enums";
import { selectActiveImageObjectIds } from "views/ImageViewer/state/imageViewer/reselectors";

type DeleteType = "ALL" | "SELECTED";
export const ClearAnnotationsGroup = () => {
  const dispatch = useDispatch();
  const selectedAnnotationIds = useSelector(selectSelectedAnnotationIds);
  const activeSelectedAnnotations = useSelector(
    selectSelectedActiveAnnotations,
  );
  const activeAnnotationsIds = useSelector(selectActiveImageObjectIds);
  const activeAnnotations = useSelector(selectUpdatedActiveAnnotations);
  const [deleteOp, setDeleteOp] = useState<DeleteType>();

  const selectedActiveAnnotationIds = useMemo(() => {
    if (selectedAnnotationIds.length === 0 || activeAnnotationsIds.length === 0)
      return [];
    return intersection(activeAnnotationsIds, selectedAnnotationIds);
  }, [selectedAnnotationIds, activeAnnotationsIds]);

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
        dispatch(
          annotatorSlice.actions.setSelectedAnnotationIds({
            annotationIds: [],
            workingAnnotationId: undefined,
          }),
        );
        dispatch(
          imageViewerSlice.actions.removeActiveAnnotationIds({
            annotationIds: activeAnnotationsIds,
          }),
        );
        dispatch(
          annotatorSlice.actions.deleteThings({
            things: activeAnnotations,
          }),
        );
      } else {
        dispatch(
          imageViewerSlice.actions.removeActiveAnnotationIds({
            annotationIds: selectedAnnotationIds,
          }),
        );
        dispatch(
          annotatorSlice.actions.setSelectedAnnotationIds({
            annotationIds: [],
            workingAnnotationId: undefined,
          }),
        );
        dispatch(
          annotatorSlice.actions.deleteThings({
            things: activeSelectedAnnotations,
          }),
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
        disabled={activeAnnotationsIds.length === 0}
        icon={<DeleteIcon color="disabled" />}
      />

      <ConfirmationDialog
        title={`Delete ${deleteOp}  annotations`}
        content={`${
          deleteOp === "ALL"
            ? activeAnnotationsIds.length
            : selectedActiveAnnotationIds.length
        } annotations will be deleted`}
        onConfirm={handleDeleteAnnotations}
        onClose={handleCloseDeleteAnnotationsDialog}
        isOpen={isDeleteAnnotationsDialogOpen}
      />

      <CustomListItemButton
        primaryText={t("Clear selected annotations")}
        onClick={() => handleOpenAndTrack("SELECTED")}
        disabled={selectedAnnotationIds.length === 0}
        icon={<DeleteIcon color="disabled" />}
      />
    </List>
  );
};
