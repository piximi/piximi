import { useEffect, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { Container, Grid } from "@mui/material";

import { dataSlice, selectImageById } from "store/data";

import {
  selectAllAnnotations,
  selectImageIdByAnnotation,
} from "store/data/selectors/annotation/annotationSelectors";
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
import { HotkeyView, Partition } from "types";
import { DialogWithAction } from "components/dialogs";
import { GridItemActionBar } from "components/app-bars";

// type AnnotationObjectGridProps = {
//   onDrop: (files: FileList) => void;
// };

export type AnnotationItemDetails = {
  name: string;
  id: string;
  src: string;
  width: number;
  height: number;
  category: string;
  area: number | undefined;
  partition?: Partition;
};

export const AnnotationImageGrid = () => {
  const currentTab = useSelector(selectImageGridTab);
  const selectedAnnotations = useSelector(selectSelectedAnnotations);
  const imageIdByAnnotation = useSelector(selectImageIdByAnnotation);
  const selectedImageIds = useSelector(selectSelectedImageIds);
  const sortFunction = useSelector(selectImageSortType);
  const imageById = useSelector(selectImageById);
  const [annotationDetails, setAnnotationDetails] = useState<
    AnnotationItemDetails[]
  >([]);
  const allAnnotations = useSelector(selectAllAnnotations);
  const dispatch = useDispatch();

  const deleteAnnotations = () => {
    dispatch(
      dataSlice.actions.deleteAnnotations({
        annotationIds: selectedAnnotations,
        isPermanent: true,
      })
    );
    dispatch(
      projectSlice.actions.setSelectedAnnotations({ annotationIds: [] })
    );
  };
  const _selectAllAnnotations = () => {
    const allAnnotationIds = allAnnotations.map((annotation) => annotation.id);
    dispatch(
      projectSlice.actions.setSelectedAnnotations({
        annotationIds: allAnnotationIds,
      })
    );
  };
  const deselectAllAnnotations = () => {
    dispatch(
      projectSlice.actions.setSelectedAnnotations({ annotationIds: [] })
    );
  };

  const {
    onClose: handleCloseDeleteAnnotationssDialog,
    onOpen: onOpenDeleteAnnotationsDialog,
    open: deleteAnnotationsDialogisOpen,
  } = useDialogHotkey(HotkeyView.SimpleCancelConfirmDialog);

  const handleDeleteAnnotations = () => {
    handleCloseDeleteAnnotationssDialog();
    deleteAnnotations();
  };

  const handleOpenImageViewer = () => {
    const imageIds: string[] = [];
    for (const annotationId of selectedAnnotations) {
      const imageId = imageIdByAnnotation(annotationId);
      if (!selectedImageIds.includes(imageId) && !imageIds.includes(imageId)) {
        imageIds.push(imageId);
      }
    }
    const imageViewerImages = [...selectedImageIds, ...imageIds];

    batch(() => {
      dispatch(
        imageViewerSlice.actions.setImageStack({ imageIds: imageViewerImages })
      );
      dispatch(
        imageViewerSlice.actions.setSelectedAnnotationIds({
          annotationIds: selectedAnnotations,
        })
      );
      dispatch(
        imageViewerSlice.actions.setActiveImageId({
          imageId:
            imageViewerImages.length > 0 ? imageViewerImages[0] : undefined,
          prevImageId: undefined,
          execSaga: true,
        })
      );
    });
  };

  const handleAnnotationObjectClick = (id: string) => {
    if (selectedAnnotations.includes(id)) {
      dispatch(projectSlice.actions.deselectAnnotation({ annotationId: id }));
    } else {
      dispatch(projectSlice.actions.selectAnnotation({ annotationId: id }));
    }
  };

  const handleUpdateCategories = (categoryId: string) => {
    dispatch(
      dataSlice.actions.updateAnnotationCategories({
        annotationIds: selectedAnnotations,
        categoryId: categoryId,
        isPermanent: true,
      })
    );
    dispatch(
      projectSlice.actions.setSelectedAnnotations({ annotationIds: [] })
    );
  };

  useHotkeys("esc", () => deselectAllAnnotations(), HotkeyView.ProjectView, {
    enabled: currentTab === "Annotations",
  });
  useHotkeys(
    "backspace, delete",
    () => onOpenDeleteAnnotationsDialog(),
    HotkeyView.ProjectView,
    { enabled: currentTab === "Annotations" }
  );
  useHotkeys(
    "control+a",
    () => _selectAllAnnotations(),
    HotkeyView.ProjectView,
    { enabled: currentTab === "Annotations" },
    [allAnnotations]
  );

  useEffect(() => {
    const details: AnnotationItemDetails[] = [];

    for (const annotation of allAnnotations) {
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
        category: annotation.categoryId,
        src: annotation.src!,
        area: area,
      });
    }
    setAnnotationDetails(details);
  }, [allAnnotations, imageById]);

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
            dispatch(
              projectSlice.actions.setSelectedAnnotations({ annotationIds: [] })
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
            {annotationDetails.length !== 0 &&
              annotationDetails
                .sort(sortFunction.comparerFunction)
                .map((details) => (
                  <AnnotationGridItem
                    selected={selectedAnnotations.includes(details.id)}
                    handleClick={handleAnnotationObjectClick}
                    details={details}
                    key={details.id}
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
          selectAllObjects={_selectAllAnnotations}
          deselectAllObjects={deselectAllAnnotations}
          handleDeleteObjects={handleDeleteAnnotations}
          handleOpenDeleteDialog={onOpenDeleteAnnotationsDialog}
          onOpenImageViewer={handleOpenImageViewer}
          onUpdateCategories={handleUpdateCategories}
        />
      )}

      <DialogWithAction
        title={`Delete ${selectedAnnotations.length} image${
          selectedAnnotations.length > 1 ? "s" : ""
        }?`}
        content="Annotationss will be deleted from the project."
        onConfirm={handleDeleteAnnotations}
        isOpen={deleteAnnotationsDialogisOpen}
        onClose={handleCloseDeleteAnnotationssDialog}
      />
    </>
  );
};
