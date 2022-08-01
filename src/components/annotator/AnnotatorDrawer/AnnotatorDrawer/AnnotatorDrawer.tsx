import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import PopupState, { bindTrigger } from "material-ui-popup-state";
import Drawer from "@mui/material/Drawer";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import IconButton from "@mui/material/IconButton";
import { Chip, Divider } from "@mui/material";
import List from "@mui/material/List";
import ListItemIcon from "@mui/material/ListItemIcon";

import DeleteIcon from "@mui/icons-material/Delete";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SaveIcon from "@mui/icons-material/Save";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AddIcon from "@mui/icons-material/Add";

import { useDialog } from "hooks";
import { useTranslation } from "hooks/useTranslation";

import { CategoryListItemCheckbox } from "../CategoryListItemCheckbox";
import { CategoryMenu } from "../CategoryMenu";
import { DeleteCategoryDialog } from "../DeleteCategoryDialog";
import { EditCategoryDialog } from "../../CategoryDialog/EditCategoryDialog";
import { CreateCategoryDialog } from "../../CategoryDialog/CreateCategoryDialog";
import { DeleteAllAnnotationsDialog } from "../DeleteAllAnnotationsDialog";
import { ClearCategoryDialog } from "../ClearCategoryDialog";
import { DeleteAllCategoriesDialog } from "../DeleteAllCategoriesDialog";
import { SaveMenu } from "../SaveMenu/SaveMenu";
import { OpenMenu } from "../OpenMenu/OpenMenu";
import { DeleteAllCategoriesListItem } from "../DeleteAllCategoriesListItem";
import { AnnotatorAppBar } from "../../AnnotatorAppBar";
import { ImageList } from "../ImageList";

import { CollapsibleList } from "components/common/CollapsibleList";
import { AnnotatorHelpDrawer } from "components/common/Help";
import { SendFeedbackListItem } from "components/common/SendFeedbackListItem";

import { selectedAnnotationsIdsSelector } from "store/selectors/selectedAnnotationsIdsSelector";
import { annotatorImagesSelector } from "store/selectors/annotatorImagesSelector";
import { createdAnnotatorCategoriesSelector } from "store/selectors/createdAnnotatorCategoriesSelector";
import {
  categoryCountsSelector,
  selectedCategorySelector,
  unknownAnnotationCategorySelector,
} from "store/selectors";

import { imageViewerSlice } from "store/slices";

import { Category } from "types/Category";
import { ShadowImageType } from "types/ImageType";

