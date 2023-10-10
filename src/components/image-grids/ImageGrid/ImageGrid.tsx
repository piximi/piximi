import { useCallback, useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container, Box, Grid } from "@mui/material";

import { useDialogHotkey, useDndFileDrop, useHotkeys, useUpload } from "hooks";

import {
  selectSelectedImageIds,
  projectSlice,
  selectImageGridTab,
  selectImageSortType,
} from "store/project";

import { dataSlice, selectVisibleImages } from "store/data";

import { HotkeyView, ImageType } from "types";
import { ImageGridItem } from "../ImageGridItem/ImageGridItem";
import { ImageShapeEnum, ImageShapeInfo } from "utils/common/image";
import { imageViewerSlice } from "store/imageViewer";
import { TabContext } from "components/styled-components";
import { GridItemActionBar } from "components/app-bars";
import { DialogWithAction, ImageShapeDialog } from "components/dialogs";

const max_images = 1000; //number of images from the project that we'll show

export const ImageGrid = () => {
  const dispatch = useDispatch();
  const tabIndex = useContext(TabContext);
  const sortFunction = useSelector(selectImageSortType);
  const currentTab = useSelector(selectImageGridTab);
  const images = useSelector(selectVisibleImages);
  const selectedImageIds = useSelector(selectSelectedImageIds);

  //const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();

  const {
    onClose: handleCloseDeleteImagesDialog,
    onOpen: onOpenDeleteImagesDialog,
    open: deleteImagesDialogisOpen,
  } = useDialogHotkey(HotkeyView.SimpleCancelConfirmDialog);

  // ************ File IO ***************

  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);
  const [imageShape, setImageShape] = useState<ImageShapeInfo>({
    shape: ImageShapeEnum.InvalidImage,
  });
  const [files, setFiles] = useState<FileList>();
  const uploadFiles = useUpload(setOpenDimensionsDialogBox, false);
  const handleDrop = useCallback(
    async (files: FileList) => {
      const imageShapeInfo = await uploadFiles(files);
      setImageShape(imageShapeInfo);
      setFiles(files);
    },
    [uploadFiles]
  );
  const [{ isOver }, dropTarget] = useDndFileDrop(handleDrop);
  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
  };

  // ************ File IO ***************

  const selectAllImages = useCallback(() => {
    dispatch(
      projectSlice.actions.setSelectedImages({
        imageIds: images.map((image) => image.id),
      })
    );
  }, [images, dispatch]);
  const deleteImages = () => {
    dispatch(
      dataSlice.actions.deleteImages({
        imageIds: selectedImageIds,
        disposeColorTensors: true,
        isPermanent: true,
      })
    );
    dispatch(projectSlice.actions.setSelectedImages({ imageIds: [] }));
  };

  const deselectAllImages = () => {
    dispatch(projectSlice.actions.setSelectedImages({ imageIds: [] }));
  };
  const handleDeleteImages = () => {
    handleCloseDeleteImagesDialog();
    deleteImages();
  };

  const handleOpenImageViewer = () => {
    dispatch(
      imageViewerSlice.actions.setImageStack({ imageIds: selectedImageIds })
    );
    dispatch(
      imageViewerSlice.actions.setActiveImageId({
        imageId: selectedImageIds.length > 0 ? selectedImageIds[0] : undefined,
        prevImageId: undefined,
        execSaga: true,
      })
    );
  };

  const handleImageClick = useCallback(
    (id: string, selected: boolean) => {
      if (selected) {
        dispatch(projectSlice.actions.deselectImage({ id: id }));
      } else {
        dispatch(projectSlice.actions.selectImage({ imageId: id }));
      }
    },
    [dispatch]
  );

  const handleUpdateCategories = (categoryId: string) => {
    const updates = selectedImageIds.map((imageId) => ({
      id: imageId,
      categoryId: categoryId,
    }));
    dispatch(
      dataSlice.actions.updateImages({
        updates,
        isPermanent: true,
      })
    );
    dispatch(projectSlice.actions.clearSelectedImages());
  };

  useHotkeys("esc", () => deselectAllImages(), HotkeyView.ProjectView, {
    enabled: tabIndex === 0,
  });
  useHotkeys(
    "backspace, delete",
    () => onOpenDeleteImagesDialog(),
    HotkeyView.ProjectView,
    { enabled: tabIndex === 0 }
  );
  useHotkeys(
    "control+a",
    () => selectAllImages(),
    HotkeyView.ProjectView,
    { enabled: tabIndex === 0 },
    [images]
  );

  return (
    <>
      <Box
        component="main"
        ref={dropTarget}
        sx={(theme) => ({
          transition: theme.transitions.create("margin", {
            duration: theme.transitions.duration.enteringScreen,
            easing: theme.transitions.easing.easeOut,
          }),
          border: isOver ? "5px solid blue" : "",
          height: "calc(100vh - 64px - 49px)",
        })}
      >
        <Container
          sx={(theme) => ({
            paddingBottom: theme.spacing(8),
            height: "100%",
            overflowY: "scroll",
          })}
          maxWidth={false}
        >
          <div
            onClick={() => {
              dispatch(
                projectSlice.actions.setSelectedImages({ imageIds: [] })
              );
            }}
          >
            <Grid
              container
              gap={2}
              sx={{
                transform: "translateZ(0)",
                height: "100%",
                overflowY: "scroll",
              }}
            >
              {images
                .slice(0, max_images)
                .sort(sortFunction.comparerFunction)
                .map((image: ImageType) => (
                  <ImageGridItem
                    key={image.id}
                    image={image}
                    handleClick={handleImageClick}
                    selected={selectedImageIds.includes(image.id)}
                  />
                ))}
            </Grid>

            {/*<ImageCategoryMenu
            open={contextMenu !== null}
            onClose={closeContextMenu}
            anchorReference="anchorPosition"
            imageIds={selectedImageIds}
            anchorPosition={
              contextMenu !== null
                ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                : undefined
            }
          />*/}
          </div>
        </Container>
      </Box>
      {tabIndex === 0 && (
        <GridItemActionBar
          currentTab={currentTab}
          showAppBar={selectedImageIds.length > 0}
          selectedObjects={selectedImageIds}
          selectAllObjects={selectAllImages}
          deselectAllObjects={deselectAllImages}
          handleDeleteObjects={handleDeleteImages}
          handleOpenDeleteDialog={onOpenDeleteImagesDialog}
          onOpenImageViewer={handleOpenImageViewer}
          onUpdateCategories={handleUpdateCategories}
        />
      )}

      <DialogWithAction
        title={`Delete ${selectedImageIds.length} image${
          selectedImageIds.length > 1 ? "s" : ""
        }?`}
        content="Images will be deleted from the project."
        onConfirm={handleDeleteImages}
        isOpen={deleteImagesDialogisOpen}
        onClose={handleCloseDeleteImagesDialog}
      />
      {files?.length && (
        <ImageShapeDialog
          files={files}
          open={openDimensionsDialogBox}
          onClose={handleClose}
          isUploadedFromAnnotator={false}
          referenceImageShape={imageShape}
        />
      )}
    </>
  );
};
