import { memo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Container,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Box,
} from "@mui/material";

import { useDndFileDrop } from "hooks";

import { ImageIconLabel } from "./ImageIconLabel";

import { ImageGridAppBar } from "components/ImageGridAppBar";

import {
  imageSelectionColorSelector,
  imageSelectionSizeSelector,
  selectedImagesSelector,
  tileSizeSelector,
  visibleImagesSelector,
} from "store/selectors";

import { applicationSlice } from "store/slices";

import { ImageType } from "types";

type ImageGridProps = {
  onDrop: (files: FileList) => void;
};

type ImageGridItemProps = {
  image: ImageType;
  selected: boolean;
  selectionColor: string;
  selectionSize: number;
};

const ImageGridItem = memo(
  ({ image, selected, selectionColor, selectionSize }: ImageGridItemProps) => {
    const dispatch = useDispatch();
    const scaleFactor = useSelector(tileSizeSelector);

    const getSize = (scaleFactor: number) => {
      const width = (220 * scaleFactor).toString() + "px";
      const height = (220 * scaleFactor).toString() + "px";

      return {
        width: width,
        height: height,
        margin: "2px",
      };
    };

    const getSelectionStatus = () => {
      return selected
        ? {
            border: `solid ${selectionSize}px ${selectionColor}`,
            borderRadius: `${selectionSize}px`,
          }
        : { border: "none" };
    };

    const onSelectImage = (image: ImageType) => {
      if (selected) {
        dispatch(applicationSlice.actions.deselectImage({ id: image.id }));
      } else {
        dispatch(applicationSlice.actions.selectImage({ id: image.id }));
      }
    };

    return (
      <ImageListItem
        onClick={() => onSelectImage(image)}
        style={getSize(scaleFactor)}
        sx={getSelectionStatus()}
      >
        <Box
          component="img"
          alt=""
          src={image.src}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            top: 0,
            transform: "none",
          }}
        />

        <ImageListItemBar
          position="top"
          actionIcon={<ImageIconLabel image={image} />}
          actionPosition="left"
          sx={{
            background: "transparent",
          }}
        />
      </ImageListItem>
    );
  }
);

export const ImageGrid = ({ onDrop }: ImageGridProps) => {
  const images = useSelector(visibleImagesSelector);
  const imageSelectionColor = useSelector(imageSelectionColorSelector);
  const imageSelectionSize = useSelector(imageSelectionSizeSelector);
  const selectedImages = useSelector(selectedImagesSelector);
  const scaleFactor = useSelector(tileSizeSelector);
  const max_images = 1000; //number of images from the project that we'll show
  const [{ isOver }, dropTarget] = useDndFileDrop(onDrop);

  return (
    <Box
      component="main"
      ref={dropTarget}
      sx={(theme) => ({
        flexGrow: 1,
        height: "100%",
        paddingTop: theme.spacing(3),
        marginLeft: theme.spacing(32),
        transition: theme.transitions.create("margin", {
          duration: theme.transitions.duration.enteringScreen,
          easing: theme.transitions.easing.easeOut,
        }),
      })}
      style={{
        border: isOver ? "5px solid blue" : "",
      }}
    >
      <Container
        sx={(theme) => ({
          paddingBottom: theme.spacing(8),
          paddingTop: theme.spacing(8),
          height: "100%",
        })}
        maxWidth={false}
      >
        <ImageList
          sx={{ transform: "translateZ(0)", height: "100%" }}
          cols={Math.floor(6 / scaleFactor)}
          rowHeight={"auto"}
        >
          {images.slice(0, max_images).map((image: ImageType) => (
            <ImageGridItem
              image={image}
              selected={selectedImages.includes(image.id)}
              selectionColor={imageSelectionColor}
              selectionSize={imageSelectionSize}
              key={image.id}
            />
          ))}
        </ImageList>

        <ImageGridAppBar />
      </Container>
    </Box>
  );
};
