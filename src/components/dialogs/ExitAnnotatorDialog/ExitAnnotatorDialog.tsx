import { batch, useDispatch, useSelector } from "react-redux";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

import { imageViewerSlice } from "store/imageViewer";
import { dataSlice } from "store/data/";
import { annotatorSlice } from "store/annotator";

import { selectActiveImageId } from "store/imageViewer/selectors";

type ExitAnnotatorDialogProps = {
  returnToProject: () => void;
  onClose: () => void;
  open: boolean;
};

export const ExitAnnotatorDialog = ({
  returnToProject,
  onClose,
  open,
}: ExitAnnotatorDialogProps) => {
  const dispatch = useDispatch();

  const activeImageId = useSelector(selectActiveImageId);

  const handleSaveChanges = () => {
    batch(() => {
      dispatch(
        imageViewerSlice.actions.setActiveImageId({
          imageId: undefined,
          prevImageId: activeImageId,
        })
      );
      dispatch(dataSlice.actions.reconcile({ keepChanges: true }));
      dispatch(imageViewerSlice.actions.setImageStack({ imageIds: [] }));
      dispatch(
        imageViewerSlice.actions.setSelectedAnnotationIds({
          annotationIds: [],
          workingAnnotationId: undefined,
        })
      );
      dispatch(
        imageViewerSlice.actions.setWorkingAnnotation({ annotation: undefined })
      );
      dispatch(annotatorSlice.actions.resetAnnotator());
    });
    returnToProject();
  };

  const handleDiscardChanges = () => {
    batch(() => {
      dispatch(
        imageViewerSlice.actions.setActiveImageId({
          imageId: undefined,
          prevImageId: activeImageId,
        })
      );
      dispatch(dataSlice.actions.reconcile({ keepChanges: false }));
      dispatch(
        imageViewerSlice.actions.setSelectedAnnotationIds({
          annotationIds: [],
          workingAnnotationId: undefined,
        })
      );
      dispatch(
        imageViewerSlice.actions.setWorkingAnnotation({ annotation: undefined })
      );
      dispatch(annotatorSlice.actions.resetAnnotator());
    });
    returnToProject();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <ConfirmationDialog
      title="Save Changes?"
      content="Would you like to save the changes to these annotations and return to the project page?"
      onConfirm={handleSaveChanges}
      confirmText="SAVE"
      onReject={handleDiscardChanges}
      rejectText="DISCARD"
      onClose={handleClose}
      isOpen={open}
    />
  );
};
