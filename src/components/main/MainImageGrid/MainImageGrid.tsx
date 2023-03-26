import { ReactElement, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container, Box, Tabs, Tab, Grid } from "@mui/material";

import { useDndFileDrop, useContextMenu, useHotkeys } from "hooks";

import { MainImageGridItem } from "../MainImageGridItem";
import { ImageCategoryMenu } from "../ImageCategoryMenu";
import { MainImageGridAppBar } from "../MainImageGridAppBar";

import {
  updateHighlightedCategory,
  highlightedCategoriesSelector,
  selectedImagesIdSelector,
} from "store/project";

import {
  imageSelectionColorSelector,
  registerHotkeyView,
  selectedImageBorderWidthSelector,
  unregisterHotkeyView,
} from "store/application";

import { dataSlice, selectVisibleImages } from "store/data";

import { HotkeyView, ImageType } from "types";

interface TabPanelProps {
  children?: ReactElement;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ padding: "1rem" }}
    >
      {value === index && children}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

type MainImageGridProps = {
  onDrop: (files: FileList) => void;
};

export const MainImageGrid = ({ onDrop }: MainImageGridProps) => {
  const images = useSelector(selectVisibleImages);
  const imageSelectionColor = useSelector(imageSelectionColorSelector);
  const selectedImageBorderWidth = useSelector(
    selectedImageBorderWidthSelector
  );
  const highlightedCategory = useSelector(highlightedCategoriesSelector);
  const selectedImages = useSelector(selectedImagesIdSelector);
  const max_images = 1000; //number of images from the project that we'll show
  const [{ isOver }, dropTarget] = useDndFileDrop(onDrop);
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();
  const [categoryIndex, setCategoryIndex] = useState<string>("");
  const dispatch = useDispatch();
  const hotkeyViews = [
    HotkeyView.MainImageGrid,
    HotkeyView.MainImageGridAppBar,
  ];

  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useHotkeys(
    "shift+1,shift+2,shift+3,shift+4,shift+5,shift+6,shift+7,shift+8,shift+9,shift+0",
    (event: any, _handler) => {
      if (!event.repeat) {
        setCategoryIndex((index) => {
          return index + _handler.key.at(-1)!.toString();
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
        dataSlice.actions.updateImageCategories({
          imageIds: selectedImages,
          categoryId: highlightedCategory,
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
      sx={(theme) => ({
        width: "calc(100% - 256px)", // magic number
        flexGrow: 1,
        height: "100%",
        paddingTop: theme.spacing(8),
        marginLeft: theme.spacing(32),
      })}
    >
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={value} onChange={handleChange} aria-label="tabbed-view">
          <Tab label="Images" {...a11yProps(0)} />
          <Tab label="Objects" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <Box
          component="main"
          ref={dropTarget}
          sx={(theme) => ({
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
              height: "100%",
            })}
            maxWidth={false}
          >
            <div onContextMenu={handleContextMenu}>
              <Grid
                container
                gap={2}
                sx={{ transform: "translateZ(0)", height: "100%" }}
              >
                {images.slice(0, max_images).map((image: ImageType) => (
                  <MainImageGridItem
                    image={image}
                    selected={selectedImages.includes(image.id)}
                    selectionColor={imageSelectionColor}
                    selectedImageBorderWidth={selectedImageBorderWidth}
                    key={image.id}
                  />
                ))}
              </Grid>

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
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Box
          component="main"
          ref={dropTarget}
          sx={(theme) => ({
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
              height: "100%",
            })}
            maxWidth={false}
          >
            <div onContextMenu={handleContextMenu}>
              <Grid
                container
                gap={2}
                sx={{ transform: "translateZ(0)", height: "100%" }}
              >
                {[].map((image: ImageType) => (
                  <MainImageGridItem
                    image={image}
                    selected={selectedImages.includes(image.id)}
                    selectionColor={imageSelectionColor}
                    selectedImageBorderWidth={selectedImageBorderWidth}
                    key={image.id}
                  />
                ))}
              </Grid>

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
      </TabPanel>
    </Box>
  );
};
