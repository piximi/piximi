import { batch, useDispatch, useSelector } from "react-redux";
import { intersection, difference } from "lodash";

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
} from "@mui/material";

import {
  AnnotatorSlice,
  annotatorImagesSelector,
  activeImageIdSelector,
} from "store/annotator";
import { selectedImagesSelector } from "store/project";

import { OldImageType, ShadowImageType } from "types";

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

  const activeImageId = useSelector(activeImageIdSelector);

  // TODO: post PR #407 - make these selectors
  const getImageSets = () => {
    const annotatorImagesIds = annotatorImages.map(
      (image: ShadowImageType) => image.id
    );

    const modifiedImagesIds = intersection(
      selectedImagesIds,
      annotatorImagesIds
    );
    const deletedImagesIds = difference(selectedImagesIds, modifiedImagesIds);
    const newImagesIds = difference(annotatorImagesIds, modifiedImagesIds);

    const modifiedImages = annotatorImages.filter((image: ShadowImageType) => {
      return modifiedImagesIds.includes(image.id);
    });

    const newImages = annotatorImages.filter((image: ShadowImageType) => {
      return newImagesIds.includes(image.id);
    }) as Array<OldImageType>;

    return { newImages, modifiedImages, deletedImagesIds };
  };

  const onSaveAnnotations = () => {
    batch(() => {
      dispatch(
        AnnotatorSlice.actions.setActiveImage({
          imageId: undefined,
          prevImageId: activeImageId,
          execSaga: true,
        })
      );
    });

    onReturnToProject();
  };

  const onDiscardAnnotations = () => {
    const { newImages } = getImageSets();

    for (const im of newImages) {
      im.data.dispose();
    }

    batch(() => {
      dispatch(
        AnnotatorSlice.actions.setActiveImage({
          imageId: undefined,
          prevImageId: activeImageId,
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