export const AnnotatorDrawer = () => {
  const createdCategories = useSelector(createdAnnotatorCategoriesSelector);
  const unknownAnnotationCategory = useSelector(
    unknownAnnotationCategorySelector
  );

  const selectedCategory = useSelector(selectedCategorySelector);

  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);

  const categoryCounts = useSelector(categoryCountsSelector);

  const annotatorImages = useSelector(annotatorImagesSelector);

  const dispatch = useDispatch();

  const {
    onClose: onCloseDeleteCategoryDialog,
    onOpen: onOpenDeleteCategoryDialog,
    open: openDeleteCategoryDialog,
  } = useDialog();

  const {
    onClose: onCloseDeleteAllCategoriesDialog,
    onOpen: onOpenDeleteAllCategoriesDialog,
    open: openDeleteAllCategoriesDialog,
  } = useDialog();

  const {
    onClose: onCloseEditCategoryDialog,
    onOpen: onOpenEditCategoryDialog,
    open: openEditCategoryDialog,
  } = useDialog();

  const {
    onClose: onCloseClearCategoryDialog,
    onOpen: onOpenClearCategoryDialog,
    open: openClearCategoryDialog,
  } = useDialog();

  const {
    onClose: onCloseDeleteAllAnnotationsDialog,
    onOpen: onOpenDeleteAllAnnotationsDialog,
    open: openDeleteAllAnnotationsDialog,
  } = useDialog();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const onCategoryClick = (
    event: React.MouseEvent<HTMLDivElement>,
    category: Category
  ) => {
    dispatch(
      imageViewerSlice.actions.setSelectedCategoryId({
        selectedCategoryId: category.id,
      })
    );
  };

  const onCategoryMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    category: Category
  ) => {
    dispatch(
      imageViewerSlice.actions.setSelectedCategoryId({
        selectedCategoryId: category.id,
      })
    );
    setAnchorEl(event.currentTarget);
  };

  const onCategoryMenuClose = () => {
    setAnchorEl(null);
  };

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

      <CollapsibleList closed dense primary={t("Categories")}>
        {unknownAnnotationCategory && (
          <div key={unknownAnnotationCategory.id}>
            <ListItem
              button
              id={unknownAnnotationCategory.id}
              onClick={(event) =>
                onCategoryClick(event, unknownAnnotationCategory)
              }
              selected={unknownAnnotationCategory.id === selectedCategory.id}
            >
              <CategoryListItemCheckbox category={unknownAnnotationCategory} />

              <ListItemText
                id={unknownAnnotationCategory.id}
                primary={t(unknownAnnotationCategory.name)}
                primaryTypographyProps={{ noWrap: true }}
              />
              {categoryCounts[unknownAnnotationCategory.id] !== 0 && (
                <Chip
                  label={categoryCounts[unknownAnnotationCategory.id]}
                  size="small"
                />
              )}
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={(event) =>
                    onCategoryMenuOpen(event, unknownAnnotationCategory)
                  }
                >
                  <MoreHorizIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>

            <CategoryMenu
              anchorElCategoryMenu={anchorEl}
              onCloseCategoryMenu={onCategoryMenuClose}
              onOpenCategoryMenu={(event) =>
                onCategoryMenuOpen(event, unknownAnnotationCategory)
              }
              onOpenDeleteCategoryDialog={onOpenDeleteCategoryDialog}
              onOpenEditCategoryDialog={onOpenEditCategoryDialog}
              openCategoryMenu={Boolean(anchorEl)}
              onOpenClearCategoryDialog={onOpenClearCategoryDialog}
            />
          </div>
        )}

        {createdCategories.map((category: Category, idx: number) => {
          return (
            <div key={idx}>
              <ListItem
                button
                id={String(idx)}
                onClick={(event) => onCategoryClick(event, category)}
                selected={category.id === selectedCategory.id}
              >
                <CategoryListItemCheckbox category={category} />

                <ListItemText
                  id={String(idx)}
                  primary={category.name}
                  primaryTypographyProps={{ noWrap: true }}
                />
                {categoryCounts[category.id] !== 0 && (
                  <Chip label={categoryCounts[category.id]} size="small" />
                )}

                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={(event) => onCategoryMenuOpen(event, category)}
                  >
                    <MoreHorizIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>

              <CategoryMenu
                anchorElCategoryMenu={anchorEl}
                onCloseCategoryMenu={onCategoryMenuClose}
                onOpenCategoryMenu={(event) =>
                  onCategoryMenuOpen(event, category)
                }
                onOpenDeleteCategoryDialog={onOpenDeleteCategoryDialog}
                onOpenEditCategoryDialog={onOpenEditCategoryDialog}
                onOpenClearCategoryDialog={onOpenClearCategoryDialog}
                openCategoryMenu={Boolean(anchorEl)}
              />
            </div>
          );
        })}

        <DeleteCategoryDialog
          onClose={onCloseDeleteCategoryDialog}
          open={openDeleteCategoryDialog}
        />

        <EditCategoryDialog
          onCloseDialog={onCloseEditCategoryDialog}
          openDialog={openEditCategoryDialog}
        />

        <ClearCategoryDialog
          onClose={onCloseClearCategoryDialog}
          open={openClearCategoryDialog}
        />

        <CreateCategoryListItem />
        <DeleteAllCategoriesListItem
          onOpenDeleteAllCategoriesDialog={onOpenDeleteAllCategoriesDialog}
        />
        <DeleteAllCategoriesDialog
          onClose={onCloseDeleteAllCategoriesDialog}
          open={openDeleteAllCategoriesDialog}
        />
      </CollapsibleList>

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

const CreateCategoryListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  const t = useTranslation();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>

        <ListItemText primary={t("Create category")} />
      </ListItem>
      <CreateCategoryDialog onClose={onClose} open={open} />
    </>
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
