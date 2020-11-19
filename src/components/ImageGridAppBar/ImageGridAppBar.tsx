import IconButton from "@material-ui/core/IconButton";
import LabelOutlinedIcon from "@material-ui/icons/LabelOutlined";
import GestureIcon from "@material-ui/icons/Gesture";
import React from "react";
import { useStyles } from "./ImageGridAppBar.css";
import { useDispatch, useSelector } from "react-redux";
import { ImageDialog } from "../ImageDialog";
import { ImageCategoryMenu } from "../ImageCategoryMenu";
import {
  selectedImagesSelector,
  visibleImagesSelector,
} from "../../store/selectors";
import { AppBar, Chip, Slide, Toolbar } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import ViewComfyIcon from "@material-ui/icons/ViewComfy";
import DeleteIcon from "@material-ui/icons/Delete";
import Typography from "@material-ui/core/Typography";
import { applicationSlice } from "../../store/slices";
import { useDialog } from "../../hooks";
import { DeleteImagesDialog } from "../DeleteImagesDialog";
import Tooltip from "@material-ui/core/Tooltip";

export const ImageGridAppBar = () => {
  const dispatch = useDispatch();

  const images = useSelector(visibleImagesSelector);

  const selectedImages: Array<string> = useSelector(selectedImagesSelector);

  const [openImageDialog, setOpenImageDialog] = React.useState(false);

  const [
    categoryMenuAnchorEl,
    setCategoryMenuAnchorEl,
  ] = React.useState<null | HTMLElement>(null);

  const { onClose, onOpen, open } = useDialog();

  const onOpenCategoriesMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  const onOpenImageDialog = (event: React.MouseEvent<HTMLDivElement>) => {
    setOpenImageDialog(true);
  };

  const onCloseImageDialog = () => {
    setOpenImageDialog(false);
  };

  const classes = useStyles();

  const selectAllImages = () => {
    const newSelected = images.map((image) => image.id);
    dispatch(applicationSlice.actions.selectAllImages({ ids: newSelected }));
  };

  const selectNoImages = () => {
    dispatch(applicationSlice.actions.clearSelectedImages());
  };

  return (
    <React.Fragment>
      <Slide appear={false} direction="down" in={selectedImages.length > 0}>
        <AppBar
          className={classes.appBarShift}
          color="inherit"
          position="fixed"
        >
          <Toolbar>
            <IconButton
              className={classes.closeButton}
              edge="start"
              color="inherit"
              onClick={selectNoImages}
            >
              <ClearIcon />
            </IconButton>

            <Typography className={classes.count}>
              {selectedImages.length} selected images
            </Typography>

            <div style={{ flexGrow: 1 }} />

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
              onClick={onOpenImageDialog}
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

      <ImageDialog
        onClose={onCloseImageDialog}
        open={openImageDialog}
        imageIds={selectedImages}
      />

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
    </React.Fragment>
  );
};
