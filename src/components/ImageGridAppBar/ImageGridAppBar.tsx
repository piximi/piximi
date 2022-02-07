import React from "react";
import { useNavigate } from "react-router-dom";
import { batch, useDispatch, useSelector } from "react-redux";
import { ImageCategoryMenu } from "../ImageCategoryMenu";
import {
  selectedImagesSelector,
  visibleImagesSelector,
} from "../../store/selectors";
import {
  applicationSlice,
  imageViewerSlice,
  setActiveImage,
  setSelectedAnnotations,
} from "../../store/slices";
import { useDialog } from "../../hooks";
import { DeleteImagesDialog } from "../DeleteImagesDialog";
import DeleteIcon from "@mui/icons-material/Delete";
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
import ViewComfyIcon from "@mui/icons-material/ViewComfy";
import GestureIcon from "@mui/icons-material/Gesture";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import { Image } from "../../types/Image";
import { Partition } from "../../types/Partition";

export const ImageGridAppBar = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const images = useSelector(visibleImagesSelector);

  const selectedImages: Array<string> = useSelector(selectedImagesSelector);

  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const { onClose, onOpen, open } = useDialog();

  const onOpenCategoriesMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  const onOpenAnnotatorDialog = (event: React.MouseEvent<HTMLDivElement>) => {
    const selected = selectedImages.map((id: string, idx: number) => {
      const projectImage = images.find((image: Image) => {
        return image.id === id;
      });

      const annotatorImage: Image = {
        categoryId: projectImage!.categoryId,
        id: projectImage!.id,
        annotations: projectImage!.annotations,
        name: projectImage!.name,
        partition: Partition.Inference,
        visible: true,
        shape: projectImage!.shape,
        originalSrc: projectImage!.originalSrc,
        src: projectImage!.src,
      };

      if (idx === 0) {
        batch(() => {
          dispatch(
            setActiveImage({
              image: annotatorImage.id,
            })
          );
          dispatch(
            setSelectedAnnotations({
              selectedAnnotations: [],
              selectedAnnotation: undefined,
            })
          );
        });
      }

      return annotatorImage;
    });

    if (!selected) return;

    dispatch(imageViewerSlice.actions.setImages({ images: selected }));
    navigate("/annotator");
  };

  const selectAllImages = () => {
    const newSelected = images.map((image) => image.id);
    dispatch(applicationSlice.actions.selectAllImages({ ids: newSelected }));
  };

  const selectNoImages = () => {
    dispatch(applicationSlice.actions.clearSelectedImages());
  };

  return (
    <>
      <Slide appear={false} direction="down" in={selectedImages.length > 0}>
        <AppBar color="inherit" position="fixed">
          <Toolbar>
            <IconButton
              sx={{ marginRight: (theme) => theme.spacing(2) }}
              edge="start"
              color="inherit"
              onClick={selectNoImages}
            >
              <ClearIcon />
            </IconButton>

            <Typography sx={{ flexGrow: 1 }}>
              {selectedImages.length} selected images
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            <Chip
              avatar={<LabelOutlinedIcon color="inherit" />}
              label="Categorise"
              onClick={onOpenCategoriesMenu}
              variant="outlined"
              style={{ marginRight: 15 }}
            />
            <Chip
              avatar={<GestureIcon color="inherit" />}
              label="Annotate"
              onClick={onOpenAnnotatorDialog}
              variant="outlined"
            />

            <IconButton color="inherit" onClick={selectAllImages}>
              <ViewComfyIcon />
            </IconButton>

            <Tooltip title="Delete">
              <IconButton color="inherit" onClick={onOpen}>
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
        onClose={onClose}
        open={open}
      />
    </>
  );
};
