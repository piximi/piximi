import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container, ImageList, Box } from "@mui/material";

import { useDndFileDrop, useContextMenu } from "hooks";

import { MainImageGridItem } from "../MainImageGridItem";
import { ImageCategoryMenu } from "../ImageCategoryMenu";
import { MainImageGridAppBar } from "../MainImageGridAppBar";
import {
  tileSizeSelector,
  imageSelectionColorSelector,
  imageSelectionSizeSelector,
  registerHotkeyView,
  unregisterHotkeyView,
} from "store/application";
import { visibleImagesSelector, selectedImagesSelector } from "store/common";

import { HotkeyView, ImageType } from "types";
import { updateHighlightedCategory } from "store/project/projectSlice";
import { highlightedCategoriesSelector } from "store/project/selectors/highlightedCategorySelector";
import { updateImageCategories } from "store/project";
import { useHotkeys } from "hooks";

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
  const highlightedCategoryId = useSelector(highlightedCategoriesSelector);
  const dispatch = useDispatch();
  const hotkeyView = HotkeyView.MainImageGrid;

  useHotkeys(
    "shift+1,shift+2,shift+3,shift+4,shift+5,shift+6,shift+7,shift+8,shift+9,shift+0",
    (event: any, _handler) => {
      console.log(categoryIndex);
      console.log("SHIFT+SOMETHING FIRED", event);
      if (!event.repeat) {
        setCategoryIndex((index) => {
          console.log(index);
          return index + _handler.key[_handler.key.length - 1].toString();
        });
      }
    },
    hotkeyView
  );
  useHotkeys(
    "shift+backspace",
    (event) => {
      if (!event.repeat) {
        setCategoryIndex((index) => {
          console.log(index);
          return index.slice(0, index.length - 1);
        });
      }
    },
    hotkeyView
  );
  useHotkeys(
    "shift",
    () => {
      if (highlightedCategoryId) {
        dispatch(
          updateImageCategories({
            ids: selectedImages,
          })
        );
      }
      setCategoryIndex("");
    },
    hotkeyView,
    { keyup: true },
    [dispatch]
  );

  useEffect(() => {
    console.log("updating highighted categoriyIndex with", categoryIndex);
    dispatch(
      updateHighlightedCategory({ categoryIndex: parseInt(categoryIndex) })
    );
  }, [categoryIndex, dispatch]);

  useEffect(() => {
    console.log("register");
    dispatch(registerHotkeyView({ hotkeyView: HotkeyView.MainImageGrid }));
    return () => {};
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
