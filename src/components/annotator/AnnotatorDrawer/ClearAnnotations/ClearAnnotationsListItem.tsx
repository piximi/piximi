import { batch, useDispatch, useSelector } from "react-redux";

import { List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

import { useDialog, useTranslation } from "hooks";

import { DeleteAllAnnotationsDialog } from "../DeleteAllAnnotationsDialog";

import { unknownAnnotationCategorySelector } from "store/project";
import {
  annotatorImagesSelector,
  imageViewerSlice,
  selectedAnnotationsIdsSelector,
} from "store/image-viewer";

import { ShadowImageType } from "types";

export const ClearAnnotationsListItem = () => {
  const dispatch = useDispatch();

  const unknownAnnotationCategory = useSelector(
    unknownAnnotationCategorySelector
  );

  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);

  const annotatorImages = useSelector(annotatorImagesSelector);

  const {
    onClose: onCloseDeleteAllAnnotationsDialog,
    onOpen: onOpenDeleteAllAnnotationsDialog,
    open: openDeleteAllAnnotationsDialog,
  } = useDialog();

  const ClearAllAnnotationsHandler = () => {
    const existingAnnotations = annotatorImages
      .map((image: ShadowImageType) => {
        return [...image.annotations];
      })
      .flat();
    if (existingAnnotations.length) {
      onOpenDeleteAllAnnotationsDialog();
    }
  };

  const onClearSelectedAnnotations = () => {
    if (!selectedAnnotationsIds) return;
    batch(() => {
      dispatch(
        imageViewerSlice.actions.deleteImageInstances({
          ids: selectedAnnotationsIds,
        })
      );
      dispatch(
        imageViewerSlice.actions.setSelectedCategoryId({
          selectedCategoryId: unknownAnnotationCategory.id,
          execSaga: true,
        })
      );
      dispatch(
        imageViewerSlice.actions.setSelectedAnnotations({
          selectedAnnotations: [],
          selectedAnnotation: undefined,
        })
      );
    });
  };

  const t = useTranslation();

  return (
    <>
      <List dense>
        <ListItem button onClick={ClearAllAnnotationsHandler}>
          <ListItemIcon>
            <DeleteIcon color="disabled" />
          </ListItemIcon>
          <ListItemText primary={t("Clear all annotations")} />
        </ListItem>

        <DeleteAllAnnotationsDialog
          onClose={onCloseDeleteAllAnnotationsDialog}
          open={openDeleteAllAnnotationsDialog}
        />

        <ListItem button onClick={onClearSelectedAnnotations}>
          <ListItemIcon>
            <DeleteIcon color="disabled" />
          </ListItemIcon>
          <ListItemText primary={t("Clear selected annotations")} />
        </ListItem>
      </List>
    </>
  );
};
