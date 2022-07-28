import Drawer from "@mui/material/Drawer";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import React from "react";
import { Category } from "types/Category";
import {
  categoryCountsSelector,
  imageSelector,
  selectedCategorySelector,
  unknownAnnotationCategorySelector,
} from "store/selectors";
import { batch, useDispatch, useSelector } from "react-redux";
import { CollapsibleList } from "../CollapsibleList";
import { CategoryListItemCheckbox } from "../CategoryListItemCheckbox";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import IconButton from "@mui/material/IconButton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { CategoryMenu } from "../CategoryMenu";
import { DeleteCategoryDialog } from "../DeleteCategoryDialog";
import { EditCategoryDialog } from "../../CategoryDialog/EditCategoryDialog";
import { useDialog } from "hooks";
import { useTranslation } from "hooks/useTranslation";
import { Chip, Divider } from "@mui/material";
import List from "@mui/material/List";
import DeleteIcon from "@mui/icons-material/Delete";
import ListItemIcon from "@mui/material/ListItemIcon";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SaveIcon from "@mui/icons-material/Save";
import PopupState, { bindTrigger } from "material-ui-popup-state";
import AddIcon from "@mui/icons-material/Add";
import { CreateCategoryDialog } from "../../CategoryDialog/CreateCategoryDialog";
import { selectedAnnotationsIdsSelector } from "store/selectors/selectedAnnotationsIdsSelector";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import { ImageMenu } from "../ImageMenu";
import { DeleteAllAnnotationsDialog } from "../DeleteAllAnnotationsDialog";
import { SaveMenu } from "../SaveMenu/SaveMenu";
import { OpenMenu } from "../OpenMenu/OpenMenu";
import { AnnotatorHelpDrawer } from "components/common/Help";
import { ClearCategoryDialog } from "../ClearCategoryDialog";
import { imageViewerSlice, setActiveImage } from "store/slices";
import { ImageType, ShadowImageType } from "types/ImageType";
import { annotatorImagesSelector } from "store/selectors/annotatorImagesSelector";
import { createdAnnotatorCategoriesSelector } from "store/selectors/createdAnnotatorCategoriesSelector";
import { DeleteAllCategoriesListItem } from "../DeleteAllCategoriesListItem";
import { DeleteAllCategoriesDialog } from "../DeleteAllCategoriesDialog";
import { SendFeedbackListItem } from "components/common/SendFeedbackListItem";
import { AnnotatorAppBar } from "components/annotator/AnnotatorAppBar";

export const AnnotatorDrawer = () => {
  const createdCategories = useSelector(createdAnnotatorCategoriesSelector);
  const unknownAnnotationCategory = useSelector(
    unknownAnnotationCategorySelector
  );

  const selectedCategory = useSelector(selectedCategorySelector);

  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);

  const categoryCounts = useSelector(categoryCountsSelector);

  const currentImage = useSelector(imageSelector);

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

  const [imageAnchorEl, setImageAnchorEl] = React.useState<null | HTMLElement>(
    null
  );

  const [selectedImage, setSelectedImage] = React.useState<ImageType>(
    currentImage!
  );

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

  const onImageMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    image: ShadowImageType
  ) => {
    setImageAnchorEl(event.currentTarget);
    setSelectedImage(image as ImageType);
  };

  const onImageMenuClose = () => {
    setImageAnchorEl(null);
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

  const onImageItemClick = (
    evt: React.MouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>,
    image: ShadowImageType
  ) => {
    dispatch(setActiveImage({ imageId: image.id }));
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

      <CollapsibleList closed dense primary={t("Images")}>
        {annotatorImages.map((image: ShadowImageType) => {
          return (
            <div key={image.id}>
              <ListItem
                button
                id={image.id}
                onClick={(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
                  onImageItemClick(evt, image)
                }
                selected={image.id === currentImage?.id}
              >
                <ListItemAvatar>
                  <Avatar alt={image.name} src={image.src} variant={"square"} />
                </ListItemAvatar>
                <ListItemText
                  id={image.id}
                  primary={image.name}
                  primaryTypographyProps={{ noWrap: true }}
                />
                {image.annotations.length !== 0 && (
                  <Chip label={image.annotations.length} size="small" />
                )}
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={(event) => onImageMenuOpen(event, image)}
                  >
                    <MoreHorizIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </div>
          );
        })}
        <ImageMenu
          anchorElImageMenu={imageAnchorEl}
          selectedImage={selectedImage}
          onCloseImageMenu={onImageMenuClose}
          openImageMenu={Boolean(imageAnchorEl)}
        />
      </CollapsibleList>

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
