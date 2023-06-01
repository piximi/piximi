import { useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

import { useDialog, useTranslation } from "hooks";

import { DialogWithAction } from "components/common/dialogs";
import {
  imageViewerSlice,
  selectActiveAnnotationIds,
  selectSelectedAnnotationIds,
} from "store/imageViewer";
import { dataSlice } from "store/data";

type DeleteType = "ALL" | "SELECTED";
export const ClearAnnotationsGroup = () => {
  const dispatch = useDispatch();
  const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);
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
          imageViewerSlice.actions.removeSelectedAnnotationIds({
            annotationIds: selectedAnnotationsIds,
          })
        );
        dispatch(
          imageViewerSlice.actions.removeActiveAnnotationIds({
            annotationIds: selectedAnnotationsIds,
          })
        );
        dispatch(
          dataSlice.actions.deleteAnnotations({
            annotationIds: selectedAnnotationsIds,
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
    <>
      <List dense>
        <ListItemButton
          onClick={() => handleOpenAndTrack("ALL")}
          disabled={activeAnnotationsIds.length === 0}
        >
          <ListItemIcon>
            <DeleteIcon color="disabled" />
          </ListItemIcon>
          <ListItemText primary={t("Clear all annotations")} />
        </ListItemButton>

        <DialogWithAction
          title={`Delete ${deleteOp}  annotations`}
          content={`${
            deleteOp === "ALL"
              ? activeAnnotationsIds.length
              : selectActiveAnnotationIds.length
          } annotations will be deleted`}
          handleConfirmCallback={handleDeleteAnnotations}
          onClose={handleCloseDeleteAnnotationsDialog}
          open={isDeleteAnnotationsDialogOpen}
        />

        <ListItemButton
          onClick={() => handleOpenAndTrack("SELECTED")}
          disabled={selectedAnnotationsIds.length === 0}
        >
          <ListItemIcon>
            <DeleteIcon color="disabled" />
          </ListItemIcon>
          <ListItemText primary={t("Clear selected annotations")} />
        </ListItemButton>
      </List>
    </>
  );
};
