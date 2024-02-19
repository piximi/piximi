import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container, Grid } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { projectSlice } from "store/slices/project";

import { HotkeyView } from "types";
import { imageViewerSlice } from "store/slices/imageViewer";
import { DialogWithAction } from "components/dialogs";
import { selectThingsOfKind } from "store/slices/newData/";
import { NewAnnotationType } from "types/AnnotationType";
import { NewImageType } from "types/ImageType";
import { ProjectGridItemNew } from "../ProjectGridItem/ProjectGridItemNew";
import { useSortFunctionNew } from "hooks/useSortFunctionNew/useSortFunctionNew";
import { GridItemActionBarNew } from "components/app-bars/GridItemActionBar/GridItemActionBarNew";
import { selectActiveSelectedThings } from "store/slices/project/selectors/selectActiveSelectedThings";
import { DropBox } from "components/styled-components/DropBox/DropBox";
import { selectActiveKind } from "store/slices/project/selectors";

const max_images = 1000; //number of images from the project that we'll show

export const ImageGridNew = ({ kind }: { kind: string }) => {
  const dispatch = useDispatch();
  const activeKind = useSelector(selectActiveKind);
  const things = useSelector(selectThingsOfKind)(kind);
  const selectedThingIds = useSelector(selectActiveSelectedThings);
  const sortFunction = useSortFunctionNew();

  //const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();

  const {
    onClose: handleCloseDeleteImagesDialog,
    onOpen: onOpenDeleteImagesDialog,
    open: deleteImagesDialogisOpen,
  } = useDialogHotkey(HotkeyView.DialogWithAction);

  const handleSelectAll = useCallback(() => {
    dispatch(
      projectSlice.actions.selectThings({
        ids: things.map((thing) => thing.id),
      })
    );
  }, [things, dispatch]);

  const handleDeselectAll = () => {
    dispatch(
      projectSlice.actions.deselectThings({
        ids: things.map((thing) => thing.id),
      })
    );
  };

  const handleDelete = () => {
    console.log("update me"); //HACK:  implement after discussion
    dispatch(projectSlice.actions.deselectThings({ ids: selectedThingIds }));
  };

  const handleSelectThing = useCallback(
    (id: string, selected: boolean) => {
      if (selected) {
        dispatch(projectSlice.actions.deselectThings({ ids: id }));
      } else {
        dispatch(projectSlice.actions.selectThings({ ids: id }));
      }
    },
    [dispatch]
  );

  const handleOpenImageViewer = () => {
    dispatch(
      imageViewerSlice.actions.setImageStack({ imageIds: selectedThingIds })
    );
    dispatch(
      imageViewerSlice.actions.setActiveImageId({
        imageId: selectedThingIds.length > 0 ? selectedThingIds[0] : undefined,
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
    <DropBox>
      <>
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
                projectSlice.actions.deselectImages({ ids: selectedThingIds })
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
              {things
                .slice(0, max_images)
                .sort(sortFunction)

                .map((thing: NewImageType | NewAnnotationType) => (
                  <ProjectGridItemNew
                    key={thing.id}
                    thing={thing}
                    handleClick={handleSelectThing}
                    selected={selectedThingIds.includes(thing.id)}
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
        {kind === activeKind && (
          <GridItemActionBarNew
            allSelected={selectedThingIds.length === things.length}
            selectedThings={selectedThingIds}
            selectAllThings={handleSelectAll}
            deselectAllThings={handleDeselectAll}
            handleOpenDeleteDialog={onOpenDeleteImagesDialog}
            onOpenImageViewer={handleOpenImageViewer}
          />
        )}

        <DialogWithAction
          title={`Delete ${selectedThingIds.length} image${
            selectedThingIds.length > 1 ? "s" : ""
          }?`}
          content="Images will be deleted from the project."
          onConfirm={handleDelete}
          isOpen={deleteImagesDialogisOpen}
          onClose={handleCloseDeleteImagesDialog}
        />
      </>
    </DropBox>
  );
};
