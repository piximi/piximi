import { memo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Box, Grid } from "@mui/material";

import { ImageIconLabel } from "../MainImageGrid/ImageIconLabel";

import { tileSizeSelector } from "store/application";
import { projectSlice } from "store/project";
import { ImageType } from "types";

type MainImageGridItemProps = {
  image: ImageType;
  selected: boolean;
  selectionColor: string;
  selectedImageBorderWidth: number;
};

export const MainImageGridItem = memo(
  ({
    image,
    selected,
    selectionColor,
    selectedImageBorderWidth,
  }: MainImageGridItemProps) => {
    const dispatch = useDispatch();
    const scaleFactor = useSelector(tileSizeSelector);

    const getSize = (scaleFactor: number) => {
      const sideLength = (220 * scaleFactor).toString() + "px";

      return {
        width: sideLength,
        height: sideLength,
        margin: "2px",
      };
    };

    const getIconPlacement = (image: ImageType, scaleFactor: number) => {
      const imageWidth = image.shape.width;
      const imageHeight = image.shape.height;
      const containerSize = 220 * scaleFactor;
      const scaleBy = imageWidth > imageHeight ? imageWidth : imageHeight;
      const dimScaleFactor = containerSize / scaleBy;
      const scaledWidth = dimScaleFactor * imageWidth;
      const scaledHeight = dimScaleFactor * imageHeight;

      const offsetY = Math.ceil((containerSize - scaledHeight) / 2);
      const offsetX = Math.ceil((containerSize - scaledWidth) / 2);

      return { top: `${offsetY}px`, left: `${offsetX}px` };
    };

    const getSelectionStatus = () => {
      // TODO: Change to always have border so image sie doesnt change
      return selected
        ? {
            border: `solid ${selectedImageBorderWidth}px ${selectionColor}`,
            borderRadius: `${selectedImageBorderWidth}px`,
          }
        : { border: "none" };
    };

    const onSelectImage = (image: ImageType) => {
      if (selected) {
        dispatch(projectSlice.actions.deselectImage({ id: image.id }));
      } else {
        dispatch(projectSlice.actions.selectImage({ id: image.id }));
      }
    };

    const onContextSelectImage = (image: ImageType) => {
      if (!selected) {
        dispatch(projectSlice.actions.selectImage({ id: image.id }));
      }
    };

    return (
      <Grid
        item
        position="relative" // must be a position element for absolutely positioned ImageIconLabel
        onClick={() => onSelectImage(image)}
        sx={{ ...getSize(scaleFactor), ...getSelectionStatus() }}
        onContextMenu={() => onContextSelectImage(image)}
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

        <ImageIconLabel
          image={image}
          placement={getIconPlacement(image, scaleFactor)}
        />
      </Grid>
    );
  }
);
