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

import { DeleteObjectsDialog } from "components/common/dialogs";
import {
  imageViewerSlice,
  selectActiveAnnotationIds,
  selectSelectedAnnotationIds,
} from "store/imageViewer";
import { dataSlice } from "store/data";

type DeleteType = "all" | "selected";
//TODO :Figurte out why only seeing one annotatin on delete selected
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
    if (deleteOp === "all") {
      batch(() => {
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
      });
    } else {
      batch(() => {
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
      });
    }
  };

  const t = useTranslation();

  return (
    <>
      <List dense>
        <ListItemButton
          onClick={() => handleOpenAndTrack("all")}
          disabled={activeAnnotationsIds.length === 0}
        >
          <ListItemIcon>
            <DeleteIcon color="disabled" />
          </ListItemIcon>
          <ListItemText primary={t("Clear all annotations")} />
        </ListItemButton>

        <DeleteObjectsDialog
          title={`Delete ${deleteOp}  annotations`}
          content={`${
            deleteOp === "all"
              ? activeAnnotationsIds.length
              : selectActiveAnnotationIds.length
          } annotations will be deleted`}
          deleteObjectCallback={handleDeleteAnnotations}
          onClose={handleCloseDeleteAnnotationsDialog}
          open={isDeleteAnnotationsDialogOpen}
        />

        <ListItemButton
          onClick={() => handleOpenAndTrack("selected")}
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
