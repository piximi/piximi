import clsx from "clsx";
import Container from "@material-ui/core/Container";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import GridListTileBar from "@material-ui/core/GridListTileBar";
import IconButton from "@material-ui/core/IconButton";
import LabelOutlinedIcon from "@material-ui/icons/LabelOutlined";
import LabelIcon from "@material-ui/icons/Label";
import React from "react";
import { useStyles } from "./ImageGrid.css";
import { useDispatch, useSelector } from "react-redux";
import { ImageDialog } from "../ImageDialog";
import { ImageCategoryMenu } from "../ImageCategoryMenu";
import { Category } from "../../types/Category";
import { Image } from "../../types/Image";
import {
  categoriesSelector,
  selectedImagesSelector,
} from "../../store/selectors";
import { visibleImagesSelector } from "../../store/selectors";
import { tileSizeSelector } from "../../store/selectors/tileSizeSelector";
import { AppBar, Chip, Slide, Toolbar } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import ViewComfyIcon from "@material-ui/icons/ViewComfy";
import DeleteIcon from "@material-ui/icons/Delete";
import Typography from "@material-ui/core/Typography";
import { applicationSlice } from "../../store/slices";
import { useDialog } from "../../hooks";
import { DeleteImagesDialog } from "../DeleteImagesDialog";
import Tooltip from "@material-ui/core/Tooltip";

type ImageGridProps = {
  openDrawer: boolean;
};

export const ImageGrid = ({ openDrawer }: ImageGridProps) => {
  const dispatch = useDispatch();

  const categories = useSelector(categoriesSelector);

  const images = useSelector(visibleImagesSelector);

  const selectedImages: Array<string> = useSelector(selectedImagesSelector);

  const [openImageDialog, setOpenImageDialog] = React.useState(false);

  const [openedImage, setOpenedImage] = React.useState<Image>(images[0]);

  const [
    categoryMenuAnchorEl,
    setCategoryMenuAnchorEl,
  ] = React.useState<null | HTMLElement>(null);

  const { onClose, onOpen, open } = useDialog();

  const onOpenCategoryMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    image: Image
  ) => {
    dispatch(applicationSlice.actions.selectOneImage({ id: image.id }));
    setCategoryMenuAnchorEl(event.currentTarget);
    event.stopPropagation();
  };

  const onOpenCategoriesMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  const onOpenImageDialog = (photo: Image) => {
    setOpenedImage(photo);
    // setOpenImageDialog(true);
  };

  const onSelectImage = (image: Image) => {
    if (selectedImages.includes(image.id)) {
      dispatch(applicationSlice.actions.deselectImage({ id: image.id }));
    } else {
      dispatch(applicationSlice.actions.selectImage({ id: image.id }));
    }
  };

  const onCloseImageDialog = () => {
    setOpenImageDialog(false);
  };

  const classes = useStyles();

  const imageCategory = (image: Image) => {
    const index = categories.findIndex((category: Category) => {
      return image.categoryId === category.id;
    });

    return categories[index];
  };

  const scaleFactor = useSelector(tileSizeSelector);

  const getSize = (scaleFactor: number) => {
    const width = (230 * scaleFactor).toString() + "px";
    const height = (185 * scaleFactor).toString() + "px";
    return { width: width, height: height };
  };

  const getSelectionStatus = (imageId: string) => {
    return selectedImages.includes(imageId)
      ? classes.imageSelected
      : classes.imageUnselected;
  };

  const selectAllImages = () => {
    const newSelected = images.map((image) => image.id);
    dispatch(applicationSlice.actions.selectAllImages({ ids: newSelected }));
  };

  const selectNoImages = () => {
    dispatch(applicationSlice.actions.clearSelectedImages());
  };

  return (
    <React.Fragment>
      <main className={clsx(classes.main, { [classes.mainShift]: openDrawer })}>
        <Container className={classes.container} maxWidth={false}>
          <GridList
            className={classes.gridList}
            cols={Math.floor(4 / scaleFactor)}
            cellHeight="auto"
          >
            {images.map((image: Image) => (
              <GridListTile
                key={image.id}
                onClick={() => onSelectImage(image)}
                style={getSize(scaleFactor)}
                className={getSelectionStatus(image.id)}
              >
                <img alt="" src={image.src} />

                <GridListTileBar
                  actionIcon={
                    <IconButton
                      className={classes.gridTileBarIconButton}
                      disableRipple
                      onClick={(event) => onOpenCategoryMenu(event, image)}
                    >
                      <LabelIcon
                        style={{
                          color: imageCategory(image)
                            ? imageCategory(image).color
                            : "#AAAAAA",
                        }}
                      />
                    </IconButton>
                  }
                  actionPosition="left"
                  className={classes.gridTileBar}
                  titlePosition="top"
                />
              </GridListTile>
            ))}
          </GridList>
          <Slide appear={false} direction="up" in={selectedImages.length > 0}>
            <AppBar
              position="fixed"
              color="inherit"
              style={{ top: "auto", bottom: 0 }}
              className={clsx(classes.appBar, {
                [classes.appBarShift]: openDrawer,
              })}
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
        </Container>
      </main>

      <ImageDialog
        onClose={onCloseImageDialog}
        open={openImageDialog}
        image={openedImage}
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
