import Container from "@material-ui/core/Container";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import React from "react";
import { useStyles } from "./ImageGrid.css";
import { useDispatch, useSelector } from "react-redux";
import { Image } from "../../types/Image";
import {
  selectedImagesSelector,
  visibleImagesSelector,
} from "../../store/selectors";
import { tileSizeSelector } from "../../store/selectors/tileSizeSelector";
import { applicationSlice } from "../../store/slices";
import { ImageGridAppBar } from "../ImageGridAppBar";

export const ImageGrid = () => {
  const dispatch = useDispatch();

  const images = useSelector(visibleImagesSelector);

  const selectedImages: Array<string> = useSelector(selectedImagesSelector);

  const onSelectImage = (image: Image) => {
    if (selectedImages.includes(image.id)) {
      dispatch(applicationSlice.actions.deselectImage({ id: image.id }));
    } else {
      dispatch(applicationSlice.actions.selectImage({ id: image.id }));
    }
  };

  const classes = useStyles();

  const scaleFactor = useSelector(tileSizeSelector);

  const getSize = (scaleFactor: number) => {
    const width = (230 * scaleFactor).toString() + "px";
    const height = (185 * scaleFactor).toString() + "px";
    return {
      width: width,
      height: height,
      background: "lightgray",
      margin: "2px",
    };
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
                <img alt="" src={image.src} className={classes.imageTile} />
              </GridListTile>
            ))}
          </GridList>

          <ImageGridAppBar />
        </Container>
      </main>
    </React.Fragment>
  );
};
