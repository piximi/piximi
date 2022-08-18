import { useSelector } from "react-redux";

import { Container, ImageList, Box } from "@mui/material";

import { useDndFileDrop } from "hooks";

import { MainImageGridAppBar } from "../MainImageGridAppBar";

import {
  tileSizeSelector,
  imageSelectionColorSelector,
  imageSelectionSizeSelector,
} from "store/application";
import { visibleImagesSelector, selectedImagesSelector } from "store/common";

import { ImageType } from "types";
import { MainImageGridItem } from "../MainImageGridItem";
import { useState } from "react";
import { ImageCategoryMenu } from "../ImageCategoryMenu";

type MainImageGridProps = {
  onDrop: (files: FileList) => void;
};

export const MainImageGrid = ({ onDrop }: MainImageGridProps) => {
  const images = useSelector(visibleImagesSelector);
  const imageSelectionColor = useSelector(imageSelectionColorSelector);
  const imageSelectionSize = useSelector(imageSelectionSizeSelector);
  const selectedImages = useSelector(selectedImagesSelector);
  const scaleFactor = useSelector(tileSizeSelector);
  const max_images = 1000; //number of images from the project that we'll show
  const [{ isOver }, dropTarget] = useDndFileDrop(onDrop);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handleClose = () => {
    setContextMenu(null);
  };

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
            <MainImageGridItem
              image={image}
              selected={selectedImages.includes(image.id)}
              selectionColor={imageSelectionColor}
              selectionSize={imageSelectionSize}
              key={image.id}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
            />
          ))}
        </ImageList>
        <ImageCategoryMenu
          open={contextMenu !== null}
          onClose={handleClose}
          anchorReference="anchorPosition"
          imageIds={selectedImages}
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        />

        <MainImageGridAppBar />
      </Container>
    </Box>
  );
};
