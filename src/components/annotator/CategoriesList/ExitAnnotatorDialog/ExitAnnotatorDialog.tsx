import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import { ImageType } from "../../../../types/ImageType";
import { projectSlice } from "../../../../store/slices";
import { useDispatch, useSelector } from "react-redux";
import {
  imagesSelector,
  selectedImagesSelector,
} from "../../../../store/selectors";
import { annotatorImagesSelector } from "../../../../store/selectors/annotatorImagesSelector";
import Stack from "@mui/material/Stack";

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
    const unselectedImages = projectImages.filter((image: ImageType) => {
      return !selectedImages.includes(image.id);
    });

    dispatch(
      projectSlice.actions.setImages({
        images: [...annotatorImages, ...unselectedImages],
      })
    );

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

      <Button onClick={onReturnToProject} color="primary">
        Discard changes and return to project
      </Button>

      <Button onClick={onSaveAnnotations} color="primary">
        Save annotations and return to project
      </Button>
      <Stack />
    </Dialog>
  );
};
