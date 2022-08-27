import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container, ImageList, Box } from "@mui/material";

import { useDndFileDrop, useContextMenu, useHotkeys } from "hooks";

import { MainImageGridItem } from "../MainImageGridItem";
import { ImageCategoryMenu } from "../ImageCategoryMenu";
import { MainImageGridAppBar } from "../MainImageGridAppBar";

import {
  updateImageCategoryFromHighlighted,
  updateHighlightedCategory,
} from "store/project";
import {
  tileSizeSelector,
  imageSelectionColorSelector,
  imageSelectionSizeSelector,
  registerHotkeyView,
  unregisterHotkeyView,
} from "store/application";
import { visibleImagesSelector, selectedImagesSelector } from "store/common";

import { HotkeyView, ImageType } from "types";

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
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();
  const [categoryIndex, setCategoryIndex] = useState<string>("");
  const dispatch = useDispatch();
  const hotkeyViews = [
    HotkeyView.MainImageGrid,
    HotkeyView.MainImageGridAppBar,
  ];

  useHotkeys(
    "shift+1,shift+2,shift+3,shift+4,shift+5,shift+6,shift+7,shift+8,shift+9,shift+0",
    (event: any, _handler) => {
      if (!event.repeat) {
        setCategoryIndex((index) => {
          return index + _handler.key[_handler.key.length - 1].toString();
        });
      }
    },
    hotkeyViews
  );

  useHotkeys(
    "shift+backspace",
    (event) => {
      if (!event.repeat) {
        setCategoryIndex((index) => {
          return index.slice(0, index.length - 1);
        });
      }
    },
    hotkeyViews
  );

  useHotkeys(
    "shift",
    () => {
      dispatch(
        updateImageCategoryFromHighlighted({
          ids: selectedImages,
        })
      );

      setCategoryIndex("");
    },
    hotkeyViews,
    { keyup: true },
    [dispatch, selectedImages]
  );

  useEffect(() => {
    dispatch(
      updateHighlightedCategory({ categoryIndex: parseInt(categoryIndex) })
    );
  }, [categoryIndex, dispatch]);

  useEffect(() => {
    dispatch(registerHotkeyView({ hotkeyView: HotkeyView.MainImageGrid }));
    return () => {
      dispatch(unregisterHotkeyView({}));
    };
  }, [dispatch]);

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
        <div onContextMenu={handleContextMenu}>
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
              />
            ))}
          </ImageList>

          <ImageCategoryMenu
            open={contextMenu !== null}
            onClose={closeContextMenu}
            anchorReference="anchorPosition"
            imageIds={selectedImages}
            anchorPosition={
              contextMenu !== null
                ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                : undefined
            }
          />
        </div>
        <MainImageGridAppBar />
      </Container>
    </Box>
  );
};
