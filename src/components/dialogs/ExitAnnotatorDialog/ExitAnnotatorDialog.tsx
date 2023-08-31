import { batch, useDispatch, useSelector } from "react-redux";

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
} from "@mui/material";

import { imageViewerSlice, selectActiveImageId } from "store/imageViewer";
import { dataSlice } from "store/data";

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

  const activeImageId = useSelector(selectActiveImageId);

  const onSaveChanges = () => {
    batch(() => {
      dispatch(
        imageViewerSlice.actions.setActiveImageId({
          imageId: undefined,
          prevImageId: activeImageId,
          execSaga: true,
        })
      );
      dispatch(dataSlice.actions.reconcile({ keepChanges: true }));
    });

    onReturnToProject();
  };

  const onDiscardChanges = () => {
    batch(() => {
      dispatch(
        imageViewerSlice.actions.setActiveImageId({
          imageId: undefined,
          prevImageId: activeImageId,
          execSaga: true,
        })
      );
      dispatch(dataSlice.actions.reconcile({ keepChanges: false }));
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

      <Button onClick={onDiscardChanges} color="primary">
        Discard changes and exit
      </Button>

      <Button onClick={onSaveChanges} color="primary">
        Save changes and exit
      </Button>
      <Stack />
    </Dialog>
  );
};
