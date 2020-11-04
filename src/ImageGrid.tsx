import clsx from "clsx";
import Container from "@material-ui/core/Container";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import GridListTileBar from "@material-ui/core/GridListTileBar";
import IconButton from "@material-ui/core/IconButton";
import LabelIcon from "@material-ui/icons/Label";
import React from "react";
import { useStyles } from "./index.css";
import { useSelector } from "react-redux";
import { ImageDialog } from "./ImageDialog";
import { ImageCategoryMenu } from "./ImageCategoryMenu";
import { Category } from "./types/Category";
import { Image } from "./types/Image";
import { categoriesSelector } from "./store/selectors/categoriesSelector";
import { imagesSelector } from "./store/selectors/imagesSelector";
import { visibleImagesSelector } from "./store/selectors/visibleImagesSelector";

type ImageGridProps = {
  openDrawer: boolean;
};

export const ImageGrid = ({ openDrawer }: ImageGridProps) => {
  const categories = useSelector(categoriesSelector);

  const images = useSelector(visibleImagesSelector);

  const [openImageDialog, setOpenImageDialog] = React.useState(false);

  const [openedImage, setOpenedImage] = React.useState<Image>(images[0]);

  const [selectedImage, setSelectedImage] = React.useState();

  const [
    categoryMenuAnchorEl,
    setCategoryMenuAnchorEl,
  ] = React.useState<null | HTMLElement>(null);

  const onOpenCategoryMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    image: Image
  ) => {
    setSelectedImage(image);
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  const onOpenImageDialog = (photo: Image) => {
    setOpenedImage(photo);
    // setOpenImageDialog(true);
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

  return (
    <React.Fragment>
      <main className={clsx(classes.main, { [classes.mainShift]: openDrawer })}>
        <Container className={classes.container} maxWidth="md">
          <GridList className={classes.gridList} cols={4}>
            {images.map((image: Image) => (
              <GridListTile
                key={image.id}
                onClick={() => onOpenImageDialog(image)}
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
        </Container>
      </main>

      <ImageDialog
        onClose={onCloseImageDialog}
        open={openImageDialog}
        image={openedImage}
      />

      <ImageCategoryMenu
        anchorEl={categoryMenuAnchorEl as HTMLElement}
        image={selectedImage}
        onClose={onCloseCategoryMenu}
      />
    </React.Fragment>
  );
};
