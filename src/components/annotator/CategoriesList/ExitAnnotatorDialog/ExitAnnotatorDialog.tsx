import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { Image } from "../../../../types/Image";
import { Partition } from "../../../../types/Partition";
import { projectSlice } from "../../../../store/slices";
import { useDispatch, useSelector } from "react-redux";
import {
  imagesSelector,
  selectedImagesSelector,
} from "../../../../store/selectors";
import { annotatorImagesSelector } from "../../../../store/selectors/annotatorImagesSelector";

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
  const projectImages = useSelector(imagesSelector);
  const selectedImages = useSelector(selectedImagesSelector);
  const annotatorImages = useSelector(annotatorImagesSelector);

  const onSaveAnnotations = () => {
    const unselectedImages = projectImages.filter((image: Image) => {
      return !selectedImages.includes(image.id);
    });

    //We update partition to TRAINING for the annotated images
    const updatedAnnotatorImages = annotatorImages.map((image: Image) => {
      let partition: Partition;
      if (image.annotations.length > 0) {
        //only update if image actually has annotations
        partition = Partition.Training;
      } else {
        partition = Partition.Inference;
      }
      return { ...image, partition: partition };
    });

    dispatch(
      projectSlice.actions.setImages({
        images: [...updatedAnnotatorImages, ...unselectedImages],
      })
    );

    onReturnToProject();
  };

  return (
    <Dialog onClose={onClose} open={open} maxWidth={"md"}>
      <DialogTitle>Save annotations?</DialogTitle>

      <DialogContent>
        Would you like to save these annotations and return to the project page?
        These annotations will be used for training.
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Stay on this page
        </Button>

        <Button onClick={onReturnToProject} color="primary">
          Discard changes and return to project
        </Button>

        <Button onClick={onSaveAnnotations} color="primary">
          Save annotations and return to project
        </Button>
      </DialogActions>
    </Dialog>
  );
};
