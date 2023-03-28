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

import {
  AnnotatorSlice,
  selectedAnnotationsIdsSelector,
} from "store/annotator";
import { selectSelectedImages, selectStagedAnnotations } from "store/data";

import { ShadowImageType, UNKNOWN_ANNOTATION_CATEGORY_ID } from "types";

export const ClearAnnotationsListItem = () => {
  const dispatch = useDispatch();

  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);
  const stagedAnnotations = useSelector(selectStagedAnnotations);

  const annotatorImages = useSelector(selectSelectedImages).map((image) => {
    return { ...image, annotations: [] } as ShadowImageType;
  });

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
        AnnotatorSlice.actions.setSelectedAnnotationIds({
          selectedAnnotationIds: [],
          workingAnnotationId: undefined,
        })
      );
      dispatch(
        AnnotatorSlice.actions.setSelectedCategoryId({
          selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
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
