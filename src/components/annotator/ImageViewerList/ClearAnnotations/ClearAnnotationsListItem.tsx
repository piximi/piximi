import { List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDialog } from "hooks";
import { ShadowImageType } from "types/ImageType";
import { batch, useDispatch, useSelector } from "react-redux";
import { unknownAnnotationCategorySelector } from "store/selectors";
import { annotatorImagesSelector } from "store/selectors/annotatorImagesSelector";
import { imageViewerSlice } from "store/slices";
import { useTranslation } from "hooks/useTranslation";
import { DeleteAllAnnotationsDialog } from "../DeleteAllAnnotationsDialog";
import { selectedAnnotationsIdsSelector } from "store/selectors/selectedAnnotationsIdsSelector";

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

  const onClearAllAnnotations = () => {
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
        <ListItem button onClick={onClearAllAnnotations}>
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
