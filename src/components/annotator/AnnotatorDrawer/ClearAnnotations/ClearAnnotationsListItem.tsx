import { batch, useDispatch, useSelector } from "react-redux";

import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

import { useDialog, useTranslation } from "hooks";

import { DeleteAllAnnotationsDialog } from "../DeleteAllAnnotationsDialog";

import { unknownAnnotationCategorySelector } from "store/project";
import {
  annotatorImagesSelector,
  AnnotatorSlice,
  selectedAnnotationsIdsSelector,
  stagedAnnotationsSelector,
} from "store/annotator";

import { ShadowImageType } from "types";

export const ClearAnnotationsListItem = () => {
  const dispatch = useDispatch();

  const unknownAnnotationCategory = useSelector(
    unknownAnnotationCategorySelector
  );

  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);
  const stagedAnnotations = useSelector(stagedAnnotationsSelector);

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
    if (
      existingAnnotations.length ||
      stagedAnnotations.length ||
      selectedAnnotationsIds.length
    ) {
      onOpenDeleteAllAnnotationsDialog();
    }
  };

  const onClearSelectedAnnotations = () => {
    if (!selectedAnnotationsIds) return;
    batch(() => {
      dispatch(
        AnnotatorSlice.actions.setStagedAnnotations({
          annotations: stagedAnnotations.filter(
            (annotation) => !selectedAnnotationsIds.includes(annotation.id)
          ),
        })
      );
      dispatch(
        AnnotatorSlice.actions.setSelectedAnnotations({
          selectedAnnotations: [],
          workingAnnotation: undefined,
        })
      );
      dispatch(
        AnnotatorSlice.actions.setSelectedCategoryId({
          selectedCategoryId: unknownAnnotationCategory.id,
          execSaga: true,
        })
      );
    });
  };

  const t = useTranslation();

  return (
    <>
      <List dense>
        <ListItemButton onClick={ClearAllAnnotationsHandler}>
          <ListItemIcon>
            <DeleteIcon color="disabled" />
          </ListItemIcon>
          <ListItemText primary={t("Clear all annotations")} />
        </ListItemButton>

        <DeleteAllAnnotationsDialog
          onClose={onCloseDeleteAllAnnotationsDialog}
          open={openDeleteAllAnnotationsDialog}
        />

        <ListItemButton onClick={onClearSelectedAnnotations}>
          <ListItemIcon>
            <DeleteIcon color="disabled" />
          </ListItemIcon>
          <ListItemText primary={t("Clear selected annotations")} />
        </ListItemButton>
      </List>
    </>
  );
};
