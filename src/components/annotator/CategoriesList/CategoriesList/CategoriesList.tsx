import Drawer from "@mui/material/Drawer";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Category, UNKNOWN_CATEGORY_ID } from "../../../../types/Category";
import {
  categoryCountsSelector,
  imageSelector,
  selectedCategorySelector,
  selectedImagesSelector,
  unknownCategorySelector,
} from "../../../../store/selectors";
import { batch, useDispatch, useSelector } from "react-redux";
import { CollapsibleList } from "../CollapsibleList";
import { CategoryListItemCheckbox } from "../CategoryListItemCheckbox";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import IconButton from "@mui/material/IconButton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { CategoryMenu } from "../CategoryMenu";
import { DeleteCategoryDialog } from "../DeleteCategoryDialog";
import { EditCategoryDialog } from "../EditCategoryDialog";
import { useDialog } from "../../../../hooks";
import { useTranslation } from "../../../../hooks/useTranslation";
import {
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  TextField,
  Tooltip,
} from "@mui/material";
import List from "@mui/material/List";
import DeleteIcon from "@mui/icons-material/Delete";
import ListItemIcon from "@mui/material/ListItemIcon";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SaveIcon from "@mui/icons-material/Save";
import Typography from "@mui/material/Typography";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import PopupState, { bindTrigger } from "material-ui-popup-state";
import SettingsIcon from "@mui/icons-material/Settings";
import FeedbackIcon from "@mui/icons-material/Feedback";
import { SettingsDialog } from "../../SettingsButton/SettingsDialog";
import AddIcon from "@mui/icons-material/Add";
import { CreateCategoryDialog } from "../CreateCategoryListItem/CreateCategoryDialog";
import { selectedAnnotationsIdsSelector } from "../../../../store/selectors/selectedAnnotationsIdsSelector";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import { imagesSelector } from "../../../../store/selectors/imagesSelector";
import { ImageMenu } from "../ImageMenu";
import { DeleteAllAnnotationsDialog } from "../DeleteAllAnnotationsDialog";
import { SaveMenu } from "../SaveMenu/SaveMenu";
import { OpenMenu } from "../OpenMenu/OpenMenu";
import HelpDrawer from "../../Help/HelpDrawer/HelpDrawer";
import { ClearCategoryDialog } from "../ClearCategoryDialog";
import {
  imageViewerSlice,
  projectSlice,
  setActiveImage,
} from "../../../../store/slices";
import { Image } from "../../../../types/Image";
import { ArrowBack } from "@mui/icons-material";
import { annotatorImagesSelector } from "../../../../store/selectors/annotatorImagesSelector";
import { createdAnnotatorCategoriesSelector } from "../../../../store/selectors/createdAnnotatorCategoriesSelector";
import { Partition } from "../../../../types/Partition";
import { ExitAnnotatorDialog } from "../ExitAnnotatorDialog";

