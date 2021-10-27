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
import {
  Container,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from "@mui/material";
import LabelIcon from "@mui/icons-material/Label";

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

  const getColor = (image: Image) => {
    return categories.find((category: Category) => {
      return category.id === image.categoryId;
    })?.color;
  };

  const getSize = (scaleFactor: number) => {
    const width = (220 * scaleFactor).toString() + "px";
    const height = (220 * scaleFactor).toString() + "px";

    return {
      width: width,
      height: height,
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
            {images.slice(0, max_images).map((image: Image) => (
              <ImageListItem
                key={image.id}
                onClick={() => onSelectImage(image)}
                style={getSize(scaleFactor)}
                className={getSelectionStatus(image.id)}
              >
                <img alt="" src={image.src} className={classes.imageTile} />
                <ImageListItemBar
                  position="top"
                  sx={{
                    background: "transparent",
                  }}
                  actionIcon={
                    <LabelIcon
                      sx={{
                        color: getColor(image),
                        marginLeft: "8px",
                        marginTop: "8px",
                      }}
                    />
                  }
                  actionPosition="left"
                />
              </ImageListItem>
            ))}
          </ImageList>

          <ImageGridAppBar />
        </Container>
      </main>
    </>
  );
};
