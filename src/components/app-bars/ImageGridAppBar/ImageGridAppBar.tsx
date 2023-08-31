import React, { useEffect } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "hooks";

import {
  AppBar,
  Chip,
  IconButton,
  Slide,
  Toolbar,
  Tooltip,
  Typography,
  Box,
} from "@mui/material";

import {
  Clear as ClearIcon,
  Delete as DeleteIcon,
  Deselect as DeselectIcon,
  Gesture as GestureIcon,
  LabelOutlined as LabelOutlinedIcon,
  SelectAll as SelectAllIcon,
} from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { DialogWithAction } from "components/dialogs";
import { ImageCategoryMenu } from "../../menus/ImageCategoryMenu";
import { TooltipTitle } from "components/tooltips";

import {
  selectHotkeyView,
  registerHotkeyView,
  unregisterHotkeyView,
} from "store/application";
import { projectSlice, selectSelectedImagesId } from "store/project";
import { dataSlice, selectVisibleImages } from "store/data";
import { setActiveImageId } from "store/imageViewer";

import { HotkeyView } from "types";

export const ImageGridAppBar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const images = useSelector(selectVisibleImages);
  const selectedImagesIds: Array<string> = useSelector(selectSelectedImagesId);
  const currentHotkeyView = useSelector(selectHotkeyView);

  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const [showImageGridAppBar, setShowImageGridAppBar] =
    React.useState<boolean>(false);
  const [showSelectAllButton, setShowSelectAllButton] =
    React.useState<boolean>(true);

  const {
    onClose: handleCloseDeleteImagesDialog,
    onOpen: onOpenDeleteImagesDialog,
    open: deleteImagesDialogisOpen,
  } = useDialogHotkey(HotkeyView.DeleteImagesDialog);

  const handleAndDispatchDeleteImages = () => {
    dispatch(
      dataSlice.actions.deleteImages({
        imageIds: selectedImagesIds,
        disposeColorTensors: true,
      })
    );
    dispatch(projectSlice.actions.clearSelectedImages());
    handleCloseDeleteImagesDialog();
  };

  const onOpenCategoriesMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  const onOpenAnnotator = () => {
    batch(() => {
      dispatch(
        setActiveImageId({
          imageId:
            selectedImagesIds.length > 0 ? selectedImagesIds[0] : undefined,
          prevImageId: undefined,
          execSaga: true,
        })
      );
    });
    dispatch(unregisterHotkeyView({}));
    navigate("/annotator");
  };

  const selectAllImages = () => {
    setShowSelectAllButton(false);
    const newSelected = images.map((image) => image.id);
    dispatch(projectSlice.actions.selectAllImages({ ids: newSelected }));
  };

  const unselectImages = () => {
    setShowSelectAllButton(true);
    dispatch(projectSlice.actions.clearSelectedImages());
  };

  useHotkeys("esc", () => unselectImages(), HotkeyView.MainImageGridAppBar);
  useHotkeys(
    "backspace, delete",
    () => onOpenDeleteImagesDialog(),
    HotkeyView.MainImageGridAppBar
  );

  useEffect(() => {
    if (
      showImageGridAppBar &&
      currentHotkeyView !== HotkeyView.MainImageGridAppBar
    ) {
      dispatch(
        registerHotkeyView({ hotkeyView: HotkeyView.MainImageGridAppBar })
      );
    } else if (
      !showImageGridAppBar &&
      currentHotkeyView === HotkeyView.MainImageGridAppBar
    ) {
      if (currentHotkeyView === HotkeyView.MainImageGridAppBar) {
        dispatch(unregisterHotkeyView({}));
      }
    }
  }, [showImageGridAppBar, currentHotkeyView, dispatch]);

  React.useEffect(() => {
    if (selectedImagesIds.length > 0) {
      setShowImageGridAppBar(true);
    } else {
      setShowImageGridAppBar(false);
    }

    images.length === selectedImagesIds.length
      ? setShowSelectAllButton(false)
      : setShowSelectAllButton(true);
  }, [selectedImagesIds, images]);

  return (
    <>
      <Slide appear={false} direction="down" in={showImageGridAppBar}>
        <AppBar color="inherit" position="fixed">
          <Toolbar>
            <Tooltip
              placement="bottom"
              title={TooltipTitle("Unselect images", "esc")}
            >
              <IconButton
                sx={{ marginRight: (theme) => theme.spacing(2) }}
                edge="start"
                color="inherit"
                onClick={unselectImages}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>

            <Typography sx={{ flexGrow: 1 }}>
              {selectedImagesIds.length} selected images
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            <Chip
              avatar={<LabelOutlinedIcon color="inherit" />}
              label="Categorize"
              onClick={onOpenCategoriesMenu}
              variant="outlined"
              style={{ marginRight: 15 }}
            />
            <Chip
              avatar={<GestureIcon color="inherit" />}
              label="Annotate"
              onClick={onOpenAnnotator}
              variant="outlined"
            />

            {showSelectAllButton ? (
              <Tooltip
                placement="bottom"
                title={TooltipTitle("Select all images", "control", "a")}
              >
                <IconButton color="inherit" onClick={selectAllImages}>
                  <SelectAllIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip
                placement="bottom"
                title={TooltipTitle("Unselect images", "esc")}
              >
                <IconButton color="inherit" onClick={unselectImages}>
                  <DeselectIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip
              placement="bottom"
              title={TooltipTitle("Delete selected images", "delete")}
            >
              <IconButton color="inherit" onClick={onOpenDeleteImagesDialog}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
      </Slide>

      <ImageCategoryMenu
        anchorEl={categoryMenuAnchorEl as HTMLElement}
        imageIds={selectedImagesIds}
        onClose={onCloseCategoryMenu}
        open={Boolean(categoryMenuAnchorEl as HTMLElement)}
      />

      <DialogWithAction
        title={`Delete ${selectedImagesIds.length} image${
          selectedImagesIds.length > 1 ? "s" : ""
        }?`}
        content="Images will be deleted from the project."
        handleConfirmCallback={handleAndDispatchDeleteImages}
        open={deleteImagesDialogisOpen}
        onClose={handleCloseDeleteImagesDialog}
      />
    </>
  );
};
