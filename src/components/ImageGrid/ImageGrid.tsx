import { useStyles } from "./ImageGrid.css";
import { useDispatch, useSelector } from "react-redux";
import { Image } from "../../types/Image";
import {
  categoriesSelector,
  selectedImagesSelector,
  visibleImagesSelector,
} from "../../store/selectors";
import { tileSizeSelector } from "../../store/selectors/tileSizeSelector";
import { applicationSlice } from "../../store/slices";
import { ImageGridAppBar } from "../ImageGridAppBar";
import { Category } from "../../types/Category";
import { Container, ImageList, ImageListItem } from "@mui/material";

export const ImageGrid = () => {
  const dispatch = useDispatch();

  const images = useSelector(visibleImagesSelector);
  const categories = useSelector(categoriesSelector);

  const selectedImages: Array<string> = useSelector(selectedImagesSelector);

  const max_images = 100; //number of images from the project that we'll show

  const onSelectImage = (image: Image) => {
    if (selectedImages.includes(image.id)) {
      dispatch(applicationSlice.actions.deselectImage({ id: image.id }));
    } else {
      dispatch(applicationSlice.actions.selectImage({ id: image.id }));
    }
  };

  const classes = useStyles();

  const scaleFactor = useSelector(tileSizeSelector);

  const getSize = (scaleFactor: number, image: Image) => {
    const width = (200 * scaleFactor).toString() + "px";
    const height = (200 * scaleFactor).toString() + "px";

    const color = categories.find((category: Category) => {
      return category.id === image.categoryId;
    })?.color;

    return {
      width: width,
      height: height,
      background: color,
      margin: "2px",
    };
  };

  const getSelectionStatus = (imageId: string) => {
    return selectedImages.includes(imageId)
      ? classes.imageSelected
      : classes.imageUnselected;
  };

  return (
    <>
      <main className={classes.main}>
        <Container className={classes.container} maxWidth={false}>
          <ImageList
            className={classes.gridList}
            cols={Math.floor(6 / scaleFactor)}
            rowHeight={"auto"}
          >
            {images.slice(0, max_images).map(
              (
                image: Image //FIXME for now we'll have to cap the number of shown images to 100
              ) => (
                <ImageListItem
                  key={image.id}
                  onClick={() => onSelectImage(image)}
                  style={getSize(scaleFactor, image)}
                  className={getSelectionStatus(image.id)}
                >
                  <img alt="" src={image.src} className={classes.imageTile} />
                </ImageListItem>
              )
            )}
          </ImageList>

          <ImageGridAppBar />
        </Container>
      </main>
    </>
  );
};
