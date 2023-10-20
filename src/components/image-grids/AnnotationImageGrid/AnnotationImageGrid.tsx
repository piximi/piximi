import { useCallback, useEffect, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { Container, Grid } from "@mui/material";

import {
  dataSlice,
  selectImageById,
  selectVisibleAnnotations,
} from "store/data";

import { selectImageIdByAnnotation } from "store/data/selectors/annotation/annotationSelectors";
import { imageViewerSlice } from "store/imageViewer";
import {
  projectSlice,
  selectImageSortType,
  selectSelectedAnnotations,
  selectImageGridTab,
} from "store/project";
import { selectSelectedImageIds } from "store/project/selectors";
import { AnnotationGridItem } from "../AnnotationGridItem/AnnotationGridItem";
import { useDialogHotkey, useHotkeys } from "hooks";
import { Category, HotkeyView, Partition, ToolType } from "types";
import { DialogWithAction } from "components/dialogs";
import { GridItemActionBar } from "components/app-bars";
import { annotatorSlice } from "store/annotator";

// type AnnotationObjectGridProps = {
//   onDrop: (files: FileList) => void;
// };

export type AnnotationItemDetails = {
  name: string;
  id: string;
  src: string;
  width: number;
  height: number;
  category: Category;
  area: number | undefined;
  partition?: Partition;
};

export const AnnotationImageGrid = () => {
  const dispatch = useDispatch();
  const currentTab = useSelector(selectImageGridTab);
  const selectedAnnotations = useSelector(selectSelectedAnnotations);
  const imageIdByAnnotation = useSelector(selectImageIdByAnnotation);
  const selectedImageIds = useSelector(selectSelectedImageIds);
  const sortFunction = useSelector(selectImageSortType);
  const imageById = useSelector(selectImageById);
  const visibleAnnotations = useSelector(selectVisibleAnnotations);

  const [annotationDetails, setAnnotationDetails] = useState<
    AnnotationItemDetails[]
  >([]);

  const {
    onClose: handleCloseDeleteAnnotationssDialog,
    onOpen: handleOpenDeleteAnnotationsDialog,
    open: deleteAnnotationsDialogisOpen,
  } = useDialogHotkey(HotkeyView.DialogWithAction);

  const handleSelectAll = () => {
    const allAnnotationIds = visibleAnnotations.map(
      (annotation) => annotation.id
    );
    dispatch(
      projectSlice.actions.setSelectedAnnotations({
        ids: allAnnotationIds,
      })
    );
  };

  const handleDeselectAll = () => {
    dispatch(projectSlice.actions.setSelectedAnnotations({ ids: [] }));
  };

  const handleDelete = () => {
    dispatch(
      dataSlice.actions.deleteAnnotations({
        annotationIds: selectedAnnotations,
        isPermanent: true,
      })
    );
    dispatch(projectSlice.actions.setSelectedAnnotations({ ids: [] }));
  };

  const handleClick = useCallback(
    (id: string, selected: boolean) => {
      if (selected) {
        dispatch(projectSlice.actions.deselectAnnotations({ ids: id }));
      } else {
        dispatch(projectSlice.actions.selectAnnotations({ ids: id }));
      }
    },
    [dispatch]
  );

  const handleUpdate = (categoryId: string) => {
    dispatch(
      dataSlice.actions.updateAnnotations({
        updates: selectedAnnotations.map((id) => ({ id, categoryId })),
        isPermanent: true,
      })
    );
    dispatch(projectSlice.actions.setSelectedAnnotations({ ids: [] }));
  };

  const handleOpenImageViewer = () => {
    const annotationImageIds: string[] = [];
    for (const annotationId of selectedAnnotations) {
      const imageId = imageIdByAnnotation(annotationId);
      if (
        !selectedImageIds.includes(imageId) &&
        !annotationImageIds.includes(imageId)
      ) {
        annotationImageIds.push(imageId);
      }
    }
    const imageViewerImages = [...selectedImageIds, ...annotationImageIds];

    batch(() => {
      dispatch(
        imageViewerSlice.actions.setImageStack({ imageIds: imageViewerImages })
      );

      dispatch(
        imageViewerSlice.actions.setActiveImageId({
          imageId:
            imageViewerImages.length > 0 ? imageViewerImages[0] : undefined,
          prevImageId: undefined,
          execSaga: true,
        })
      );
      dispatch(
        imageViewerSlice.actions.setSelectedAnnotationIds({
          annotationIds: selectedAnnotations,
        })
      );
      dispatch(
        imageViewerSlice.actions.setWorkingAnnotation({
          annotation: selectedAnnotations[0],
        })
      );
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: ToolType.Pointer,
        })
      );
    });
  };

  useHotkeys("esc", () => handleDeselectAll(), HotkeyView.ProjectView, {
    enabled: currentTab === "Annotations",
  });
  useHotkeys(
    "backspace, delete",
    () => handleOpenDeleteAnnotationsDialog(),
    HotkeyView.ProjectView,
    { enabled: currentTab === "Annotations" }
  );
  useHotkeys(
    "control+a",
    () => handleSelectAll(),
    HotkeyView.ProjectView,
    { enabled: currentTab === "Annotations" },
    [visibleAnnotations]
  );

  useEffect(() => {
    const details: AnnotationItemDetails[] = [];

    for (const annotation of visibleAnnotations) {
      let area = 0;
      for (let i = 0; i < annotation.encodedMask.length; i++) {
        if (i % 1 === 0) {
          area += annotation.encodedMask[i];
        }
      }
      details.push({
        name: imageById(annotation.imageId!).name,
        id: annotation.id,
        width: annotation.boundingBox[2] - annotation.boundingBox[0],
        height: annotation.boundingBox[3] - annotation.boundingBox[1],
        category: annotation.category,
        src: annotation.src!,
        area: area,
      });
    }
    setAnnotationDetails(details);
  }, [visibleAnnotations, imageById]);

  return (
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
            dispatch(projectSlice.actions.setSelectedAnnotations({ ids: [] }));
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
            {annotationDetails.length !== 0 &&
              annotationDetails
                .sort(sortFunction.comparerFunction)
                .map((details) => (
                  <AnnotationGridItem
                    selected={selectedAnnotations.includes(details.id)}
                    handleClick={handleClick}
                    details={details}
                    key={details.id}
                    category={details.category}
                  />
                ))}
          </Grid>
        </div>
      </Container>
      {currentTab === "Annotations" && (
        <GridItemActionBar
          currentTab={currentTab}
          showAppBar={selectedAnnotations.length > 0}
          selectedObjects={selectedAnnotations}
          selectAllObjects={handleSelectAll}
          deselectAllObjects={handleDeselectAll}
          handleOpenDeleteDialog={handleOpenDeleteAnnotationsDialog}
          onOpenImageViewer={handleOpenImageViewer}
          onUpdateCategories={handleUpdate}
        />
      )}

      <DialogWithAction
        title={`Delete ${selectedAnnotations.length} annotation${
          selectedAnnotations.length > 1 ? "s" : ""
        }?`}
        content={`The annotation${
          selectedAnnotations.length > 1 ? "s" : ""
        } will be permanently deleted from the project.`}
        onConfirm={handleDelete}
        isOpen={deleteAnnotationsDialogisOpen}
        onClose={handleCloseDeleteAnnotationssDialog}
      />
    </>
  );
};
