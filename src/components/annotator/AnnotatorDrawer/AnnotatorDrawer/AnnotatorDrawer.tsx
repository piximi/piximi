import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import PopupState, { bindTrigger } from "material-ui-popup-state";
import {
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FolderOpen as FolderOpenIcon,
  Save as SaveIcon,
} from "@mui/icons-material";

import { useDialog, useTranslation } from "hooks";

import { DeleteAllAnnotationsDialog } from "../DeleteAllAnnotationsDialog";
import { ImageList } from "../ImageList";
import { OpenMenu } from "../OpenMenu/OpenMenu";
import { SaveMenu } from "../SaveMenu/SaveMenu";
import { CategoriesList } from "../CategoriesList";

import { AnnotatorAppBar } from "../../AnnotatorAppBar";
import { CreateCategoryDialog } from "../../CategoryDialog/CreateCategoryDialog";

import { AnnotatorHelpDrawer } from "components/common/Help";
import { SendFeedbackListItem } from "components/common/SendFeedbackListItem";

import {
  annotatorImagesSelector,
  selectedAnnotationsIdsSelector,
  unknownAnnotationCategorySelector,
} from "store/selectors";

import { imageViewerSlice } from "store/slices";

import { ShadowImageType } from "types";

export const AnnotatorDrawer = () => {
  const unknownAnnotationCategory = useSelector(
    unknownAnnotationCategorySelector
  );

  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);

  const annotatorImages = useSelector(annotatorImagesSelector);

  const dispatch = useDispatch();

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
    <Drawer
      anchor="left"
      sx={{
        flexShrink: 0,
        width: (theme) => theme.spacing(32),
        "& > .MuiDrawer-paper": {
          width: (theme) => theme.spacing(32),
        },
      }}
      open
      variant="persistent"
    >
      <AnnotatorAppBar />

      <Divider />

      <List dense>
        <OpenListItem />
        <SaveListItem />
      </List>

      <Divider />

      <ImageList annotatorImages={annotatorImages} />

      <Divider />

      <CategoriesList />

      <Divider />

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

      <Divider />

      <List dense>
        <SendFeedbackListItem />
        <AnnotatorHelpDrawer />
      </List>
    </Drawer>
  );
};

const OpenListItem = () => {
  return (
    <PopupState variant="popover">
      {(popupState) => (
        <>
          <ListItem button {...bindTrigger(popupState)}>
            <ListItemIcon>
              <FolderOpenIcon />
            </ListItemIcon>

            <ListItemText primary="Open" />
          </ListItem>

          <OpenMenu popupState={popupState} />
        </>
      )}
    </PopupState>
  );
};

const SaveListItem = () => {
  const t = useTranslation();

  return (
    <>
      <PopupState variant="popover">
        {(popupState) => (
          <>
            <ListItem button {...bindTrigger(popupState)}>
              <ListItemIcon>
                <SaveIcon />
              </ListItemIcon>

              <ListItemText primary={t("Save")} />
            </ListItem>
            <SaveMenu popupState={popupState} />
          </>
        )}
      </PopupState>
    </>
  );
};
