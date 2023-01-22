import { batch, useDispatch, useSelector } from "react-redux";
import _ from "lodash";

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
} from "@mui/material";

import { imageViewerSlice, annotatorImagesSelector } from "store/image-viewer";
import { selectedImagesSelector } from "store/common";
import { projectSlice } from "store/project";

import { ImageType, ShadowImageType } from "types";

type ExitAnnotatorDialogProps = {
  onReturnToProject: () => void;
  onClose: () => void;
  open: boolean;
};

export const ExitAnnotatorDialog = ({
  onReturnToProject,
  onClose,
  open,
}: ExitAnnotatorDialogProps) => {
  const dispatch = useDispatch();

  const annotatorImages = useSelector(annotatorImagesSelector);
  const selectedImagesIds = useSelector(selectedImagesSelector);

  // TODO: post PR #383 - make these selectors
  const getImageSets = () => {
    const annotatorImagesIds = annotatorImages.map(
      (image: ShadowImageType) => image.id
    );

    const modifiedImagesIds = _.intersection(
      selectedImagesIds,
      annotatorImagesIds
    );
    const deletedImagesIds = _.difference(selectedImagesIds, modifiedImagesIds);
    const newImagesIds = _.difference(annotatorImagesIds, modifiedImagesIds);

    const modifiedImages = annotatorImages.filter((image: ShadowImageType) => {
      return modifiedImagesIds.includes(image.id);
    });

    const newImages = annotatorImages.filter((image: ShadowImageType) => {
      return newImagesIds.includes(image.id);
    }) as Array<ImageType>;

    return { newImages, modifiedImages, deletedImagesIds };
  };

  const onSaveAnnotations = () => {
    if (selectedImagesIds.length === 0) {
      batch(() => {
        dispatch(
          projectSlice.actions.setImages({
            images: annotatorImages as Array<ImageType>,
          })
        );
        dispatch(
          imageViewerSlice.actions.setImages({
            images: [],
            disposeColorTensors: false,
          })
        );
        dispatch(
          imageViewerSlice.actions.setActiveImage({
            imageId: undefined,
            execSaga: true,
          })
        );
      });
    } else {
      const { newImages, modifiedImages, deletedImagesIds } = getImageSets();

      batch(() => {
        dispatch(projectSlice.actions.addImages({ images: newImages }));
        dispatch(projectSlice.actions.deleteImages({ ids: deletedImagesIds }));
        dispatch(
          projectSlice.actions.reconcileImages({ images: modifiedImages })
        );
        dispatch(
          imageViewerSlice.actions.setImages({
            images: [],
            disposeColorTensors: false,
          })
        );
        dispatch(
          imageViewerSlice.actions.setActiveImage({
            imageId: undefined,
            execSaga: true,
          })
        );
      });
    }

    onReturnToProject();
  };

  const onDiscardAnnotations = () => {
    const { newImages } = getImageSets();

    for (const im of newImages) {
      im.data.dispose();
    }

    batch(() => {
      dispatch(
        imageViewerSlice.actions.setImages({
          images: [],
          disposeColorTensors: true,
        })
      );

      dispatch(
        imageViewerSlice.actions.setActiveImage({
          imageId: undefined,
          execSaga: true,
        })
      );
    });

    onReturnToProject();
  };

  return (
    <Dialog onClose={onClose} open={open} maxWidth={"md"}>
      <DialogTitle>Save annotations?</DialogTitle>

      <DialogContent sx={{ pb: 0 }}>
        Would you like to save these annotations and return to the project page?
        <br />
        These annotations will be used for training.
      </DialogContent>

      <Stack direction="column" />
      <Button onClick={onClose} color="primary">
        Stay on this page
      </Button>

      <Button onClick={onDiscardAnnotations} color="primary">
        Discard changes and return to project
      </Button>

      <Button onClick={onSaveAnnotations} color="primary">
        Save annotations and return to project
      </Button>
      <Stack />
    </Dialog>
  );
};
