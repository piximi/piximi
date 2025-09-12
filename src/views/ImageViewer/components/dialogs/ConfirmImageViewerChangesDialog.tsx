import { batch, useDispatch } from "react-redux";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { annotatorSlice } from "views/ImageViewer/state/annotator";

import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import { useSavedDataState } from "views/ImageViewer/state/DataContext";
import { dataSlice } from "store/data";
import { useNavigate } from "react-router-dom";

type ConfirmImageViewerChangesDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ConfirmImageViewerChangesDialog = ({
  onClose,
  open,
}: ConfirmImageViewerChangesDialogProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { savedData } = useSavedDataState();

  const handleSaveChanges = (save: boolean) => {
    if (!save) {
      if (savedData)
        dispatch(dataSlice.actions.initializeLoadedState(savedData));
    } else {
      if (savedData) {
        Object.values(savedData.images.entities).forEach((image) =>
          image.data.dispose(),
        );
        Object.values(savedData.annotations.entities).forEach((annotation) =>
          annotation.data.dispose(),
        );
      }
    }
    navigate("/project");
    batch(() => {
      dispatch(imageViewerDataSlice.actions.resetState());
      dispatch(imageViewerSlice.actions.resetImageViewer());
      dispatch(annotatorSlice.actions.resetAnnotator());
    });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <ConfirmationDialog
      title="Save Changes?"
      content="Would you like to save the changes to these annotations and return to the project page?"
      onConfirm={() => handleSaveChanges(true)}
      confirmText="SAVE"
      onReject={() => handleSaveChanges(false)}
      rejectText="DISCARD"
      onClose={handleClose}
      isOpen={open}
    />
  );
};
