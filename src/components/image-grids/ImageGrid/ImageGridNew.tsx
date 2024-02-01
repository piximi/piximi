import { useCallback, useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container, Box, Grid } from "@mui/material";

import { useDialogHotkey, useDndFileDrop, useUpload } from "hooks";

import {
  selectSelectedImageIds,
  projectSlice,
  selectImageGridTab,
  //selectImageSortType, // Comented out until the sorting functions are updated
} from "store/slices/project";

import { dataSlice } from "store/slices/data";

import { HotkeyView, Partition } from "types";
import { ImageShapeEnum, ImageShapeInfo } from "utils/common/image";
import { imageViewerSlice } from "store/slices/imageViewer";
import { TabContext } from "components/styled-components";
import { GridItemActionBar } from "components/app-bars";
import { DialogWithAction, ImageShapeDialog } from "components/dialogs";
import { selectThingsOfKind } from "store/slices/newData/";
import { NewAnnotationType } from "types/AnnotationType";
import { NewImageType } from "types/ImageType";
import { ProjectGridItemNew } from "../ProjectGridItem/ProjectGridItemNew";

const max_images = 1000; //number of images from the project that we'll show

export const ImageGridNew = ({ kind }: { kind: string }) => {
  const dispatch = useDispatch();
  const tabIndex = useContext(TabContext);
  // const sortFunction = useSelector(selectImageSortType); // wait intil sorting functions are updated
  const currentTab = useSelector(selectImageGridTab);
  const things = useSelector(selectThingsOfKind)(kind);
  const selectedImageIds = useSelector(selectSelectedImageIds);

  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);
  const [imageShape, setImageShape] = useState<ImageShapeInfo>({
    shape: ImageShapeEnum.InvalidImage,
  });
  const [files, setFiles] = useState<FileList>();

  //const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();

  const {
    onClose: handleCloseDeleteImagesDialog,
    onOpen: onOpenDeleteImagesDialog,
    open: deleteImagesDialogisOpen,
  } = useDialogHotkey(HotkeyView.DialogWithAction);

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

  const handleCloseDimensionsDialog = () => {
    setOpenDimensionsDialogBox(false);
  };

  const handleSelectAll = useCallback(() => {
    dispatch(
      projectSlice.actions.setSelectedImages({
        ids: things.map((thing) => thing.id),
      })
    );
  }, [things, dispatch]);

  const handleDeselectAll = () => {
    dispatch(projectSlice.actions.setSelectedImages({ ids: [] }));
  };

  const handleDelete = () => {
    dispatch(
      dataSlice.actions.deleteImages({
        imageIds: selectedImageIds,
        disposeColorTensors: true,
        isPermanent: true,
      })
    );
    dispatch(projectSlice.actions.setSelectedImages({ ids: [] }));
  };

  const handleClick = useCallback(
    (id: string, selected: boolean) => {
      if (selected) {
        dispatch(projectSlice.actions.deselectImages({ ids: id }));
      } else {
        dispatch(projectSlice.actions.selectImages({ ids: id }));
      }
    },
    [dispatch]
  );

  const handleUpdate = (categoryId: string) => {
    const updates = selectedImageIds.map((imageId) => ({
      id: imageId,
      categoryId: categoryId,
      partition: Partition.Unassigned,
    }));
    dispatch(
      dataSlice.actions.updateImages({
        updates,
        isPermanent: true,
      })
    );
    dispatch(projectSlice.actions.setSelectedImages({ ids: [] }));
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

  //   useHotkeys("esc", () => handleDeselectAll(), HotkeyView.ProjectView, {
  //     enabled: tabIndex === 0,
  //   });
  //   useHotkeys(
  //     "backspace, delete",
  //     () => onOpenDeleteImagesDialog(),
  //     HotkeyView.ProjectView,
  //     { enabled: tabIndex === 0 }
  //   );
  //   useHotkeys(
  //     "control+a",
  //     () => handleSelectAll(),
  //     HotkeyView.ProjectView,
  //     { enabled: tabIndex === 0 },
  //     [images]
  //   );

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
              dispatch(projectSlice.actions.setSelectedImages({ ids: [] }));
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
              {things
                .slice(0, max_images)
                //.sort(sortFunction.comparerFunction) // wait until sorting fuctions updated

                .map((thing: NewImageType | NewAnnotationType) => (
                  <ProjectGridItemNew
                    key={thing.id}
                    thing={thing}
                    handleClick={handleClick}
                    selected={selectedImageIds.includes(thing.id)}
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
          selectAllObjects={handleSelectAll}
          deselectAllObjects={handleDeselectAll}
          handleOpenDeleteDialog={onOpenDeleteImagesDialog}
          onOpenImageViewer={handleOpenImageViewer}
          onUpdateCategories={handleUpdate}
        />
      )}

      <DialogWithAction
        title={`Delete ${selectedImageIds.length} image${
          selectedImageIds.length > 1 ? "s" : ""
        }?`}
        content="Images will be deleted from the project."
        onConfirm={handleDelete}
        isOpen={deleteImagesDialogisOpen}
        onClose={handleCloseDeleteImagesDialog}
      />
      {files?.length && (
        <ImageShapeDialog
          files={files}
          open={openDimensionsDialogBox}
          onClose={handleCloseDimensionsDialog}
          isUploadedFromAnnotator={false}
          referenceImageShape={imageShape}
        />
      )}
    </>
  );
};
