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
import SelectAllIcon from "@mui/icons-material/SelectAll";
import GestureIcon from "@mui/icons-material/Gesture";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import { ImageType } from "../../types/ImageType";
import { Partition } from "../../types/Partition";
import { useHotkeys } from "react-hotkeys-hook";
import { KeyboardKey } from "components/annotator/Help/HelpDialog/KeyboardKey";

export const ImageGridAppBar = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const images = useSelector(visibleImagesSelector);

  const selectedImages: Array<string> = useSelector(selectedImagesSelector);

  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const [showImageGridAppBar, setShowImageGridAppBar] =
    React.useState<boolean>(false);
  React.useEffect(() => {
    selectedImages.length > 0
      ? setShowImageGridAppBar(true)
      : setShowImageGridAppBar(false);
  }, [selectedImages]);

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

      const annotatorImage: ImageType = {
        ...projectImage!,
        activePlane: 0,
        partition: Partition.Inference,
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

  const unselectImages = () => {
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

            <Tooltip
              placement="bottom"
              title={tooltipTitle("Select all images", "control", "a")}
            >
              <IconButton color="inherit" onClick={selectAllImages}>
                <SelectAllIcon />
              </IconButton>
            </Tooltip>

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
