import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";

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

import { useDialog } from "hooks";

import { ImageCategoryMenu } from "../ImageCategoryMenu";
import { DeleteImagesDialog } from "components/main/DeleteImagesDialog";
import { KeyboardKey } from "components/common/Help/HelpDialog/KeyboardKey";

import { selectedImagesSelector, visibleImagesSelector } from "store/selectors";

import {
  applicationSlice,
  imageViewerSlice,
  setActiveImage,
} from "store/slices";

import { ImageType, ShadowImageType } from "types";

export const ImageGridAppBar = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const images = useSelector(visibleImagesSelector);

  const selectedImages: Array<string> = useSelector(selectedImagesSelector);

  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const [showImageGridAppBar, setShowImageGridAppBar] =
    React.useState<boolean>(false);

  const [showSelectAllButton, setShowSelectAllButton] =
    React.useState<boolean>(true);

  React.useEffect(() => {
    selectedImages.length > 0
      ? setShowImageGridAppBar(true)
      : setShowImageGridAppBar(false);

    images.length === selectedImages.length
      ? setShowSelectAllButton(false)
      : setShowSelectAllButton(true);
  }, [selectedImages, images]);

  const {
    onClose: onCloseDeleteImagesDialog,
    onOpen: onOpenDeleteImagesDialog,
    open: openDeleteImagesDialog,
  } = useDialog();

  const onOpenCategoriesMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  const onOpenAnnotator = () => {
    const selected = selectedImages.map((id: string, idx: number) => {
      const projectImage = images.find((image: ImageType) => {
        return image.id === id;
      });

      if (!projectImage) {
        throw Error(
          `Selected image with id ${id} not found among visible images.`
        );
      }

      const annotatorImage: ShadowImageType = {
        id: projectImage.id,
        name: projectImage.name,
        annotations: projectImage.annotations,
        src: projectImage.src,
        activePlane: projectImage.activePlane,
        shape: projectImage.shape,
        colors: projectImage.colors,
      };

      if (idx === 0) {
        dispatch(
          setActiveImage({
            imageId: annotatorImage.id,
          })
        );
      }

      return annotatorImage;
    });

    if (!selected) return;

    dispatch(imageViewerSlice.actions.setImages({ images: selected }));
    navigate("/annotator");
  };

  const selectAllImages = () => {
    setShowSelectAllButton(false);
    const newSelected = images.map((image) => image.id);
    dispatch(applicationSlice.actions.selectAllImages({ ids: newSelected }));
  };

  const unselectImages = () => {
    setShowSelectAllButton(true);
    dispatch(applicationSlice.actions.clearSelectedImages());
  };

  useHotkeys("esc", () => unselectImages(), { enabled: showImageGridAppBar });
  useHotkeys("backspace, delete", () => onOpenDeleteImagesDialog(), {
    enabled: showImageGridAppBar,
  });

  const tooltipTitle = (
    tooltip: string,
    firstKey: string,
    secondKey?: string
  ) => {
    return (
      <Box
        sx={{ display: "flex", alignItems: "center", typography: "caption" }}
      >
        <Typography variant="caption">{tooltip}</Typography>
        <Typography variant="caption" style={{ marginLeft: "5px" }}>
          (
        </Typography>
        {secondKey && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              typography: "caption",
            }}
          >
            <KeyboardKey letter={firstKey} />
            <Typography variant="caption">+</Typography>
          </Box>
        )}
        <KeyboardKey letter={secondKey ? secondKey : firstKey} />
        <Typography variant="caption">)</Typography>
      </Box>
    );
  };

  return (
    <>
      <Slide appear={false} direction="down" in={showImageGridAppBar}>
        <AppBar color="inherit" position="fixed">
          <Toolbar>
            <Tooltip
              placement="bottom"
              title={tooltipTitle("Unselect images", "esc")}
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
              {selectedImages.length} selected images
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
                title={tooltipTitle("Select all images", "control", "a")}
              >
                <IconButton color="inherit" onClick={selectAllImages}>
                  <SelectAllIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip
                placement="bottom"
                title={tooltipTitle("Unselect images", "esc")}
              >
                <IconButton color="inherit" onClick={unselectImages}>
                  <DeselectIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip
              placement="bottom"
              title={tooltipTitle("Delete selected images", "delete")}
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
        imageIds={selectedImages}
        onClose={onCloseCategoryMenu}
      />

      <DeleteImagesDialog
        imageIds={selectedImages}
        onClose={onCloseDeleteImagesDialog}
        open={openDeleteImagesDialog}
      />
    </>
  );
};
