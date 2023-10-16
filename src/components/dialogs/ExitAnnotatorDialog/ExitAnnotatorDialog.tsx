import { batch, useDispatch, useSelector } from "react-redux";
import { DialogWithAction } from "../DialogWithAction";
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
      dispatch(imageViewerSlice.actions.setImageStack({ imageIds: [] }));
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
    <DialogWithAction
      title="Save Changes?"
      content="Would you like to save the changes to these annotations and return to the project page?"
      onConfirm={onSaveChanges}
      confirmText="SAVE"
      onReject={onDiscardChanges}
      rejectText="DISCARD"
      onClose={onClose}
      isOpen={open}
    />
  );
};
