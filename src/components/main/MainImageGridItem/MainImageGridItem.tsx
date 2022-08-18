import { ImageListItem, Box, ImageListItemBar } from "@mui/material";
import { memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { tileSizeSelector, applicationSlice } from "store/application";
import { ImageType } from "types";
import { ImageIconLabel } from "../MainImageGrid/ImageIconLabel";

type MainImageGridItemProps = {
  image: ImageType;
  selected: boolean;
  selectionColor: string;
  selectionSize: number;
  contextMenu: {
    mouseX: number;
    mouseY: number;
  } | null;
  setContextMenu: React.Dispatch<
    React.SetStateAction<{
      mouseX: number;
      mouseY: number;
    } | null>
  >;
};

export const MainImageGridItem = memo(
  ({
    image,
    selected,
    selectionColor,
    selectionSize,
    contextMenu,
    setContextMenu,
  }: MainImageGridItemProps) => {
    const dispatch = useDispatch();
    const scaleFactor = useSelector(tileSizeSelector);

    const handleContextMenu = (event: React.MouseEvent) => {
      event.preventDefault();
      if (!selected) {
        dispatch(applicationSlice.actions.selectImage({ id: image.id }));
      }
      setContextMenu(
        contextMenu === null
          ? {
              mouseX: event.clientX + 2,
              mouseY: event.clientY - 6,
            }
          : null
      );
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

    const getSelectionStatus = () => {
      return selected
        ? {
            border: `solid ${selectionSize}px ${selectionColor}`,
            borderRadius: `${selectionSize}px`,
          }
        : { border: "none" };
    };

    const onSelectImage = (image: ImageType) => {
      console.log(image.id);
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
        onContextMenu={handleContextMenu}
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