export const CategoriesList = () => {
  const createdCategories = useSelector(createdAnnotatorCategoriesSelector);
  const selectedCategory = useSelector(selectedCategorySelector);
  const unknownCategory = useSelector(unknownCategorySelector);

  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);

  const categoryCounts = useSelector(categoryCountsSelector);

  const annotatorImages = useSelector(annotatorImagesSelector);
  const projectImages = useSelector(imagesSelector);
  const selectedImages = useSelector(selectedImagesSelector);

  const currentImage = useSelector(imageSelector);

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const {
    onClose: onCloseDeleteCategoryDialog,
    onOpen: onOpenDeleteCategoryDialog,
    open: openDeleteCategoryDialog,
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

  const {
    onClose: onCloseExitAnnotatorDialog,
    onOpen: onOpenExitAnnotatorDialog,
    open: openExitAnnotatorDialog,
  } = useDialog();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const [imageAnchorEl, setImageAnchorEl] = React.useState<null | HTMLElement>(
    null
  );

  /*
  When going back to project, replace images with those that have updated annotations
   */
  const onCloseDialog = () => {
    const unselectedImages = projectImages.filter((image: Image) => {
      return !selectedImages.includes(image.id);
    });

    //We update partition to TRAINING for the annotated images
    const updatedAnnotatorImages = annotatorImages.map((image: Image) => {
      let partition: Partition;
      if (image.annotations.length > 0) {
        //only update if image actually has annotations
        partition = Partition.Training;
      } else {
        partition = Partition.Inference;
      }
      return { ...image, partition: partition };
    });

    dispatch(
      projectSlice.actions.setImages({
        images: [...updatedAnnotatorImages, ...unselectedImages],
      })
    );

    onCloseExitAnnotatorDialog();
    navigate("/");
  };

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
    image: Image
  ) => {
    onImageItemClick(event, image);
    setImageAnchorEl(event.currentTarget);
  };

  const onImageMenuClose = () => {
    setImageAnchorEl(null);
  };

  const onClearAllAnnotations = () => {
    const existingAnnotations = annotatorImages
      .map((image: Image) => {
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
          selectedCategoryId: UNKNOWN_CATEGORY_ID,
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
    image: Image
  ) => {
    batch(() => {
      dispatch(setActiveImage({ image: image.id }));

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
        "& .MuiDrawer-paper": {
          boxShadow: "inset 0 0 16px #000000",
          width: (theme) => theme.spacing(32),
          zIndex: 0,
        },
      }}
      open
      variant="persistent"
    >
      <Box
        style={{ paddingTop: 60 }}
        sx={(theme) => ({
          ...theme.mixins.toolbar,
        })}
        display="flex"
        justifyContent="flex-end"
        px={8}
      />

      <AppBar
        color="default"
        sx={{
          backgroundColor: "rgba(0, 0, 0, 0)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
          boxShadow: "none",
          position: "absolute",
        }}
      >
        <Toolbar>
          <Tooltip title="Save and return to project" placement="bottom">
            <IconButton
              edge="start"
              onClick={onOpenExitAnnotatorDialog}
              aria-label="Exit Annotator"
              href={""}
            >
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" color="inherit">
            Piximi Annotator
          </Typography>
        </Toolbar>
      </AppBar>

      <ExitAnnotatorDialog
        onConfirm={onCloseDialog}
        onClose={onCloseExitAnnotatorDialog}
        open={openExitAnnotatorDialog}
      />

      <Divider />

      <List dense>
        <OpenListItem />
        <SaveListItem />
      </List>

      <Divider />

      <CollapsibleList closed dense primary={t("Images")}>
        {annotatorImages.map((image: Image) => {
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
                  <Avatar
                    alt={image.name}
                    src={image.originalSrc}
                    variant={"square"}
                  />
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
          onCloseImageMenu={onImageMenuClose}
          openImageMenu={Boolean(imageAnchorEl)}
        />
      </CollapsibleList>

      <Divider />

      <CollapsibleList closed dense primary={t("Categories")}>
        {createdCategories.map((category: Category) => {
          return (
            <div key={category.id}>
              <ListItem
                button
                id={category.id}
                onClick={(event) => onCategoryClick(event, category)}
                selected={category.id === selectedCategory.id}
              >
                <CategoryListItemCheckbox category={category} />

                <ListItemText
                  id={category.id}
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
        {unknownCategory && (
          <div key={unknownCategory.id}>
            <ListItem
              button
              id={unknownCategory.id}
              onClick={(event) => onCategoryClick(event, unknownCategory)}
              selected={unknownCategory.id === selectedCategory.id}
            >
              <CategoryListItemCheckbox category={unknownCategory} />

              <ListItemText
                id={unknownCategory.id}
                primary={t(unknownCategory.name)}
                primaryTypographyProps={{ noWrap: true }}
              />
              {categoryCounts[unknownCategory.id] !== 0 && (
                <Chip label={categoryCounts[unknownCategory.id]} size="small" />
              )}
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={(event) =>
                    onCategoryMenuOpen(event, unknownCategory)
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
                onCategoryMenuOpen(event, unknownCategory)
              }
              onOpenDeleteCategoryDialog={onOpenDeleteCategoryDialog}
              onOpenEditCategoryDialog={onOpenEditCategoryDialog}
              openCategoryMenu={Boolean(anchorEl)}
              onOpenClearCategoryDialog={onOpenClearCategoryDialog}
            />
          </div>
        )}

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
        <HelpDrawer />
        <SettingsListItem />
        <SendFeedbackListItem />
      </List>
    </Drawer>
  );
};

type SendFeedbackDialogProps = {
  onClose: () => void;
  open: boolean;
  onSend: (text: string) => void;
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

/*
 * WARNING: This list item and its dialog box is not used anymore as it is been replaced with the HelpDrawer component.
 * */
//
// const HelpListItem = () => {
//   const { onClose, onOpen, open } = useDialog();
//
//   const {
//     onClose: onCloseOpenImagesHelpDialog,
//     onOpen: onOpenOpenImagesHelpDialog,
//     open: openOpenImagesHelpDialog,
//   } = useDialog();
//
//   const {
//     onClose: onCloseManipulatingCanvasHelpDialog,
//     onOpen: onOpenManipulatingCanvasHelpDialog,
//     open: openManipulatingCanvasHelpDialog,
//   } = useDialog();
//
//   const {
//     onClose: onCloseMakeAnnotationsHelpDialog,
//     onOpen: onOpenMakeAnnotationsHelpDialog,
//     open: openMakeAnnotationsHelpDialog,
//   } = useDialog();
//
//   const {
//     onClose: onCloseChangingAnnotationsHelpDialog,
//     onOpen: onOpenChangingAnnotationsHelpDialog,
//     open: openChangingAnnotationsHelpDialog,
//   } = useDialog();
//
//   const {
//     onClose: onCloseSavingProjectHelpDialog,
//     onOpen: onOpenSavingProjectHelpDialog,
//     open: openSavingProjectHelpDialog,
//   } = useDialog();
//
//   return (
//     <>
//       <ListItem button onClick={onOpen}>
//         <ListItemIcon>
//           <HelpIcon />
//         </ListItemIcon>
//
//         <ListItemText primary="Help" />
//       </ListItem>
//
//       <HelpDrawer />
//
//       {/*<HelpDialog*/}
//       {/*  onClose={onClose}*/}
//       {/*  open={open}*/}
//       {/*  onOpenOpenImagesHelpDialog={onOpenOpenImagesHelpDialog}*/}
//       {/*  onOpenMakeAnnotationsHelpDialog={onOpenMakeAnnotationsHelpDialog}*/}
//       {/*  onOpenManipulatingCanvasHelpDialog={onOpenManipulatingCanvasHelpDialog}*/}
//       {/*  onOpenChangingAnnotationsHelpDialog={*/}
//       {/*    onOpenChangingAnnotationsHelpDialog*/}
//       {/*  }*/}
//       {/*  onOpenSavingProjectHelpDialog={onOpenSavingProjectHelpDialog}*/}
//       {/*/>*/}
//       {/*<OpenImageHelpDialog*/}
//       {/*  onClose={onCloseOpenImagesHelpDialog}*/}
//       {/*  open={openOpenImagesHelpDialog}*/}
//       {/*/>*/}
//       {/*<MakeAnnotationsHelpDialog*/}
//       {/*  onClose={onCloseMakeAnnotationsHelpDialog}*/}
//       {/*  open={openMakeAnnotationsHelpDialog}*/}
//       {/*/>*/}
//       {/*<ManipulateCanvasHelpDialog*/}
//       {/*  onClose={onCloseManipulatingCanvasHelpDialog}*/}
//       {/*  open={openManipulatingCanvasHelpDialog}*/}
//       {/*/>*/}
//       {/*<ChangingAnnotationsHelpDialog*/}
//       {/*  onClose={onCloseChangingAnnotationsHelpDialog}*/}
//       {/*  open={openChangingAnnotationsHelpDialog}*/}
//       {/*/>*/}
//       {/*<SavingProjectHelpDialog*/}
//       {/*  onClose={onCloseSavingProjectHelpDialog}*/}
//       {/*  open={openSavingProjectHelpDialog}*/}
//       {/*/>*/}
//     </>
//   );
// };

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

const SendFeedbackDialog = ({
  onClose,
  open,
  onSend,
}: SendFeedbackDialogProps) => {
  const t = useTranslation();

  const [input, setInput] = useState("");

  const send = () => {
    onSend(input);
    onClose();
  };

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>{t("Send feedback")}</DialogTitle>

      <DialogContent>
        <DialogContentText
          sx={{
            "& a": { color: "deepskyblue" },
          }}
        >
          {t(
            "Use this form to report issues with Piximi via our GitHub page, or visit"
          )}{" "}
          <a
            href="https://forum.image.sc/tag/piximi"
            target="_blank"
            rel="noreferrer"
          >
            forum.image.sc/tag/piximi
          </a>
          .
        </DialogContentText>

        <TextField
          autoFocus
          margin="dense"
          id="feedback"
          onChange={(e) => setInput(e.target.value)}
          multiline
          rows={12}
          fullWidth
          variant="filled"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button onClick={send} color="primary">
          Send feedback
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SendFeedbackListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  const onSend = (text: string) => {
    const url =
      "https://github.com/piximi/annotator/issues/new?title=Bug%20Report&labels=bug&body=" +
      encodeURIComponent(text);
    window.open(url);
  };

  const t = useTranslation();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <FeedbackIcon />
        </ListItemIcon>

        <ListItemText primary={t("Send feedback")} />
      </ListItem>
      <SendFeedbackDialog onClose={onClose} open={open} onSend={onSend} />
    </>
  );
};

const SettingsListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  const t = useTranslation();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <SettingsIcon />
        </ListItemIcon>

        <ListItemText primary={t("Settings")} />
      </ListItem>
      <SettingsDialog onClose={onClose} open={open} />
    </>
  );
};
