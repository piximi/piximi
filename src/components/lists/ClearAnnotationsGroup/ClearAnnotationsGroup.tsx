import { useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { List } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

import { useDialog, useTranslation } from "hooks";

import { DialogWithAction } from "components/dialogs";
import {
  imageViewerSlice,
  selectActiveAnnotationIds,
  selectSelectedAnnotationIds,
} from "store/slices/imageViewer";
import { dataSlice } from "store/slices/data";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";

type DeleteType = "ALL" | "SELECTED";
export const ClearAnnotationsGroup = () => {
  const dispatch = useDispatch();
  const selectedAnnotationIds = useSelector(selectSelectedAnnotationIds);
  const activeAnnotationsIds = useSelector(selectActiveAnnotationIds);
  const [deleteOp, setDeleteOp] = useState<DeleteType>();

  const {
    onClose: handleCloseDeleteAnnotationsDialog,
    onOpen: handleOpenDeleteAnnotationsDialog,
    open: isDeleteAnnotationsDialogOpen,
  } = useDialog();

  const handleOpenAndTrack = (deleteType: DeleteType) => {
    setDeleteOp(deleteType);
    handleOpenDeleteAnnotationsDialog();
  };

  const handleDeleteAnnotations = () => {
    batch(() => {
      if (deleteOp === "ALL") {
        dispatch(
          imageViewerSlice.actions.removeSelectedAnnotationIds({
            annotationIds: activeAnnotationsIds,
          })
        );
        dispatch(
          imageViewerSlice.actions.removeActiveAnnotationIds({
            annotationIds: activeAnnotationsIds,
          })
        );
        dispatch(
          dataSlice.actions.deleteAnnotations({
            annotationIds: activeAnnotationsIds,
          })
        );
      } else {
        dispatch(
          imageViewerSlice.actions.removeActiveAnnotationIds({
            annotationIds: selectedAnnotationIds,
          })
        );
        dispatch(
          imageViewerSlice.actions.removeSelectedAnnotationIds({
            annotationIds: selectedAnnotationIds,
          })
        );
        dispatch(
          dataSlice.actions.deleteAnnotations({
            annotationIds: selectedAnnotationIds,
          })
        );
      }
      dispatch(
        imageViewerSlice.actions.setWorkingAnnotation({ annotation: undefined })
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

      <DialogWithAction
        title={`Delete ${deleteOp}  annotations`}
        content={`${
          deleteOp === "ALL"
            ? activeAnnotationsIds.length
            : selectActiveAnnotationIds.length
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
