import Container from "@material-ui/core/Container";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import GridListTileBar from "@material-ui/core/GridListTileBar";
import IconButton from "@material-ui/core/IconButton";
import LabelIcon from "@material-ui/icons/Label";
import React from "react";
import { useStyles } from "./ImageGrid.css";
import { useDispatch, useSelector } from "react-redux";
import { Category } from "../../types/Category";
import { Image } from "../../types/Image";
import {
  categoriesSelector,
  selectedImagesSelector,
  visibleImagesSelector,
} from "../../store/selectors";
import { tileSizeSelector } from "../../store/selectors/tileSizeSelector";
import { applicationSlice } from "../../store/slices";
import { ImageGridAppBar } from "../ImageGridAppBar";

export const ImageGrid = () => {
  const dispatch = useDispatch();

  const categories = useSelector(categoriesSelector);

  const images = useSelector(visibleImagesSelector);

  const selectedImages: Array<string> = useSelector(selectedImagesSelector);

  const [
    categoryMenuAnchorEl,
    setCategoryMenuAnchorEl,
  ] = React.useState<null | HTMLElement>(null);

  const onOpenCategoryMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    image: Image
  ) => {
    dispatch(applicationSlice.actions.selectOneImage({ id: image.id }));
    setCategoryMenuAnchorEl(event.currentTarget);
    event.stopPropagation();
  };

  const onSelectImage = (image: Image) => {
    if (selectedImages.includes(image.id)) {
      dispatch(applicationSlice.actions.deselectImage({ id: image.id }));
    } else {
      dispatch(applicationSlice.actions.selectImage({ id: image.id }));
    }
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

  return (
    <React.Fragment>
      <main className={classes.main}>
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

          <ImageGridAppBar />
        </Container>
      </main>
    </React.Fragment>
  );
};
